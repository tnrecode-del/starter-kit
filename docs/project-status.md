# Project Status — starter-kit

> Last updated: 2026-03-01
> Source branch: `feature/task-feat-6-user-role-permission`

---

## Git State

**Active branch:** `feature/task-feat-6-user-role-permission`
**Base branch:** `main`

### Recent Commits (last 7)

| Hash | Message |
|------|---------|
| `a741449` | feat(ui): really implement expandable task details with accordion and tabs |
| `7a749bd` | feat(ui): implement expandable task details with accordion and tabs |
| `4e8e647` | feat(tasks): implement DRAFT state, manual trigger, and orchestrator log isolation |
| `0524850` | fix(admin): update gemini model version and add missing intl key |
| `ac5aafa` | feat(admin): pass feature name and requirements as context to AI brainstorm |
| `db9bd18` | fix(admin): cap chat grid height so it scrolls within viewport |
| `b0a5917` | feat(admin): implement real AI brainstorm via Gemini and task saving to postgres |

### Uncommitted Changes (git status)

```
M  apps/web/src/features/task-details/ui/TaskDetailsPanel.tsx
 M packages/ai-agents/orchestrator.log
 M packages/database/prisma/seed-feature.ts
?? apps/web/GEMINI.md
?? apps/web/src/widgets/admin-metrics/
?? packages/shared/src/ui/chart.tsx
```

---

## What Is Implemented ✅

### Infrastructure
- Monorepo with Turborepo + pnpm workspaces
- Docker Compose: PostgreSQL 17-alpine, Redis, ChromaDB
- ESM-first TypeScript throughout all packages
- Shared config packages: `@core/config-tailwind`, `@core/shared`, `@core/database`, `@core/trpc`

### Database (PostgreSQL + Prisma)
- 5 models: `User`, `FeatureQueue`, `ExecutionMetric`, `RoiMetric`, `VerificationToken`
- Enum `ROLE` (ADMIN / USER)
- Cascade deletes on `ExecutionMetric` and `RoiMetric` → `FeatureQueue`
- Seed scripts: `prisma/seed.ts` + `prisma/seed-feature.ts`

### Backend API (NestJS 11 + tRPC 11)
- tRPC router with 5 procedures: `auth.login`, `auth.me`, `auth.logout`, `user.getUsers`, `user.create`
- JWT authentication via httpOnly cookies (`auth-token`, 7-day expiry)
- NestJS controllers: `AdminController` (queue reset/list), `AppController` (user list)
- Next.js Route Handlers: logs, brainstorm, queue control, task start/stop/retry

### Frontend (Next.js 16 + React 19)
- Feature-Sliced Design (FSD) architecture
- Admin dashboard with live queue list, task details panel, pipeline visualizer
- I18n with `next-intl` (ru/en)
- Dark/light theme switching
- Recharts integration for metrics visualization

### AI Orchestrator (v4)
- 8 agents: architect, context-manager, frontend-ui, frontend-bizlogic, backend-api, backend-database, qa-testing, orchestrator
- Phase-based execution: Phase 1 → Phase 2 (parallel) → Phase 3
- MCP servers: filesystem, postgres, git, playwright, shadcn
- Vector persistence via ChromaDB
- BullMQ job queue (Redis) with priority routing
- Cost tracking per model tier (Anthropic + Gemini pricing)
- Pino structured logging to `orchestrator.log`

---

## In Development 🚀 (Current Branch)

### `TaskDetailsPanel` — Metrics Tab
- File: `apps/web/src/features/task-details/ui/TaskDetailsPanel.tsx`
- **Recharts PieChart** — token breakdown (prompt / completion / cached)
- **Recharts BarChart** — cost by agent (horizontal layout)
- **4 stat cards**: Total Cost, Duration, Success Rate, Hours Saved
- Tab is conditionally rendered only when `task.executionMetric` exists

### `AdminDashboardMetrics` Widget
- File: `apps/web/src/widgets/admin-metrics/ui/AdminDashboardMetrics.tsx` (untracked)
- **4 summary cards**: Total Tasks, Active, Finished, Budget Burn (with progress bar)
- **BarChart** — tasks per day (last 7 days)
- **Horizontal BarChart** — top agents by cost
- Uses `ChartContainer` from `@shared/ui/chart`

### `chart.tsx` in shared/ui
- File: `packages/shared/src/ui/chart.tsx` (untracked)
- Recharts wrapper: `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`
- CSS variable theming for light/dark mode via `data-chart` attribute
- Registered as shadcn-compatible component

### `seed-feature.ts` — Extended Seed
- File: `packages/database/prisma/seed-feature.ts` (modified)
- Upserts 2 FeatureQueue entries (featureId 5 and 6) with status COMPLETED
- Creates linked `ExecutionMetric` and `RoiMetric` records with mock data

---

## Known Issues ⚠️

| Issue | Location | Impact |
|-------|---------|--------|
| `auth.login` always assigns role `ADMIN` to new users | `packages/trpc/src/router/auth.router.ts:17` | All users get admin access |
| No RBAC in tRPC procedures | `packages/trpc/src/router/` | Any authenticated user can call any procedure |
| REST endpoints `/api/tasks/*` have no auth check | `apps/web/src/app/api/tasks/` | Unauthenticated clients can stop/retry tasks |
| No unit or E2E tests | — | Zero test coverage |
| DRAFT status not in Prisma enum | `packages/database/prisma/schema.prisma` | Status is plain String, no type safety |

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js | ^16.1.1 |
| Frontend | React | ^19.2.3 |
| Frontend | Tailwind CSS | ^4.1.18 |
| Frontend | TanStack Query | ^5.90.16 |
| Frontend | next-intl | ^4.8.3 |
| Frontend | Recharts | (via recharts dep) |
| Backend | NestJS | ^11.1.11 |
| Backend | tRPC | ^11.8.1 |
| Database | PostgreSQL | 17-alpine |
| Database | Prisma | ^7.2.0 |
| AI | Anthropic SDK | ^0.39.0 |
| AI | Google Generative AI | ^0.24.1 |
| AI | MCP SDK | ^1.12.0 |
| Queue | BullMQ | ^5.69.3 |
| Queue | Redis (ioredis) | ^5.9.3 |
| Vector DB | ChromaDB | ^1.10.5 |
| Build | Turborepo | (root dep) |
| Pkg Mgr | pnpm | 10.27.0 |
| Logger | Pino | ^9.14.0 |
