# Frontend Components Reference — starter-kit

> Architecture: Feature-Sliced Design (FSD)
> Stack: Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, Recharts

---

## FSD Layer Structure

```
apps/web/src/
├── app/              # Next.js App Router pages & API routes
├── widgets/          # Composite UI blocks (self-contained page sections)
├── features/         # User-facing feature slices
├── entities/         # Domain entities (data + minimal UI)
└── shared/           # Cross-cutting: UI primitives, hooks, utils
```

---

## Widgets

### `AdminDashboardMetrics`

**File:** `apps/web/src/widgets/admin-metrics/ui/AdminDashboardMetrics.tsx`
**Status:** Untracked (new, current branch)

Composite metrics dashboard component with 4 stat cards and 2 Recharts charts.

**Props:**
```ts
interface AdminDashboardMetricsProps {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  totalSpend: number;
  budgetLimit: number;
  tasksPerDay: { date: string; tasks: number }[];
  topAgents: { agent: string; cost: number }[];
}
```

**Layout:**
```
┌─────────┬─────────┬─────────┬─────────────────┐
│  Total  │  Active │Finished │   Budget Burn   │
│  Tasks  │  Tasks  │  Tasks  │  $x.xx / $y.yy  │
└─────────┴─────────┴─────────┴─────────────────┘
┌───────────────────────┬───────────────────────┐
│   Tasks (Last 7 Days) │ Top Agents by Cost    │
│   [BarChart]          │   [Horizontal Bar]    │
└───────────────────────┴───────────────────────┘
```

**Charts:**
- `BarChart` (tasks per day) — `date` on X-axis, `tasks` on Y-axis
- `BarChart layout="vertical"` (agents by cost) — `agent` on Y-axis, `cost` on X-axis

Both use `ChartContainer` + `ChartTooltipContent` from `@shared/ui/chart`.

---

### `QueueList`

**File:** `apps/web/src/widgets/queue-list/ui/QueueList.tsx`

Main admin dashboard component — displays all FeatureQueue tasks as an expandable accordion.

**Props:**
```ts
interface Props {
  initialTasks: TaskData[];
}
```

**Features:**
- **Status filter pills:** ALL / PENDING / IN_PROGRESS / COMPLETED / FAILED
- **Sorting:** IN_PROGRESS first → PENDING second → newest updatedAt
- **Pagination:** 8 items per page
- **Real-time polling:** `router.refresh()` every 2 seconds
- **Queue controls:** Pause / Resume / Drain (Stop) buttons with animated status badge
- **Accordion expand:** Opens `TaskDetailsPanel` inline below task row
- **Task cards show:** featureId (FEAT-001), category badge, dependency links, priority badge, status badge, agent cost/token stats

**Status visual config:**

| Status | Style | Icon |
|--------|-------|------|
| PENDING | muted gray | CircleDashed |
| IN_PROGRESS | blue glow + ring + pulse | BrainCircuit (animate-pulse) |
| COMPLETED | emerald green | CheckCircle2 |
| FAILED | rose red | XCircle |

**Priority visual config:**

| Priority | Style | Icon |
|----------|-------|------|
| HIGH | rose | ArrowUp |
| MEDIUM | amber | Minus |
| LOW | blue | ArrowDown |

---

### `PipelineVisualizer`

**File:** `apps/web/src/widgets/pipeline/ui/PipelineVisualizer.tsx`

Visual representation of the AI agent pipeline execution progress.

**Displays:** 5 execution stages with status indicators.

---

### `AdminHeader`

**File:** `apps/web/src/widgets/header/ui/AdminHeader.tsx`

Admin dashboard navigation header. Includes:
- Navigation links
- `LocaleSwitcher` — toggle ru/en via `next-intl`
- `ThemeToggle` — dark/light mode via `next-themes`

---

### `LandingHeader`

**File:** `apps/web/src/widgets/header/ui/LandingHeader.tsx`

Public landing page navigation header.

---

### `LocaleSwitcher`

**File:** `apps/web/src/widgets/header/ui/LocaleSwitcher.tsx`

Locale toggle component (ru / en) using `next-intl` routing.

---

### `ThemeToggle`

**File:** `apps/web/src/widgets/header/ui/ThemeToggle.tsx`

Dark/light theme toggle using `next-themes`.

---

## Features

### `TaskDetailsPanel`

**File:** `apps/web/src/features/task-details/ui/TaskDetailsPanel.tsx`
**Status:** Modified (current branch — Metrics tab added)

Expandable detail panel rendered inside `QueueList` accordion. Contains 3 tabs:

**Props:**
```ts
interface TaskDetailsPanelProps {
  task: {
    featureId: number;
    name: string;
    category: string;
    status: string;
    testSteps: string;
    resultData?: string | null;
    executionMetric?: ExecutionMetric | null;
    roiMetric?: RoiMetric | null;
  };
}
```

#### Tab 1: Overview & Results

- **Requirements section:** Renders `task.testSteps` as Markdown (via `react-markdown`)
- **Generated Result section:** Renders `task.resultData` as Markdown
- If `IN_PROGRESS` or `PENDING` and no result: shows animated loading state
- If `COMPLETED` and no result: shows "No result data was generated"

#### Tab 2: Live Logs

- Polls `GET /api/logs?featureId={id}` every 2s (only when `IN_PROGRESS` or `PENDING`)
- Terminal-style dark background (`#0d1117`)
- Log entries colored by Pino level (green=info, yellow=warn, red=error, gray=debug)
- Inline badges for `agent`, `skill`, `duration` from structured log fields
- `getAgentStyle()` applies per-agent colors and icons
- Auto-scroll to bottom when new logs arrive
- Pulsing blue dot on tab trigger when `IN_PROGRESS`

#### Tab 3: Metrics *(only shown when `executionMetric` exists)*

**Recharts PieChart — Token Breakdown:**
- Donut chart (innerRadius=60, outerRadius=80)
- Slices: Prompt tokens (`chart-1`), Completion tokens (`chart-2`), Cached tokens (`chart-3`)
- Uses `ChartTooltip` + `ChartTooltipContent`

**Recharts BarChart — Cost by Agent:**
- Horizontal layout (`layout="vertical"`)
- Data: `executionMetric.agentsUsed` array `[{ role, cost }]`
- Color: `var(--color-cost)` → `hsl(var(--chart-4))`
- Uses `ChartContainer` with config

**4 stat cards:**

| Stat | Source |
|------|--------|
| Total Cost | `executionMetric.totalCostUsd.toFixed(3)` |
| Duration | `executionMetric.durationSeconds` s |
| Success Rate | `executionMetric.successRate` % |
| Hours Saved | `roiMetric.estimatedHumanHoursSaved` h |

#### Task Action Buttons (in tab header bar)

| Status | Button | Action |
|--------|--------|--------|
| IN_PROGRESS | Stop Task | `POST /api/tasks/{featureId}/stop` |
| FAILED | Retry Task | `POST /api/tasks/{featureId}/retry` |

---

## Shared UI (`packages/shared/src/ui/`)

### Components List

| Component | File | Description |
|-----------|------|-------------|
| `Button` | `button.tsx` | CVA-based polymorphic button with variants |
| `Accordion` + sub-components | `accordion.tsx` | Radix UI accordion (used in QueueList) |
| `Tabs` + sub-components | `tabs.tsx` | Radix UI tabs (used in TaskDetailsPanel) |
| `Input` | `input.tsx` | Form text input |
| `Label` | `label.tsx` | Form label |
| `Textarea` | `textarea.tsx` | Multi-line text input |
| `Card` + sub-components | `card.tsx` | Card container |
| `Dialog` + sub-components | `dialog.tsx` | Modal dialog |
| `Sheet` + sub-components | `sheet.tsx` | Slide-in panel (drawer) |
| `DropdownMenu` + sub-components | `dropdown-menu.tsx` | Contextual dropdown |
| `Avatar` + sub-components | `avatar.tsx` | User avatar with fallback |
| `ChartContainer`, `ChartTooltip`, etc. | `chart.tsx` | Recharts wrapper (new) |

All components are exported from `packages/shared/src/index.ts` as `@core/shared`.

---

### `chart.tsx` — Recharts Wrapper

**File:** `packages/shared/src/ui/chart.tsx`
**Status:** Untracked (new, current branch)

shadcn/ui-compatible chart wrapper providing CSS variable-based theming for Recharts.

**Exports:**
```ts
export {
  ChartContainer,      // Provider + ResponsiveContainer wrapper
  ChartTooltip,        // = Recharts Tooltip
  ChartTooltipContent, // Styled tooltip with label/indicator
  ChartLegend,         // = Recharts Legend
  ChartLegendContent,  // Styled legend with color swatches
  ChartStyle,          // <style> injection for CSS vars
}
```

**`ChartContainer` usage:**
```tsx
<ChartContainer
  config={{
    cost: { label: "Cost ($)", color: "hsl(var(--chart-4))" }
  }}
  className="h-full"
>
  <BarChart data={...}>
    {/* access --color-cost via var(--color-cost) */}
  </BarChart>
</ChartContainer>
```

**Theming:** CSS variables are injected per `data-chart` attribute for both `light` and `dark` selectors, allowing full dark mode support without conditional classes.

**Chart CSS variables available:** `--chart-1` through `--chart-5` (defined in global CSS / Tailwind theme).

---

## I18n (Internationalization)

**Library:** next-intl ^4.8.3
**Supported locales:** `ru` (Russian), `en` (English)
**Message files:**
- `apps/web/messages/ru.json`
- `apps/web/messages/en.json`

Locale is controlled by URL prefix (Next.js middleware routing).
`LocaleSwitcher` component switches locale by navigating to the locale-prefixed URL.

---

## Theming

**Library:** next-themes ^0.4.6
**Modes:** light, dark, system
**Implementation:** CSS variables in Tailwind CSS v4 (`--background`, `--foreground`, `--primary`, etc.)
Chart colors use `hsl(var(--chart-N))` for theme-aware rendering.
