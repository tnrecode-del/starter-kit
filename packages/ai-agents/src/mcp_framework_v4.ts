/**
 * MCP Framework v4 — Real MCP Integration
 *
 * Changes from v3:
 * - Uses @modelcontextprotocol/sdk for real MCP client connections
 * - Stdio transport for local tools (filesystem, git, playwright)
 * - HTTP transport for remote services (postgres)
 * - On-demand lazy loading with connection pooling
 * - Tool discovery via semantic matching
 * - Tool definitions formatted for Claude API tools parameter
 *
 * Available MCP Servers (real, community-backed):
 * - filesystem-mcp-server: read/write/search files
 * - postgres-mcp-server: query PostgreSQL databases
 * - playwright-mcp-server: browser automation for testing
 * - git-mcp-server: git operations (commit, diff, log)
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import pino from "pino";

import type { MCPServerConfig, ToolDefinition } from "./types.js";

const log = pino({ name: "mcp-framework" });

// ─── MCP Server Registry ────────────────────────────────────────────
// Real MCP servers that can be installed and run

export const MCP_SERVER_CONFIGS: Record<string, MCPServerConfig> = {
  "filesystem-mcp-server": {
    name: "filesystem-mcp-server",
    description:
      "Read, write, search, and manage files in the project directory",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()],
  },

  "postgres-mcp-server": {
    name: "postgres-mcp-server",
    description: "Query PostgreSQL databases, inspect schemas, run migrations",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres"],
    env: {
      POSTGRES_URL:
        process.env.DATABASE_URL ?? "postgresql://localhost:5432/mvp",
    },
  },

  "git-mcp-server": {
    name: "git-mcp-server",
    description: "Git operations: commit, diff, log, branch, status",
    transport: "stdio",
    command: "npx",
    args: [
      "-y",
      "@modelcontextprotocol/server-git",
      "--repository",
      process.cwd(),
    ],
  },

  "playwright-mcp-server": {
    name: "playwright-mcp-server",
    description:
      "Browser automation: navigate, click, fill forms, take screenshots",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@playwright/mcp@latest"],
  },

  "shadcn-mcp-server": {
    name: "shadcn-mcp-server",
    description: "shadcn/ui component browser, search and usage examples",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@jpisnice/shadcn-ui-mcp-server"],
  },
};

// ─── MCP Client Manager ─────────────────────────────────────────────

interface ConnectedServer {
  client: Client;
  transport: StdioClientTransport | StreamableHTTPClientTransport;
  tools: ToolDefinition[];
  connectedAt: Date;
}

export class MCPClientManager {
  private connections = new Map<string, ConnectedServer>();
  private connecting = new Map<string, Promise<ConnectedServer>>();

  /**
   * Get or create connection to an MCP server.
   * Lazy-loads on first request, reuses on subsequent calls.
   */
  async getServer(serverName: string): Promise<ConnectedServer> {
    // Return existing connection
    const existing = this.connections.get(serverName);
    if (existing) return existing;

    // Prevent duplicate connection attempts
    const pending = this.connecting.get(serverName);
    if (pending) return pending;

    const connectPromise = this.connect(serverName);
    this.connecting.set(serverName, connectPromise);

    try {
      const server = await connectPromise;
      this.connections.set(serverName, server);
      return server;
    } finally {
      this.connecting.delete(serverName);
    }
  }

  /**
   * Get Claude-compatible tool definitions from specific MCP servers.
   * This is what gets passed to the Anthropic API `tools` parameter.
   */
  async getToolDefinitions(serverNames: string[]): Promise<ToolDefinition[]> {
    const tools: ToolDefinition[] = [];

    for (const name of serverNames) {
      try {
        const server = await this.getServer(name);
        tools.push(...server.tools);
      } catch (err) {
        log.warn(
          { err, server: name },
          "Failed to load tools from MCP server, skipping",
        );
      }
    }

    return tools;
  }

  /**
   * Call a specific tool on an MCP server
   */
  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    const server = await this.getServer(serverName);

    const result = await server.client.callTool({
      name: toolName,
      arguments: args,
    });

    if (result.isError) {
      throw new Error(`MCP tool error: ${JSON.stringify(result.content)}`);
    }

    return result.content;
  }

  /**
   * Search across all connected servers for tools matching a query
   */
  async discoverTools(
    query: string,
    serverNames?: string[],
  ): Promise<ToolDefinition[]> {
    const keywords = query.toLowerCase().split(/\s+/);
    const servers = serverNames ?? [...this.connections.keys()];
    const matches: ToolDefinition[] = [];

    for (const name of servers) {
      try {
        const server = await this.getServer(name);
        for (const tool of server.tools) {
          const text = `${tool.name} ${tool.description}`.toLowerCase();
          const score = keywords.filter((k) => text.includes(k)).length;
          if (score > 0) matches.push(tool);
        }
      } catch {
        // Server not available, skip
      }
    }

    // Sort by relevance (more keyword matches = higher)
    return matches.sort((a, b) => {
      const scoreA = keywords.filter((k) =>
        `${a.name} ${a.description}`.toLowerCase().includes(k),
      ).length;
      const scoreB = keywords.filter((k) =>
        `${b.name} ${b.description}`.toLowerCase().includes(k),
      ).length;
      return scoreB - scoreA;
    });
  }

  // ─── Connection Management ──────────────────────────────────────

  private async connect(serverName: string): Promise<ConnectedServer> {
    const config = MCP_SERVER_CONFIGS[serverName];
    if (!config) throw new Error(`Unknown MCP server: ${serverName}`);

    log.info(
      { server: serverName, transport: config.transport },
      "Connecting to MCP server",
    );

    const client = new Client({ name: "mvp-agent-system", version: "4.0.0" });
    let transport: StdioClientTransport | StreamableHTTPClientTransport;

    if (config.transport === "stdio") {
      if (!config.command)
        throw new Error(`No command for stdio MCP: ${serverName}`);
      transport = new StdioClientTransport({
        command: config.command,
        args: config.args ?? [],
        env: { ...process.env, ...(config.env ?? {}) } as Record<
          string,
          string
        >,
      });
    } else {
      if (!config.url) throw new Error(`No URL for HTTP MCP: ${serverName}`);
      transport = new StreamableHTTPClientTransport(new URL(config.url));
    }

    await client.connect(transport);

    // Discover available tools
    const toolsResponse = await client.listTools();
    const tools: ToolDefinition[] = (toolsResponse.tools ?? []).map((t) => ({
      name: t.name,
      description: t.description ?? "",
      input_schema: t.inputSchema as Record<string, unknown>,
    }));

    log.info(
      { server: serverName, toolCount: tools.length },
      "MCP server connected",
    );

    return { client, transport, tools, connectedAt: new Date() };
  }

  /** Disconnect all servers gracefully */
  async disconnectAll(): Promise<void> {
    for (const [name, server] of this.connections) {
      try {
        await server.client.close();
        log.info({ server: name }, "Disconnected MCP server");
      } catch (err) {
        log.warn({ err, server: name }, "Error disconnecting MCP server");
      }
    }
    this.connections.clear();
  }

  /** Get connection stats for monitoring */
  getStats(): Record<string, { tools: number; connectedAt: string }> {
    const stats: Record<string, { tools: number; connectedAt: string }> = {};
    for (const [name, server] of this.connections) {
      stats[name] = {
        tools: server.tools.length,
        connectedAt: server.connectedAt.toISOString(),
      };
    }
    return stats;
  }
}

export default MCPClientManager;
