/**
 * Shared Types — MVP Agent System v4
 *
 * Single source of truth for all interfaces used across
 * orchestrator, agents, MCP, vector store, and queue.
 */

// ─── Feature Pipeline ──────────────────────────────────────────────

export type Complexity = "simple" | "medium" | "complex";
export type Priority = "low" | "medium" | "high" | "critical";

export interface SpecTask {
  id: string;
  agent: AgentId;
  description: string;
  dependencies: string[];
}

export interface FeatureSpec {
  scope: string;
  tasks: SpecTask[];
}

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  complexity: Complexity;
  priority: Priority;
  businessValue: string;
  tags?: string[];
  batchGroup?: string; // for grouping similar features
}

// ─── Agent System ───────────────────────────────────────────────────

export type AgentId =
  | "frontend-ui"
  | "frontend-bizlogic"
  | "backend-api"
  | "backend-database"
  | "qa-testing"
  | "architect"
  | "orchestrator"
  | "context-manager";

export type ModelTier =
  | "haiku"
  | "sonnet"
  | "opus"
  | "gemini-flash"
  | "gemini-pro";

export interface AgentTask {
  agent: AgentId;
  taskId: string;
  feature: FeatureRequest;
  prompt: string;
  context: Record<string, unknown>;
  timestamp: Date;
  useExtendedThinking: boolean;
  thinkingBudget?: number; // max thinking tokens
  tools?: ToolDefinition[];
}

export interface AgentResult {
  agent: AgentId;
  taskId: string;
  status: "success" | "failed" | "blocked" | "retrying";
  output: {
    code?: string;
    schema?: string;
    tests?: string;
    approvalNote?: string;
    risks?: string[];
  };
  tokensUsed: {
    input: number;
    output: number;
    cacheRead?: number;
    thinking?: number;
  };
  cost: number;
  duration: number;
  retryCount: number;
  timestamp: Date;
}

// ─── Cost Tracking ──────────────────────────────────────────────────

/** Anthropic pricing per 1M tokens as of Feb 2026 */
export const MODEL_PRICING = {
  haiku: { input: 0.25, output: 1.25, cacheRead: 0.025, cacheWrite: 0.3 },
  sonnet: { input: 3.0, output: 15.0, cacheRead: 0.3, cacheWrite: 3.75 },
  opus: { input: 15.0, output: 75.0, cacheRead: 1.5, cacheWrite: 18.75 },
  "gemini-flash": {
    input: 0.075,
    output: 0.3,
    cacheRead: 0.0,
    cacheWrite: 0.0,
  },
  "gemini-pro": { input: 1.25, output: 5.0, cacheRead: 0.0, cacheWrite: 0.0 },
} as const;

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  cacheCost: number;
  thinkingCost: number;
  total: number;
}

// ─── Execution Metrics ──────────────────────────────────────────────

export interface ExecutionMetrics {
  featureId: string;
  totalTokens: number;
  totalCost: number;
  costBreakdown: CostBreakdown;
  totalTime: number;
  agentResults: AgentResult[];
  successRate: number;
  regressionDetected: boolean;
  readyForProduction: boolean;
  vectorCheckpointId?: string;
  featureSpec?: FeatureSpec;
}

// ─── MCP / Tools ────────────────────────────────────────────────────

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface MCPServerConfig {
  name: string;
  description: string;
  transport: "stdio" | "http";
  command?: string; // for stdio
  args?: string[]; // for stdio
  url?: string; // for http
  env?: Record<string, string>;
}

// ─── Vector Store ───────────────────────────────────────────────────

export interface VectorCheckpoint {
  id: string;
  featureId: string;
  agentId: AgentId;
  content: string;
  metadata: Record<string, string>;
  embedding?: number[];
  createdAt: Date;
}

export interface SimilarPattern {
  checkpointId: string;
  content: string;
  similarity: number;
  featureId: string;
  agentId: AgentId;
}

// ─── Task Queue ─────────────────────────────────────────────────────

export type JobStatus =
  | "waiting"
  | "active"
  | "completed"
  | "failed"
  | "delayed";

export interface QueuedFeature {
  feature: FeatureRequest;
  scheduledAt?: Date;
  retryOnFail: boolean;
  maxRetries: number;
}

// ─── Telegram ───────────────────────────────────────────────────────

export type NotificationType =
  | "feature_started"
  | "feature_completed"
  | "feature_blocked"
  | "agent_failure"
  | "cost_alert"
  | "regression_warning"
  | "deployment"
  | "daily_summary"
  | "queue_status";

export interface TelegramNotification {
  type: NotificationType;
  title: string;
  message: string;
  details?: Record<string, unknown>;
  priority: Priority;
}

// ─── Regression Testing ─────────────────────────────────────────────

export interface TestCase {
  name: string;
  critical: boolean;
  steps: TestStep[];
  assertions: TestAssertion[];
}

export interface TestStep {
  action: "goto" | "click" | "fill" | "submit" | "wait" | "screenshot";
  selector?: string;
  value?: string;
  timeout?: number;
}

export interface TestAssertion {
  type: "visible" | "contains" | "attribute" | "response_time" | "visual_match";
  selector?: string;
  value?: string;
  threshold?: number;
}

export interface RegressionResult {
  testName: string;
  passed: boolean;
  duration: number;
  errors: string[];
  visualDiff?: {
    detected: boolean;
    diffPercent: number;
    severity: "low" | "medium" | "high";
  };
  performance?: { responseTime: number; renderTime: number };
}

// ─── Config ─────────────────────────────────────────────────────────

export interface SystemConfig {
  anthropicApiKey: string;
  googleApiKey: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  redisUrl: string;
  chromaUrl: string;
  baseUrl: string;
  defaultAiProvider?: "anthropic" | "gemini";
  budgetLimitMonthly: number;
  budgetAlertThreshold: number;
  maxRetries: number;
  retryBaseDelayMs: number;
}

export function loadConfig(): SystemConfig {
  return {
    anthropicApiKey: requireEnv("ANTHROPIC_API_KEY"),
    googleApiKey: requireEnv("GOOGLE_API_KEY"),
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    chromaUrl: process.env.CHROMA_URL ?? "http://localhost:8000",
    baseUrl: process.env.BASE_URL ?? "http://localhost:3000",
    defaultAiProvider: process.env.DEFAULT_AI_PROVIDER as
      | "anthropic"
      | "gemini"
      | undefined,
    budgetLimitMonthly: Number(process.env.BUDGET_LIMIT ?? 20),
    budgetAlertThreshold: Number(process.env.BUDGET_ALERT ?? 18),
    maxRetries: Number(process.env.MAX_RETRIES ?? 3),
    retryBaseDelayMs: Number(process.env.RETRY_BASE_DELAY ?? 1000),
  };
}

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env: ${key}`);
  return v;
}
