import {
  Activity,
  Sparkles,
  BrainCircuit,
  CheckCircle2,
  ListTodo,
} from "lucide-react";
import { db } from "@core/database/dist/src/index.js";
import { QueueList } from "@/widgets/queue-list/ui/QueueList";

export default async function AdminPage() {
  const tasks = await db.featureQueue.findMany({
    orderBy: { updatedAt: "desc" },
  });

  // Next.js serializes props from Server to Client components.
  // Prisma JSON fields can sometimes be complex objects. Deep clone/parse them.
  const serializedTasks = tasks.map((t: any) => ({
    ...t,
    executionMetric: t.executionMetric,
    roiMetric: t.roiMetric,
  }));

  const activeTasks = serializedTasks.filter(
    (t: any) => t.status === "IN_PROGRESS",
  ).length;
  const completedTasks = tasks.filter(
    (t: any) => t.status === "COMPLETED",
  ).length;
  const totalTasks = tasks.length;

  return (
    <main className="container max-w-5xl mx-auto py-12 px-6 fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Orchestrator Activity
          </h1>
          <p className="text-muted-foreground text-sm">
            Monitor autonomous feature execution
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* AI Insight Widget (Bento Item 1 - Spans 2 columns on md) */}
        <div className="md:col-span-2 relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-xl p-6 shadow-sm hover:-translate-y-1 transition-all duration-300 hover:shadow-lg group">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-all group-hover:bg-primary/20"></div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="rounded-full bg-primary/20 p-2 mt-1">
              <BrainCircuit className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">AI System Insight</h3>
              <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                {totalTasks === 0
                  ? "задачи еще не созданы"
                  : activeTasks > 0
                    ? "задачи в процессе"
                    : "все задачи выполнены"}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Bento Items */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col justify-center rounded-2xl border bg-card/60 backdrop-blur-xl p-6 shadow-sm hover:-translate-y-1 transition-all duration-300 hover:shadow-lg flex-1 group">
            <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-purple-500/5 blur-3xl transition-all group-hover:bg-purple-500/10"></div>
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2 relative z-10">
              <ListTodo className="h-4 w-4 text-purple-500" /> Total Tasks
            </span>
            <div className="text-4xl font-extrabold text-foreground relative z-10">
              {totalTasks}
            </div>
          </div>

          <div className="flex gap-6 flex-1">
            <div className="flex flex-col justify-center rounded-2xl border bg-card/60 backdrop-blur-xl p-6 shadow-sm hover:-translate-y-1 transition-all duration-300 hover:shadow-lg flex-1 group relative overflow-hidden">
              <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl transition-all group-hover:bg-blue-500/10"></div>
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2 relative z-10">
                <Activity className="h-4 w-4 text-blue-500" /> Active
              </span>
              <div className="text-3xl font-extrabold text-foreground relative z-10">
                {activeTasks > 0 ? activeTasks : "0"}
              </div>
            </div>

            <div className="flex flex-col justify-center rounded-2xl border bg-card/60 backdrop-blur-xl p-6 shadow-sm hover:-translate-y-1 transition-all duration-300 hover:shadow-lg flex-1 group relative overflow-hidden">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl transition-all group-hover:bg-emerald-500/10"></div>
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2 relative z-10">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Finished
              </span>
              <div className="text-3xl font-extrabold text-emerald-600 relative z-10">
                {completedTasks}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <QueueList initialTasks={serializedTasks} />
      </div>
    </main>
  );
}
