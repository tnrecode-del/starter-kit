# API Reference — starter-kit

> Two API layers: **tRPC** (type-safe RPC via NestJS) and **Next.js Route Handlers** (REST-style).

---

## tRPC Procedures

**Base URL:** `http://localhost:3001/trpc`
**Transport:** HTTP POST (tRPC batch link)
**Auth:** JWT cookie `auth-token` read from Express request context

Source files:
- `packages/trpc/src/router/auth.router.ts`
- `packages/trpc/src/router/users.router.ts`

---

### `auth.login`

**Type:** Mutation
**Access:** Public

Upsert a user by email and issue a JWT cookie.

**Input (Zod — `LoginInputSchema`):**
```ts
z.object({
  email: z.string().email(),
  // (full schema in packages/shared/src/schemas)
})
```

**Behavior:**
1. Upsert user in DB (`create` if not found, `update` is no-op)
2. Newly created users always get `name: "Admin User"` and `role: "ADMIN"` (known bug)
3. Sign JWT with `{ id, email }` — 7-day expiry
4. Set `auth-token` httpOnly cookie (maxAge 24h, sameSite lax, secure in production)

**Output:**
```ts
{ success: true, user: User }
```

**Cookie set:** `auth-token` (httpOnly, secure in prod, sameSite: lax, maxAge: 86400000ms)

> ⚠️ Bug: All new users are created with role `ADMIN`, regardless of email.

---

### `auth.me`

**Type:** Query
**Access:** Public (returns `null` if not authenticated)

Returns the currently authenticated user from request context.

**Input:** None

**Output:**
```ts
User | null
```

The user object is decoded from the `auth-token` cookie by the tRPC context middleware.

---

### `auth.logout`

**Type:** Mutation
**Access:** Public

Clears the `auth-token` cookie.

**Input:** None

**Output:**
```ts
{ success: true }
```

**Cookie cleared:** `auth-token` (httpOnly, secure in prod, sameSite: lax)

---

### `user.getUsers`

**Type:** Query
**Access:** Public (no auth check — known issue)

Returns all users from the database.

**Input:** None

**Output:**
```ts
User[]
```

---

### `user.create`

**Type:** Mutation
**Access:** Public (no auth check — known issue)

Creates a new user.

**Input:**
```ts
z.object({
  name: z.string(),
  email: z.string().email(),
})
```

**Output:**
```ts
User
```

---

## Next.js Route Handlers (REST)

Located in `apps/web/src/app/api/`. These are Next.js App Router route handlers (not NestJS).

> ⚠️ None of these endpoints verify authentication. Authorization is missing.

---

### `GET /api/logs`

**File:** `apps/web/src/app/api/logs/route.ts`

Read Pino-format JSON logs from the orchestrator log file.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `featureId` | string (integer) | no | Filter logs by feature ID |

**Behavior:**
- Reads `packages/ai-agents/orchestrator.log` (relative to Next.js CWD)
- Parses NDJSON lines
- Filters by `featureId` or `feat-{featureId}` if param provided
- Returns last 500 matching log entries

**Response:**
```json
{ "logs": [LogEntry] }
```

**LogEntry shape:**
```ts
{
  level: number,    // 10=trace, 20=debug, 30=info, 40=warn, 50=error
  time: number,     // Unix ms timestamp
  msg: string,
  agent?: string,
  skill?: string,
  duration?: number,
  featureId?: number | string,
  [key: string]: unknown
}
```

**Error responses:** `{ "logs": [] }` if file not found; `{ "error": "Failed to read logs", status: 500 }` on read error.

---

### `POST /api/brainstorm`

**File:** `apps/web/src/app/api/brainstorm/route.ts`

AI brainstorm via Google Gemini. Used in the `/admin/new` task creation page.

**Request Body:**
```ts
{
  messages: Array<{ role: "user" | "assistant", content: string }>,
  context?: {
    title?: string,
    requirements?: string
  }
}
```

**Behavior:**
- Converts messages to Gemini format (`model` instead of `assistant`)
- Calls Gemini `gemini-3-flash-preview` model via REST API
- System prompt: expert AI software architect, replies in markdown
- Injects `context.title` and `context.requirements` into system prompt if provided

**Response:**
```json
{ "text": "AI generated markdown response" }
```

**Environment:** Requires `GOOGLE_API_KEY`.

**Error responses:** `{ "error": "No GOOGLE_API_KEY configured", status: 500 }`, `{ "error": "Gemini API returned an error", status: 500 }`.

---

### `POST /api/tasks/:id/start`

**File:** `apps/web/src/app/api/tasks/[id]/start/route.ts`

Manually start a task that is in `DRAFT` state.

**Path Parameter:** `:id` — internal UUID string (`FeatureQueue.id`)

**Behavior:**
1. Look up task by UUID
2. Reject if task status is not `DRAFT` (returns 400)
3. Update status to `PENDING` (task is now queued for the orchestrator)

**Response:**
```json
{ "success": true, "task": FeatureQueue }
```

**Error responses:**
- `400` — Missing ID, task not found, or task not in DRAFT state
- `500` — DB error

---

### `POST /api/tasks/:id/stop`

**File:** `apps/web/src/app/api/tasks/[id]/stop/route.ts`

Manually stop an in-progress task.

**Path Parameter:** `:id` — numeric featureId (integer)

**Behavior:**
1. Updates task status to `FAILED`
2. Sets `resultData` to `"Task was manually stopped by the user."`

**Response:**
```json
{ "success": true }
```

**Error responses:**
- `400` — Invalid ID (non-numeric)
- `500` — DB error

---

### `POST /api/tasks/:id/retry`

**File:** `apps/web/src/app/api/tasks/[id]/retry/route.ts`

Retry a failed task by resetting it to `PENDING`.

**Path Parameter:** `:id` — numeric featureId (integer)

**Behavior (within a Prisma transaction):**
1. Delete linked `ExecutionMetric` if exists
2. Delete linked `RoiMetric` if exists
3. Reset task: `status → PENDING`, `resultData → null`, `executionLog → null`

**Response:**
```json
{ "success": true }
```

**Error responses:**
- `400` — Invalid ID or task not found
- `500` — DB error

---

### `GET /api/queue`

**File:** `apps/web/src/app/api/queue/route.ts`

Get the current BullMQ queue status.

**Response:**
```json
{ "isPaused": boolean }
```

**Queue:** `"feature-processing"` in Redis at `REDIS_URL` (default: `redis://127.0.0.1:6379`).

---

### `POST /api/queue`

**File:** `apps/web/src/app/api/queue/route.ts`

Control the BullMQ queue.

**Request Body:**
```ts
{ "action": "pause" | "resume" | "drain" }
```

| Action | Effect |
|--------|--------|
| `pause` | Pause queue — no new jobs processed |
| `resume` | Resume paused queue |
| `drain` | Drain all pending jobs, then obliterate queue |

**Response:**
```json
{ "success": true, "isPaused": boolean }
```

**Error responses:** `400` — Invalid action; `500` — Redis/BullMQ error.

---

## NestJS REST Endpoints

**Base URL:** `http://localhost:3001` (NestJS app)

Located in `apps/api/src/`.

---

### `GET /users`

**Controller:** `AppController`
**File:** `apps/api/src/app.controller.ts`
**Auth:** None

Returns all users from the database.

**Response:** `User[]`

---

### `POST /admin/queue/reset`

**Controller:** `AdminController`
**File:** `apps/api/src/admin/admin.controller.ts`
**Auth:** None

Truncates the entire `FeatureQueue` table.

**Response:**
```json
{ "success": true, "message": "Queue truncated successfully" }
```

> ⚠️ Destructive operation — no confirmation required, no auth.

---

### `GET /admin/queue/list`

**Controller:** `AdminController`
**File:** `apps/api/src/admin/admin.controller.ts`
**Auth:** None

Returns all FeatureQueue entries ordered by `createdAt` descending, with `executionMetric` and `roiMetric` included.

**Response:** `FeatureQueue[]` (with relations)
