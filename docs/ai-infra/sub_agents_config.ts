/**
 * Sub-Agents Configuration v4 — Production
 *
 * Changes from v3:
 * - Accurate input/output pricing split (not flat rate)
 * - Model routing: Haiku for simple, Sonnet for medium, Opus for architect
 * - Extended thinking with budget caps (not unlimited)
 * - Prompt caching enabled on stable system prompts
 * - Real MCP server references (not stubs)
 * - Dynamic model downgrade under budget pressure
 */

import {
  type AgentId,
  type ModelTier,
  type Complexity,
  MODEL_PRICING,
  type CostBreakdown,
} from "./types.js";

// ─── Agent Config Interface ─────────────────────────────────────────

export interface SubAgentConfig {
  id: AgentId;
  name: string;
  role: string;
  systemPrompt: string;

  /** Default model — may be downgraded dynamically */
  defaultModel: ModelTier;
  /** Model override by feature complexity */
  modelByComplexity: Record<Complexity, ModelTier>;

  maxOutputTokens: number;
  useExtendedThinking: boolean;
  thinkingBudgetTokens: number; // hard cap on thinking tokens

  /** Real MCP server names this agent can request tools from */
  mcpServers: string[];
  skills: string[];
  taskTypes: string[];

  /** Enable prompt caching for this agent's system prompt */
  enablePromptCaching: boolean;
}

// ─── Agent Definitions ──────────────────────────────────────────────

export const FRONTEND_UI_AGENT: SubAgentConfig = {
  id: "frontend-ui",
  name: "Frontend UI/UX",
  role: "Build React 19 components with Tailwind CSS and shadcn/ui",
  systemPrompt: `You are a specialized Frontend UI agent.
Your domain: React 19 components, Tailwind CSS v4, shadcn/ui, accessibility (WCAG 2.2).
Rules:
- Output production-ready TSX with proper TypeScript types
- Use server components by default, client components only when needed
- Follow atomic design: atoms → molecules → organisms
- Include aria-labels, keyboard navigation, focus management
- Dark mode support via CSS variables, not conditional classes
- Responsive: mobile-first with Tailwind breakpoints
- CRITICAL: Read and apply the "skillBriefing" from your context before writing code
- Never import from backend or database layers`,

  defaultModel: "sonnet",
  modelByComplexity: { simple: "haiku", medium: "sonnet", complex: "sonnet" },
  maxOutputTokens: 16_000,
  useExtendedThinking: false,
  thinkingBudgetTokens: 0,

  mcpServers: ["filesystem-mcp-server", "shadcn"],
  skills: ["dynamic-briefing-provided-by-context-manager"],
  taskTypes: [
    "create-component",
    "build-form-ui",
    "create-layout",
    "implement-responsive",
    "add-accessibility",
    "style-with-tailwind",
  ],
  enablePromptCaching: true,
};

export const FRONTEND_BIZLOGIC_AGENT: SubAgentConfig = {
  id: "frontend-bizlogic",
  name: "Frontend Business Logic",
  role: "State management, validation schemas, API client layer",
  systemPrompt: `You are a specialized Frontend Business Logic agent.
Your domain: Zustand stores, Zod validation, TanStack Query, API orchestration.
Rules:
- Zustand stores: small, focused, with immer middleware for complex state
- Zod schemas: strict mode, transform for API responses
- TanStack Query: proper cache keys, optimistic updates, error boundaries
- Type-safe API client with interceptors and retry
- CRITICAL: Read and apply the "skillBriefing" from your context before writing code
- Never touch UI/styling code
- Never import from backend or database layers`,

  defaultModel: "sonnet",
  modelByComplexity: { simple: "haiku", medium: "sonnet", complex: "sonnet" },
  maxOutputTokens: 12_000,
  useExtendedThinking: false,
  thinkingBudgetTokens: 0,

  mcpServers: ["filesystem-mcp-server"],
  skills: ["dynamic-briefing-provided-by-context-manager"],
  taskTypes: [
    "create-store",
    "write-validation",
    "create-api-service",
    "handle-form-logic",
    "manage-cache",
    "create-hooks",
  ],
  enablePromptCaching: true,
};

export const BACKEND_API_AGENT: SubAgentConfig = {
  id: "backend-api",
  name: "Backend API",
  role: "NestJS controllers, services, guards, DTOs",
  systemPrompt: `You are a specialized Backend API agent.
Your domain: NestJS 11, TypeScript, REST API design, JWT/OAuth2.
Rules:
- Controllers: thin, delegate to services
- Services: business logic, transaction boundaries
- DTOs: class-validator decorators, transform pipes
- Guards: JWT validation, role-based access (RBAC)
- Error handling: custom exception filters with proper HTTP codes
- API versioning via URI prefix (/v1/, /v2/)
- OpenAPI decorators on every endpoint
- CRITICAL: Read and apply the "skillBriefing" from your context before writing code
- Never touch frontend or database schema directly`,

  defaultModel: "sonnet",
  modelByComplexity: { simple: "sonnet", medium: "sonnet", complex: "opus" },
  maxOutputTokens: 20_000,
  useExtendedThinking: true,
  thinkingBudgetTokens: 8_000, // cap thinking for cost control

  mcpServers: ["filesystem-mcp-server"],
  skills: ["dynamic-briefing-provided-by-context-manager"],
  taskTypes: [
    "create-controller",
    "create-service",
    "implement-auth",
    "create-dto",
    "create-guard",
    "create-middleware",
  ],
  enablePromptCaching: true,
};

export const BACKEND_DATABASE_AGENT: SubAgentConfig = {
  id: "backend-database",
  name: "Backend Database",
  role: "Prisma schema, migrations, query optimization, PostgreSQL",
  systemPrompt: `You are a specialized Database agent.
Your domain: Prisma ORM 7, PostgreSQL 17, schema design, migrations.
Rules:
- Prisma schema: explicit @map for snake_case DB columns
- Indexes: composite indexes for frequent query patterns
- Relations: explicit foreign keys, cascade rules documented
- Migrations: always reversible, zero-downtime compatible
- Queries: use Prisma fluent API, raw SQL only for complex aggregations
- Connection pooling: PgBouncer-aware configuration
- CRITICAL: Read and apply the "skillBriefing" from your context before writing code
- Never touch frontend or API controller code`,

  defaultModel: "sonnet",
  modelByComplexity: { simple: "haiku", medium: "sonnet", complex: "sonnet" },
  maxOutputTokens: 16_000,
  useExtendedThinking: true,
  thinkingBudgetTokens: 6_000,

  mcpServers: ["postgres-mcp-server", "filesystem-mcp-server"],
  skills: ["dynamic-briefing-provided-by-context-manager"],
  taskTypes: [
    "design-schema",
    "create-migration",
    "write-query",
    "optimize-indexes",
    "handle-relationships",
    "seed-data",
  ],
  enablePromptCaching: true,
};

export const QA_AGENT: SubAgentConfig = {
  id: "qa-testing",
  name: "QA & Testing",
  role: "Write tests, detect regressions, validate quality gates",
  systemPrompt: `You are a specialized QA agent.
Your domain: Vitest unit tests, Playwright E2E, visual regression, performance.
Rules:
- Unit tests: Arrange-Act-Assert, one assertion concept per test
- E2E tests: Page Object Model, stable selectors (data-testid)
- Mocks: MSW for API mocking, never mock implementation details
- Coverage: target 80% statements on business logic
- Visual regression: screenshot comparison on critical pages
- Performance: Web Vitals thresholds (LCP < 2.5s, FID < 100ms)
- CRITICAL: Read and apply the "skillBriefing" from your context before writing code
- Never write application code, only test code`,

  defaultModel: "sonnet",
  modelByComplexity: { simple: "haiku", medium: "sonnet", complex: "sonnet" },
  maxOutputTokens: 20_000,
  useExtendedThinking: false,
  thinkingBudgetTokens: 0,

  mcpServers: ["playwright-mcp-server", "filesystem-mcp-server"],
  skills: ["dynamic-briefing-provided-by-context-manager"],
  taskTypes: [
    "write-unit-test",
    "write-e2e-test",
    "create-mocks",
    "detect-regression",
    "measure-coverage",
    "test-accessibility",
  ],
  enablePromptCaching: true,
};

export const ARCHITECT_AGENT: SubAgentConfig = {
  id: "architect",
  name: "Architect",
  role: "Design review, security audit, pattern validation, tech decisions",
  systemPrompt: `You are the Architect agent — the quality gate for all features.
Your domain: system design, security, performance, scalability.
Rules:
- Review every feature for: security risks, performance impact, architectural consistency
- Output a structured JSON decision: { approved: bool, risks: [], guidelines: {}, notes: string }
- Block execution if: SQL injection risk, auth bypass, N+1 queries, breaking API contracts
- Suggest optimizations: caching strategy, index recommendations, query patterns
- Keep guidelines minimal — only what downstream agents need
- You are the ONLY agent that can block a feature pipeline`,

  defaultModel: "opus",
  modelByComplexity: { simple: "sonnet", medium: "opus", complex: "opus" },
  maxOutputTokens: 8_000,
  useExtendedThinking: true,
  thinkingBudgetTokens: 16_000, // architect gets most thinking budget

  mcpServers: [],
  skills: [
    "system-design",
    "security-audit",
    "performance-review",
    "scalability-patterns",
    "api-design",
    "threat-modeling",
  ],
  taskTypes: [
    "review-architecture",
    "validate-security",
    "check-performance",
    "approve-design",
    "suggest-optimizations",
    "identify-risks",
  ],
  enablePromptCaching: true,
};

export const ORCHESTRATOR_AGENT: SubAgentConfig = {
  id: "orchestrator",
  name: "Orchestrator",
  role: "Parse requirements, decompose tasks, coordinate agents, merge outputs",
  systemPrompt: `You are the Orchestrator agent running on Gemini with 1M context.
Your domain: task decomposition, dependency analysis, agent coordination.
Rules:
- Parse feature requests into structured sub-tasks
- Assign each sub-task to the correct specialized agent
- Determine parallel vs sequential execution order
- Merge agent outputs into coherent feature delivery
- Track token budgets and suggest model downgrades when needed
- Output structured JSON: { tasks: [], dependencies: [], parallelGroups: [] }`,

  defaultModel: "sonnet", // actually routed to Gemini in orchestrator
  modelByComplexity: { simple: "sonnet", medium: "sonnet", complex: "sonnet" },
  maxOutputTokens: 16_000,
  useExtendedThinking: false,
  thinkingBudgetTokens: 0,

  mcpServers: [],
  skills: [
    "task-decomposition",
    "dependency-analysis",
    "parallel-planning",
    "context-management",
    "budget-optimization",
    "quality-gating",
  ],
  taskTypes: [
    "parse-feature",
    "decompose-tasks",
    "assign-agents",
    "coordinate-execution",
    "merge-outputs",
    "validate-quality",
  ],
  enablePromptCaching: false, // Gemini has its own caching
};

// ─── Registry ───────────────────────────────────────────────────────

export const ALL_AGENTS: Record<AgentId, SubAgentConfig> = {
  "frontend-ui": FRONTEND_UI_AGENT,
  "frontend-bizlogic": FRONTEND_BIZLOGIC_AGENT,
  "backend-api": BACKEND_API_AGENT,
  "backend-database": BACKEND_DATABASE_AGENT,
  "qa-testing": QA_AGENT,
  architect: ARCHITECT_AGENT,
  "context-manager": {
    id: "context-manager",
    name: "Context Manager",
    role: "Scan .agents/skills and generate dynamic skill briefings",
    systemPrompt: `You are the Context Manager.
Your domain: Reading markdown skills and summarizing them for other agents.
Rules:
- Read requirements and architect notes.
- Use filesystem MCP to list and read relevant SKILL.md files in .agents/skills.
- Return a JSON object with keys for each Phase 2 agent ("frontend-ui", etc.) containing a strictly formatted markdown briefing.`,
    defaultModel: "sonnet",
    modelByComplexity: { simple: "haiku", medium: "sonnet", complex: "sonnet" },
    maxOutputTokens: 8000,
    useExtendedThinking: false,
    thinkingBudgetTokens: 0,
    mcpServers: ["filesystem-mcp-server"],
    skills: ["brainstorming", "workflow-automation"],
    taskTypes: ["generate-briefings"],
    enablePromptCaching: true,
  } as SubAgentConfig,
  orchestrator: ORCHESTRATOR_AGENT,
};

// ─── Parallel Execution Groups ──────────────────────────────────────

export const EXECUTION_PHASES: AgentId[][] = [
  ["architect"], // Phase 1: gate
  ["frontend-ui", "frontend-bizlogic", "backend-api", "backend-database"], // Phase 2: parallel
  ["qa-testing"], // Phase 3: validate
];

export const DEPENDENCIES: Record<AgentId, AgentId[]> = {
  "frontend-ui": ["architect"],
  "frontend-bizlogic": ["architect"],
  "backend-api": ["architect"],
  "backend-database": ["architect"],
  "qa-testing": [
    "frontend-ui",
    "frontend-bizlogic",
    "backend-api",
    "backend-database",
  ],
  architect: [],
  orchestrator: [],
};

// ─── Smart Handoff Rules ────────────────────────────────────────────

export const HANDOFF_RULES: Record<
  string,
  { pass: string[]; exclude: string[] }
> = {
  "architect→frontend-ui": {
    pass: ["approved", "componentGuidelines", "a11yChecklist"],
    exclude: ["dbSchema", "apiDecisions", "securityDetails"],
  },
  "architect→frontend-bizlogic": {
    pass: ["approved", "stateGuidelines", "apiContracts"],
    exclude: ["dbSchema", "uiDecisions", "securityDetails"],
  },
  "architect→backend-api": {
    pass: [
      "approved",
      "apiDesign",
      "securityRequirements",
      "performanceTargets",
    ],
    exclude: ["uiComponents", "stylingDecisions"],
  },
  "architect→backend-database": {
    pass: ["approved", "dataRequirements", "relationships", "indexHints"],
    exclude: ["uiComponents", "apiControllers"],
  },
  "all→qa-testing": {
    pass: [
      "testScenarios",
      "criticalPaths",
      "acceptanceCriteria",
      "apiContracts",
    ],
    exclude: ["implementationDetails", "architectDecisions"],
  },
};

// ─── Cost Calculation (Accurate Split Pricing) ──────────────────────

export function calculateCost(
  model: ModelTier,
  tokens: {
    input: number;
    output: number;
    cacheRead?: number;
    thinking?: number;
  },
): CostBreakdown {
  const pricing = MODEL_PRICING[model];
  const perToken = (pricePerMillion: number, count: number) =>
    (pricePerMillion / 1_000_000) * count;

  const inputCost = perToken(pricing.input, tokens.input);
  const outputCost = perToken(pricing.output, tokens.output);
  const cacheCost = perToken(pricing.cacheRead, tokens.cacheRead ?? 0);
  // Thinking tokens are billed at output rate
  const thinkingCost = perToken(pricing.output, tokens.thinking ?? 0);

  return {
    inputCost,
    outputCost,
    cacheCost,
    thinkingCost,
    total: inputCost + outputCost + cacheCost + thinkingCost,
  };
}

/** Estimate feature cost before execution */
export function estimateFeatureCost(params: {
  complexity: Complexity;
  needsDatabase: boolean;
  testingScope: "unit" | "unit+e2e" | "comprehensive";
}): number {
  const tokenEstimates: Record<
    Complexity,
    Record<string, { input: number; output: number }>
  > = {
    simple: {
      architect: { input: 2000, output: 1500 },
      frontendUi: { input: 3000, output: 5000 },
      frontendBiz: { input: 2000, output: 3000 },
      backendApi: { input: 4000, output: 6000 },
      backendDb: { input: 2000, output: 3000 },
      qa: { input: 3000, output: 5000 },
    },
    medium: {
      architect: { input: 3000, output: 2500 },
      frontendUi: { input: 5000, output: 10000 },
      frontendBiz: { input: 3000, output: 5000 },
      backendApi: { input: 6000, output: 12000 },
      backendDb: { input: 4000, output: 8000 },
      qa: { input: 5000, output: 10000 },
    },
    complex: {
      architect: { input: 5000, output: 3500 },
      frontendUi: { input: 8000, output: 16000 },
      frontendBiz: { input: 5000, output: 8000 },
      backendApi: { input: 10000, output: 20000 },
      backendDb: { input: 6000, output: 12000 },
      qa: { input: 8000, output: 16000 },
    },
  };

  const est = tokenEstimates[params.complexity];
  let total = 0;

  // Architect — model depends on complexity
  const archModel = ARCHITECT_AGENT.modelByComplexity[params.complexity];
  total += calculateCost(archModel, est.architect).total;

  // Frontend agents
  const feModel = FRONTEND_UI_AGENT.modelByComplexity[params.complexity];
  total += calculateCost(feModel, est.frontendUi).total;
  total += calculateCost(feModel, est.frontendBiz).total;

  // Backend API
  const beModel = BACKEND_API_AGENT.modelByComplexity[params.complexity];
  total += calculateCost(beModel, est.backendApi).total;

  // Database (conditional)
  if (params.needsDatabase) {
    const dbModel = BACKEND_DATABASE_AGENT.modelByComplexity[params.complexity];
    total += calculateCost(dbModel, est.backendDb).total;
  }

  // QA
  const qaModel = QA_AGENT.modelByComplexity[params.complexity];
  const qaMultiplier =
    params.testingScope === "comprehensive"
      ? 1.5
      : params.testingScope === "unit+e2e"
        ? 1.2
        : 1.0;
  total += calculateCost(qaModel, {
    input: Math.round(est.qa.input * qaMultiplier),
    output: Math.round(est.qa.output * qaMultiplier),
  }).total;

  return total;
}

export default {
  ALL_AGENTS,
  EXECUTION_PHASES,
  DEPENDENCIES,
  HANDOFF_RULES,
  calculateCost,
  estimateFeatureCost,
};
