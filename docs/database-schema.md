# Database Schema — starter-kit

> Source: `packages/database/prisma/schema.prisma`
> ORM: Prisma 7.2.0 | Database: PostgreSQL 17

---

## Models Overview

| Model | Table | Purpose |
|-------|-------|---------|
| `User` | `user` | Authenticated users |
| `VerificationToken` | `verification_token` | Auth tokens (NextAuth-compatible) |
| `FeatureQueue` | `feature_queue` | AI task queue |
| `ExecutionMetric` | `execution_metric` | AI execution cost/performance data |
| `RoiMetric` | `roi_metric` | ROI / developer productivity data |

---

## Enum: ROLE

```prisma
enum ROLE {
  ADMIN
  USER
}
```

---

## Model: User

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      ROLE?    @default(USER)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
}
```

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | String | yes | `cuid()` | Primary key |
| `email` | String | yes | — | Unique constraint |
| `name` | String | no | null | Display name |
| `role` | ROLE | no | `USER` | Enum (ADMIN / USER) |
| `createdAt` | DateTime | yes | `now()` | DB column: `created_at` |
| `updatedAt` | DateTime | yes | auto | DB column: `updated_at`, auto-updated |

> **Bug:** `auth.login` always creates users with `role: "ADMIN"`, ignoring the schema default.

---

## Model: VerificationToken

```prisma
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `identifier` | String | yes | Typically the user's email |
| `token` | String | yes | Unique JWT/verification token |
| `expires` | DateTime | yes | Token expiry time |

Composite unique constraint: `(identifier, token)`.

---

## Model: FeatureQueue

```prisma
model FeatureQueue {
  id           String   @id @default(cuid())
  featureId    Int      @unique
  name         String
  category     String
  status       String   @default("PENDING")
  priority     String   @default("MEDIUM")
  dependsOnIds Int[]
  testSteps    String
  resultData   String?
  executionLog String?

  executionMetric ExecutionMetric?
  roiMetric       RoiMetric?

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
}
```

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | String | yes | `cuid()` | Internal UUID (used in relations) |
| `featureId` | Int | yes | — | Human-readable sequential ID (FEAT-001) |
| `name` | String | yes | — | Feature display name |
| `category` | String | yes | — | e.g. "frontend", "backend" |
| `status` | String | yes | `"PENDING"` | See status values below |
| `priority` | String | yes | `"MEDIUM"` | HIGH / MEDIUM / LOW |
| `dependsOnIds` | Int[] | yes | `[]` | Array of `featureId` dependencies |
| `testSteps` | String | yes | — | Requirements / acceptance criteria |
| `resultData` | String | no | null | Markdown output from agents |
| `executionLog` | String | no | null | Raw execution log text |
| `executionMetric` | ExecutionMetric | no | — | One-to-one relation |
| `roiMetric` | RoiMetric | no | — | One-to-one relation |
| `createdAt` | DateTime | yes | `now()` | DB column: `created_at` |
| `updatedAt` | DateTime | yes | auto | DB column: `updated_at` |

### FeatureQueue Status Values

| Status | Description |
|--------|-------------|
| `PENDING` | Queued for processing by orchestrator |
| `DRAFT` | Created manually, not yet submitted to queue |
| `IN_PROGRESS` | Currently being processed by agents |
| `COMPLETED` | Successfully processed |
| `FAILED` | Processing failed or manually stopped |

> Note: Status is `String`, not a Prisma enum. DRAFT was added in code but not yet added as an enum value.

### FeatureQueue Priority Values

| Priority | Description |
|----------|-------------|
| `HIGH` | Processed first |
| `MEDIUM` | Default priority |
| `LOW` | Processed last |

---

## Model: ExecutionMetric

```prisma
model ExecutionMetric {
  id               String   @id @default(cuid())
  featureId        String   @unique
  feature          FeatureQueue @relation(fields: [featureId], references: [id], onDelete: Cascade)

  totalCostUsd     Float
  durationSeconds  Int
  successRate      Int
  readyForProduction Boolean
  promptTokens     Int
  completionTokens Int
  cachedTokens     Int
  agentsUsed       Json
  createdAt        DateTime @default(now())
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | String | yes | `cuid()` |
| `featureId` | String | yes | FK → `FeatureQueue.id` (UUID, not featureId Int) |
| `totalCostUsd` | Float | yes | Total API cost in USD |
| `durationSeconds` | Int | yes | Wall-clock execution time |
| `successRate` | Int | yes | Percentage 0–100 |
| `readyForProduction` | Boolean | yes | Architect approval flag |
| `promptTokens` | Int | yes | Input tokens consumed |
| `completionTokens` | Int | yes | Output tokens consumed |
| `cachedTokens` | Int | yes | Cache-read tokens |
| `agentsUsed` | Json | yes | Array of `{ role: string, cost: number }` |
| `createdAt` | DateTime | yes | `now()` |

**Cascade:** Deleted when parent `FeatureQueue` is deleted (`onDelete: Cascade`).

---

## Model: RoiMetric

```prisma
model RoiMetric {
  id               String   @id @default(cuid())
  featureId        String   @unique
  feature          FeatureQueue @relation(fields: [featureId], references: [id], onDelete: Cascade)

  filesModified    Int?
  gitBranch        String?
  toolsCalled      Int?
  estimatedHumanHoursSaved Float?
  createdAt        DateTime @default(now())
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | String | yes | `cuid()` |
| `featureId` | String | yes | FK → `FeatureQueue.id` |
| `filesModified` | Int | no | Number of files changed |
| `gitBranch` | String | no | Git branch where work was done |
| `toolsCalled` | Int | no | Number of MCP/tool calls made |
| `estimatedHumanHoursSaved` | Float | no | ROI estimate in hours |
| `createdAt` | DateTime | yes | `now()` |

**Cascade:** Deleted when parent `FeatureQueue` is deleted (`onDelete: Cascade`).

---

## Relations

```
FeatureQueue 1 ──── 0..1 ExecutionMetric
FeatureQueue 1 ──── 0..1 RoiMetric
```

---

## Seed Data

### `prisma/seed.ts` (main seed)
Run via: `pnpm db:seed` or `prisma db seed`

### `prisma/seed-feature.ts` (feature seed)
Run via: `tsx --env-file=../../.env prisma/seed-feature.ts`

Upserts 2 FeatureQueue entries with status `COMPLETED` and linked metrics:

| featureId | name | category | priority |
|-----------|------|---------|---------|
| 5 | Dashboard Analytics Charts Component | frontend | HIGH |
| 6 | User Role Permission Middleware | backend | LOW |

**Mock ExecutionMetric** (applied to both):
```json
{
  "totalCostUsd": 1.25,
  "durationSeconds": 145,
  "successRate": 98,
  "readyForProduction": true,
  "promptTokens": 4500,
  "completionTokens": 2100,
  "cachedTokens": 1000,
  "agentsUsed": [
    { "role": "Developer Agent", "cost": 0.8 },
    { "role": "Reviewer Agent", "cost": 0.3 },
    { "role": "Testing Agent", "cost": 0.15 }
  ]
}
```

**Mock RoiMetric** (applied to both):
```json
{
  "filesModified": 4,
  "gitBranch": "feat/dashboard-analytics",
  "toolsCalled": 12,
  "estimatedHumanHoursSaved": 6.5
}
```

---

## Generator Config

```prisma
generator client {
  provider = "prisma-client"
  output   = "./generated"
}

datasource db {
  provider = "postgresql"
}
```

Connection string is read from `DATABASE_URL` environment variable (`.env` at monorepo root).
