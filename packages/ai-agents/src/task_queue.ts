/**
 * Task Queue — BullMQ-based 24/7 Feature Processing
 *
 * Provides:
 * - Persistent queue surviving restarts (backed by Redis)
 * - Priority-based feature processing
 * - Scheduled/delayed feature execution
 * - Automatic retry with backoff
 * - Batch grouping for similar features
 * - Cron-based daily summary reports
 * - Queue monitoring and health checks
 */

import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import pino from "pino";
import dotenv from "dotenv";

dotenv.config();

import type { FeatureRequest, QueuedFeature, Priority } from "./types.js";
import { loadConfig } from "./types.js";
import { MVPOrchestrator } from "./orchestrator_v4.js";

const log = pino({ name: "task-queue" });

// ─── Priority Mapping ───────────────────────────────────────────────

const PRIORITY_MAP: Record<Priority, number> = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
};

// ─── Feature Queue ──────────────────────────────────────────────────

export class FeatureQueue {
  private queue: Queue<QueuedFeature>;
  private worker: Worker<QueuedFeature> | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private connection: any;
  private orchestrator: MVPOrchestrator | null = null;

  constructor(redisUrl: string = "redis://localhost:6379") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.connection = new (IORedis as any)(redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.queue = new Queue<QueuedFeature>("feature-processing", {
      connection: this.connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { age: 86_400, count: 100 },
        removeOnFail: { age: 604_800 },
      },
    });
  }

  // ─── Add Features to Queue ────────────────────────────────────────

  /** Add a single feature to the processing queue */
  async addFeature(
    feature: FeatureRequest,
    options?: Partial<QueuedFeature>,
  ): Promise<string> {
    const queued: QueuedFeature = {
      feature,
      retryOnFail: options?.retryOnFail ?? true,
      maxRetries: options?.maxRetries ?? 3,
    };

    const job = await this.queue.add(feature.id, queued, {
      priority: PRIORITY_MAP[feature.priority],
      ...(options?.scheduledAt
        ? { delay: options.scheduledAt.getTime() - Date.now() }
        : {}),
      jobId: feature.id, // prevent duplicates
    });

    log.info(
      { featureId: feature.id, priority: feature.priority, jobId: job.id },
      "Feature queued",
    );
    return job.id!;
  }

  /** Add a batch of similar features for sequential processing */
  async addBatch(
    features: FeatureRequest[],
    batchGroup: string,
  ): Promise<string[]> {
    const ids: string[] = [];

    for (const feature of features) {
      feature.batchGroup = batchGroup;
      const id = await this.addFeature(feature);
      ids.push(id);
    }

    log.info({ batchGroup, count: features.length }, "Feature batch queued");
    return ids;
  }

  /** Schedule features for overnight/off-peak processing (50% Batch API savings) */
  async scheduleForOffPeak(features: FeatureRequest[]): Promise<void> {
    // Schedule for 2 AM local time
    const now = new Date();
    const next2AM = new Date(now);
    next2AM.setHours(2, 0, 0, 0);
    if (next2AM <= now) next2AM.setDate(next2AM.getDate() + 1);

    for (const feature of features) {
      await this.addFeature(feature, { scheduledAt: next2AM });
    }

    log.info(
      { count: features.length, scheduledFor: next2AM.toISOString() },
      "Features scheduled for off-peak",
    );
  }

  // ─── Worker (Processing Loop) ─────────────────────────────────────

  /** Start the worker that processes features from the queue */
  async startWorker(): Promise<void> {
    const config = loadConfig();
    this.orchestrator = new MVPOrchestrator(config);
    await this.orchestrator.initialize();

    this.worker = new Worker<QueuedFeature>(
      "feature-processing",
      async (job: Job<QueuedFeature>) => {
        const { feature } = job.data;

        log.info(
          {
            featureId: feature.id,
            title: feature.title,
            attempt: job.attemptsMade + 1,
          },
          "Processing queued feature",
        );

        // Update job progress
        await job.updateProgress(10);

        try {
          const metrics = await this.orchestrator!.processFeature(feature);
          await job.updateProgress(100);

          return {
            featureId: feature.id,
            cost: metrics.totalCost,
            successRate: metrics.successRate,
            readyForProd: metrics.readyForProduction,
          };
        } catch (err) {
          log.error(
            { err, featureId: feature.id },
            "Feature processing failed in queue",
          );
          throw err; // BullMQ will handle retry
        }
      },
      {
        connection: this.connection,
        concurrency: 1, // Process one feature at a time (cost control)
        limiter: { max: 5, duration: 3_600_000 }, // Max 5 features per hour
      },
    );

    this.worker.on("completed", (job, result) => {
      log.info(
        { featureId: job.data.feature.id, result },
        "Feature completed in queue",
      );
    });

    this.worker.on("failed", (job, err) => {
      log.error(
        { featureId: job?.data.feature.id, error: err.message },
        "Feature failed in queue",
      );
    });

    log.info("Queue worker started, listening for features");
  }

  // ─── Queue Management ─────────────────────────────────────────────

  /** Get queue health and statistics */
  async getStats(): Promise<Record<string, unknown>> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /** Pause processing */
  async pause(): Promise<void> {
    await this.queue.pause();
    log.info("Queue paused");
  }

  /** Resume processing */
  async resume(): Promise<void> {
    await this.queue.resume();
    log.info("Queue resumed");
  }

  /** Drain queue (remove all waiting jobs) */
  async drain(): Promise<void> {
    await this.queue.drain();
    log.info("Queue drained");
  }

  /** Graceful shutdown */
  async shutdown(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
    await this.queue.close();
    await this.connection.quit();
    log.info("Queue shut down gracefully");
  }
}

export { FeatureQueue };
