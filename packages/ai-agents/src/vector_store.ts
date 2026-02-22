/**
 * Vector Store — Persistent Context & Pattern Reuse
 *
 * Uses ChromaDB for:
 * - Checkpointing agent outputs before context window resets
 * - Semantic search for similar past features (pattern reuse)
 * - Progressive cost reduction through embedding reuse
 * - Session recovery after crashes or restarts
 *
 * Architecture:
 * - ChromaDB runs as a separate service (docker or local)
 * - Embeddings generated via Anthropic or local model
 * - Collections per agent for domain-specific retrieval
 */

import { ChromaClient, Collection } from "chromadb";
import { nanoid } from "nanoid";
import pino from "pino";
import { GoogleGenerativeAI } from "@google/generative-ai";

import type { AgentId, VectorCheckpoint, SimilarPattern } from "./types.js";

const log = pino({ name: "vector-store" });

// ─── Vector Store Class ─────────────────────────────────────────────

export class VectorStore {
  private client: ChromaClient;
  private collections = new Map<string, Collection>();
  private initialized = false;
  private embedder: any;

  constructor(
    chromaUrl: string = "http://localhost:8000",
    geminiApiKey?: string,
  ) {
    this.client = new ChromaClient({ path: chromaUrl });

    if (geminiApiKey) {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
      this.embedder = {
        generate: async (texts: string[]) => {
          return await Promise.all(
            texts.map(async (text) => {
              try {
                const result = await model.embedContent(text);
                return result.embedding.values;
              } catch (e) {
                // Return dummy zeroes on error
                return new Array(768).fill(0);
              }
            }),
          );
        },
      };
    }
  }

  /** Initialize collections for each agent + a global session collection */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const collectionNames = [
      "agent_frontend_ui",
      "agent_frontend_bizlogic",
      "agent_backend_api",
      "agent_backend_database",
      "agent_qa_testing",
      "agent_architect",
      "agent_orchestrator",
      "agent_context_manager",
      "sessions",
      "features",
    ];

    for (const name of collectionNames) {
      try {
        const collection = await this.client.getOrCreateCollection({
          name,
          ...(this.embedder ? { embeddingFunction: this.embedder } : {}),
        });
        this.collections.set(name, collection);
      } catch (err) {
        log.error({ err, collection: name }, "Failed to init collection");
        throw err;
      }
    }

    this.initialized = true;
    log.info(
      "Vector store initialized with %d collections",
      collectionNames.length,
    );
  }

  // ─── Checkpoint Operations ──────────────────────────────────────

  /** Save an agent's output as a checkpoint for future reuse */
  async saveCheckpoint(
    checkpoint: Omit<VectorCheckpoint, "id" | "createdAt">,
  ): Promise<string> {
    const collection = this.getAgentCollection(checkpoint.agentId);
    const id = `cp_${nanoid(12)}`;

    await collection.add({
      ids: [id],
      documents: [checkpoint.content],
      metadatas: [
        {
          featureId: checkpoint.featureId,
          agentId: checkpoint.agentId,
          createdAt: new Date().toISOString(),
          ...checkpoint.metadata,
        },
      ],
    });

    log.info(
      { id, agentId: checkpoint.agentId, featureId: checkpoint.featureId },
      "Checkpoint saved",
    );
    return id;
  }

  /** Find similar past patterns for a given task description */
  async findSimilarPatterns(
    agentId: AgentId,
    query: string,
    limit: number = 3,
    minSimilarity: number = 0.7,
  ): Promise<SimilarPattern[]> {
    const collection = this.getAgentCollection(agentId);

    try {
      const results = await collection.query({
        queryTexts: [query],
        nResults: limit,
      });

      if (!results.documents?.[0]) return [];

      return results.documents[0]
        .map((doc, i) => ({
          checkpointId: results.ids[0][i],
          content: doc ?? "",
          similarity: results.distances
            ? 1 - (results.distances[0][i] ?? 1)
            : 0,
          featureId:
            (results.metadatas?.[0]?.[i] as Record<string, string>)
              ?.featureId ?? "",
          agentId:
            ((results.metadatas?.[0]?.[i] as Record<string, string>)
              ?.agentId as AgentId) ?? agentId,
        }))
        .filter((p) => p.similarity >= minSimilarity);
    } catch (err) {
      log.warn({ err, agentId }, "Similarity search failed, returning empty");
      return [];
    }
  }

  // ─── Feature Tracking ──────────────────────────────────────────

  /** Record completed feature for batch learning */
  async recordFeature(
    featureId: string,
    title: string,
    metadata: Record<string, string>,
  ): Promise<void> {
    const collection = this.collections.get("features");
    if (!collection) return;

    await collection.upsert({
      ids: [featureId],
      documents: [title],
      metadatas: [{ ...metadata, completedAt: new Date().toISOString() }],
    });
  }

  /** Find similar past features for batch grouping */
  async findSimilarFeatures(
    description: string,
    limit: number = 5,
  ): Promise<SimilarPattern[]> {
    const collection = this.collections.get("features");
    if (!collection) return [];

    const results = await collection.query({
      queryTexts: [description],
      nResults: limit,
    });

    if (!results.documents?.[0]) return [];

    return results.documents[0].map((doc, i) => ({
      checkpointId: results.ids[0][i],
      content: doc ?? "",
      similarity: results.distances ? 1 - (results.distances[0][i] ?? 1) : 0,
      featureId: results.ids[0][i],
      agentId: "orchestrator" as AgentId,
    }));
  }

  // ─── Cleanup ────────────────────────────────────────────────────

  /** Remove checkpoints older than N days */
  async pruneOldCheckpoints(
    agentId: AgentId,
    maxAgeDays: number = 30,
  ): Promise<number> {
    const collection = this.getAgentCollection(agentId);
    const cutoff = new Date(Date.now() - maxAgeDays * 86_400_000).toISOString();

    try {
      const all = await collection.get({
        where: { createdAt: { $lt: cutoff } },
      });

      if (all.ids.length > 0) {
        await collection.delete({ ids: all.ids });
        log.info({ agentId, pruned: all.ids.length }, "Pruned old checkpoints");
      }

      return all.ids.length;
    } catch {
      return 0;
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────

  private getAgentCollection(agentId: AgentId): Collection {
    const name = `agent_${agentId.replaceAll("-", "_")}`;
    const collection = this.collections.get(name);
    if (!collection) throw new Error(`Collection not found: ${name}`);
    return collection;
  }

  /** Stats for monitoring */
  async getStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};
    for (const [name, collection] of this.collections) {
      stats[name] = await collection.count();
    }
    return stats;
  }
}

export default VectorStore;
