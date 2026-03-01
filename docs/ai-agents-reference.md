# AI Agents Reference — starter-kit

> Version: v4 (Production)
> Source: `packages/ai-agents/src/`

---

## Agent Registry

| Agent ID | Name | Default Model | Extended Thinking | Thinking Budget | Role |
|----------|------|--------------|------------------|----------------|------|
| `architect` | Architect | `opus` | ✅ | 16,000 tokens | Quality gate, security audit, pattern validation |
| `context-manager` | Context Manager | `sonnet` | ❌ | 0 | Read skill files, generate briefings for Phase 2 |
| `frontend-ui` | Frontend UI/UX | `gemini-pro` | ❌ | 0 | React 19 components, Tailwind, shadcn/ui |
| `frontend-bizlogic` | Frontend Business Logic | `sonnet` | ❌ | 0 | Zustand, Zod, TanStack Query, API client |
| `backend-api` | Backend API | `gemini-pro` | ✅ | 8,000 tokens | NestJS controllers, services, guards, DTOs |
| `backend-database` | Backend Database | `gemini-pro` | ✅ | 6,000 tokens | Prisma schema, migrations, query optimization |
| `qa-testing` | QA & Testing | `gemini-flash` | ❌ | 0 | Vitest unit tests, Playwright E2E |
| `orchestrator` | Orchestrator | `sonnet`* | ❌ | 0 | Task decomposition, agent coordination |

*Orchestrator is actually routed to Gemini (1M context window) in the runtime implementation.

---

## Model Routing by Complexity

| Agent | simple | medium | complex |
|-------|--------|--------|---------|
| architect | sonnet | opus | opus |
| context-manager | haiku | sonnet | sonnet |
| frontend-ui | gemini-flash | gemini-pro | sonnet |
| frontend-bizlogic | haiku | sonnet | sonnet |
| backend-api | gemini-flash | gemini-pro | opus |
| backend-database | gemini-flash | gemini-pro | sonnet |
| qa-testing | gemini-flash | gemini-flash | haiku |
| orchestrator | sonnet | sonnet | sonnet |

---

## Execution Phases

```
Phase 1:  [architect]
               ↓ (approved or blocked)
          [context-manager]
               ↓ (skill briefings generated)
Phase 2:  [frontend-ui] [frontend-bizlogic] [backend-api] [backend-database]
               ↓ (all Phase 2 complete)
Phase 3:  [qa-testing]
```

### Phase Details

| Phase | Agents | Execution | Trigger |
|-------|--------|-----------|---------|
| Phase 1 | architect | Sequential | Feature request arrives |
| Phase 1 | context-manager | Sequential (after architect) | Architect approved |
| Phase 2 | frontend-ui, frontend-bizlogic, backend-api, backend-database | **Parallel** | context-manager complete |
| Phase 3 | qa-testing | Sequential | All Phase 2 complete |

---

## Dependencies

```ts
DEPENDENCIES = {
  "frontend-ui":      ["architect", "context-manager"],
  "frontend-bizlogic": ["architect", "context-manager"],
  "backend-api":      ["architect", "context-manager"],
  "backend-database": ["architect", "context-manager"],
  "qa-testing":       ["frontend-ui", "frontend-bizlogic", "backend-api", "backend-database"],
  "architect":        [],
  "context-manager":  ["architect"],
  "orchestrator":     [],
}
```

---

## Handoff Rules

Data passed between phases is filtered to only include what each downstream agent needs.

| Handoff | Passed | Excluded |
|---------|--------|---------|
| architect → frontend-ui | `approved`, `componentGuidelines`, `a11yChecklist` | `dbSchema`, `apiDecisions`, `securityDetails` |
| architect → frontend-bizlogic | `approved`, `stateGuidelines`, `apiContracts` | `dbSchema`, `uiDecisions`, `securityDetails` |
| architect → backend-api | `approved`, `apiDesign`, `securityRequirements`, `performanceTargets` | `uiComponents`, `stylingDecisions` |
| architect → backend-database | `approved`, `dataRequirements`, `relationships`, `indexHints` | `uiComponents`, `apiControllers` |
| all → qa-testing | `testScenarios`, `criticalPaths`, `acceptanceCriteria`, `apiContracts` | `implementationDetails`, `architectDecisions` |

---

## MCP Servers

| Server Name | Used By | Purpose |
|-------------|---------|---------|
| `filesystem-mcp-server` | All agents except architect | Read/write files in project |
| `postgres-mcp-server` | backend-database | Direct DB queries |
| `playwright-mcp-server` | qa-testing | Browser automation for E2E |
| `shadcn-mcp-server` | frontend-ui | shadcn/ui component search |
| `git-mcp-server` | (not assigned per config) | Git operations |

---

## Pricing Model

Source: `packages/ai-agents/src/types.ts`

> Pricing per 1M tokens as of Feb 2026

| Model | Input | Output | Cache Read | Cache Write |
|-------|-------|--------|------------|-------------|
| `haiku` | $0.25 | $1.25 | $0.025 | $0.30 |
| `sonnet` | $3.00 | $15.00 | $0.30 | $3.75 |
| `opus` | $15.00 | $75.00 | $1.50 | $18.75 |
| `gemini-flash` | $0.075 | $0.30 | $0.00 | $0.00 |
| `gemini-pro` | $1.25 | $5.00 | $0.00 | $0.00 |

**Cost calculation rules:**
- Input tokens billed at input rate
- Output tokens billed at output rate
- Cache-read tokens billed at cache read rate
- **Thinking tokens billed at output rate**
- Total = inputCost + outputCost + cacheCost + thinkingCost

---

## Agent Configuration Details

### Architect

```ts
defaultModel: "opus"
maxOutputTokens: 8_000
useExtendedThinking: true
thinkingBudgetTokens: 16_000   // largest thinking budget
enablePromptCaching: true
mcpServers: []                 // no MCP tools needed
```

**Output format:** Structured JSON `{ approved: bool, risks: [], guidelines: {}, notes: string }`
**Blocking power:** Only agent that can block the pipeline.

---

### Context Manager

```ts
defaultModel: "sonnet"
maxOutputTokens: 8_000
useExtendedThinking: false
enablePromptCaching: true
mcpServers: ["filesystem-mcp-server"]
```

**Output format:** JSON mapping of `{ "frontend-ui": "markdown briefing", ... }` for each Phase 2 agent.
**Skills dir:** `.agents/skills/` — reads SKILL.md files.

---

### Frontend UI

```ts
defaultModel: "gemini-pro"
maxOutputTokens: 16_000
useExtendedThinking: false
enablePromptCaching: true
mcpServers: ["filesystem-mcp-server", "shadcn-mcp-server"]
```

**Domain:** React 19, Tailwind CSS v4, shadcn/ui, WCAG 2.2 accessibility
**Outputs:** Production-ready TSX with TypeScript types

---

### Frontend Business Logic

```ts
defaultModel: "sonnet"
maxOutputTokens: 12_000
useExtendedThinking: false
enablePromptCaching: true
mcpServers: ["filesystem-mcp-server"]
```

**Domain:** Zustand stores, Zod schemas (strict mode), TanStack Query (cache keys, optimistic updates), type-safe API client

---

### Backend API

```ts
defaultModel: "gemini-pro"
maxOutputTokens: 20_000
useExtendedThinking: true
thinkingBudgetTokens: 8_000
enablePromptCaching: true
mcpServers: ["filesystem-mcp-server"]
```

**Domain:** NestJS 11, REST API design, JWT/OAuth2, class-validator DTOs, OpenAPI decorators

---

### Backend Database

```ts
defaultModel: "gemini-pro"
maxOutputTokens: 16_000
useExtendedThinking: true
thinkingBudgetTokens: 6_000
enablePromptCaching: true
mcpServers: ["postgres-mcp-server", "filesystem-mcp-server"]
```

**Domain:** Prisma ORM 7, PostgreSQL 17, schema design, reversible migrations, PgBouncer-aware config

---

### QA Testing

```ts
defaultModel: "gemini-flash"
maxOutputTokens: 20_000
useExtendedThinking: false
enablePromptCaching: true
mcpServers: ["playwright-mcp-server", "filesystem-mcp-server"]
```

**Domain:** Vitest (AAA pattern), Playwright E2E (Page Object Model, data-testid), MSW API mocking, 80% statement coverage target, Web Vitals thresholds (LCP < 2.5s, FID < 100ms)

---

### Orchestrator

```ts
defaultModel: "sonnet"  // actually routes to Gemini (1M context)
maxOutputTokens: 16_000
useExtendedThinking: false
enablePromptCaching: false  // Gemini has its own caching
mcpServers: []
```

**Output format:** `{ tasks: [], dependencies: [], parallelGroups: [] }`

---

## BullMQ Queue

**Queue name:** `"feature-processing"`
**Redis:** `REDIS_URL` env var (default: `redis://localhost:6379`)

### Priority Mapping (BullMQ job priority)

| FeatureQueue Priority | BullMQ Priority |
|----------------------|----------------|
| `HIGH` | 1 (highest) |
| `MEDIUM` | 5 |
| `LOW` | 10 |

### Retry Policy

From `SystemConfig` defaults:
- `maxRetries`: 3 (configurable via `MAX_RETRIES` env)
- `retryBaseDelayMs`: 1000ms (configurable via `RETRY_BASE_DELAY` env)

### Queue Operations (via `/api/queue`)

| Action | Effect |
|--------|--------|
| `pause` | Stop processing new jobs |
| `resume` | Resume processing |
| `drain` | Clear all pending jobs, then obliterate queue |

---

## Vector Store (ChromaDB)

**URL:** `CHROMA_URL` env var (default: `http://localhost:8000`)
**Client:** `chromadb` ^1.10.5

### VectorCheckpoint Schema

```ts
interface VectorCheckpoint {
  id: string;
  featureId: string;
  agentId: AgentId;
  content: string;
  metadata: Record<string, string>;
  embedding?: number[];
  createdAt: Date;
}
```

Checkpoints are stored per-agent per-feature, enabling similarity search for pattern reuse across features (`SimilarPattern` interface).

---

## Logging

**Library:** Pino ^9.14.0
**Log file:** `packages/ai-agents/orchestrator.log` (NDJSON format)
**Served via:** `GET /api/logs?featureId=` in Next.js

### Log Levels

| Pino Level | Code | Color in UI |
|------------|------|-------------|
| debug | ≤20 | gray |
| info | 30 | green |
| warn | 40 | yellow |
| error | ≥50 | red |

Log entries may include `agent`, `skill`, `duration`, `featureId` fields for structured display in the `TaskDetailsPanel` Live Logs tab.

---

## Cost Estimation

Pre-execution cost estimation available via `estimateFeatureCost()`:

```ts
estimateFeatureCost({
  complexity: "simple" | "medium" | "complex",
  needsDatabase: boolean,
  testingScope: "unit" | "unit+e2e" | "comprehensive"
}): number  // estimated USD
```

QA multipliers: `unit` = 1.0x, `unit+e2e` = 1.2x, `comprehensive` = 1.5x

---

## Budget Controls

From `SystemConfig`:
- `budgetLimitMonthly`: $20 (configurable via `BUDGET_LIMIT` env)
- `budgetAlertThreshold`: $18 (configurable via `BUDGET_ALERT` env)

Agents track `tokensUsed` and `cost` per execution. Results stored in `ExecutionMetric` table.
Dynamic model downgrade occurs when budget pressure is detected (e.g., `complex → medium` model tier).
