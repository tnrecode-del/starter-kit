import { Sparkles } from "lucide-react";
// @ts-expect-error - Using compiled dist directly to bypass Turbopack workspace TS constraints
import { db } from "@core/database/dist/src/index.js";
import { QueueList } from "@/widgets/queue-list/ui/QueueList";
import { AdminDashboardMetrics } from "@/widgets/admin-metrics/ui/AdminDashboardMetrics";
import Link from "next/link";
import { Button } from "@shared/ui/button";
import { getTranslations } from "next-intl/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentUsedEntry {
  role: string;
  cost: number;
}

interface ExecutionMetricRow {
  totalCostUsd: number;
  agentsUsed: unknown; // Prisma returns Json as unknown
}

interface FeatureQueueRow {
  featureId: number;
  name: string;
  status: string;
  category: string;
  priority: string;
  testSteps: string;
  resultData?: string | null;
  executionMetric?: ExecutionMetricRow | null;
  roiMetric?: unknown | null;
  dependsOnIds?: number[];
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a Date as "Mon DD" for the chart x-axis (e.g. "Mar 01"). */
function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

/** Return the ISO date string "YYYY-MM-DD" for a given Date. */
function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Metrics computation (pure functions, no side-effects)
// ---------------------------------------------------------------------------

function computeTasksPerDay(
  tasks: FeatureQueueRow[],
): { date: string; tasks: number }[] {
  // Build a map covering exactly the last 7 calendar days (today inclusive).
  const today = new Date();
  const countByDay = new Map<string, { label: string; count: number }>();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    countByDay.set(toDateKey(d), { label: formatDateLabel(d), count: 0 });
  }

  for (const task of tasks) {
    const key = toDateKey(new Date(task.createdAt));
    const entry = countByDay.get(key);
    if (entry) {
      entry.count += 1;
    }
  }

  return Array.from(countByDay.values()).map(({ label, count }) => ({
    date: label,
    tasks: count,
  }));
}

function computeTopAgents(
  tasks: FeatureQueueRow[],
): { agent: string; cost: number }[] {
  const costByAgent = new Map<string, number>();

  for (const task of tasks) {
    const raw = task.executionMetric?.agentsUsed;
    if (!Array.isArray(raw)) continue;

    for (const entry of raw as AgentUsedEntry[]) {
      if (typeof entry?.role !== "string" || typeof entry?.cost !== "number") {
        continue;
      }
      costByAgent.set(
        entry.role,
        (costByAgent.get(entry.role) ?? 0) + entry.cost,
      );
    }
  }

  return Array.from(costByAgent.entries())
    .map(([agent, cost]) => ({ agent, cost: Math.round(cost * 1000) / 1000 }))
    .sort((a, b) => b.cost - a.cost);
}

function computeTotalSpend(tasks: FeatureQueueRow[]): number {
  return tasks.reduce((sum, task) => {
    const cost = task.executionMetric?.totalCostUsd;
    return typeof cost === "number" ? sum + cost : sum;
  }, 0);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminPage() {
  const t = await getTranslations("AdminPage");

  const tasks: FeatureQueueRow[] = await db.featureQueue.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      executionMetric: true,
      roiMetric: true,
    },
  });

  // Serialize for Client Component boundary (Dates → ISO strings survive JSON).
  const serializedTasks = tasks.map((task) => ({
    ...task,
    executionMetric: task.executionMetric ?? null,
    roiMetric: task.roiMetric ?? null,
  }));

  // --- Counts ---
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;

  // --- Spend & budget ---
  const totalSpend = computeTotalSpend(tasks);
  // Static budget cap for burn-rate display; adjust as needed.
  const budgetLimit = 50;

  // --- Chart data ---
  const tasksPerDay = computeTasksPerDay(tasks);
  const topAgents = computeTopAgents(tasks);

  return (
    <main className="container max-w-5xl mx-auto py-12 px-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
          </div>
        </div>
        <Link href="/admin/new">
          <Button className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-full px-6">
            <Sparkles className="h-4 w-4" />
            New Feature
          </Button>
        </Link>
      </div>

      {/* Metrics widget */}
      <div className="mb-12">
        <AdminDashboardMetrics
          totalTasks={totalTasks}
          activeTasks={activeTasks}
          completedTasks={completedTasks}
          totalSpend={totalSpend}
          budgetLimit={budgetLimit}
          tasksPerDay={tasksPerDay}
          topAgents={topAgents}
        />
      </div>

      {/* Queue list */}
      <div className="relative">
        <QueueList initialTasks={serializedTasks} />
      </div>
    </main>
  );
}
