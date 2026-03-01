"use client";

import { getAgentStyle } from "@/entities/task/lib/agent-styles";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  CircleDashed,
  XCircle,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Coins,
  Bot,
  MessageSquare,
  Link,
  ArrowUp,
  Minus,
  ArrowDown,
} from "lucide-react";

import type { ReactNode } from "react";
import { TaskDetailsPanel } from "@/features/task-details/ui/TaskDetailsPanel";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@core/shared";

const STATUS_CONFIG: Record<
  string,
  { base: string; icon: ReactNode; label: string; animate?: string }
> = {
  PENDING: {
    base: "bg-muted/50 text-muted-foreground border-border/50",
    icon: <CircleDashed className="h-4 w-4" />,
    label: "Pending",
  },
  IN_PROGRESS: {
    base: "bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30",
    icon: <BrainCircuit className="h-4 w-4 animate-pulse" />,
    label: "Processing",
    animate: "animate-[pulse_3s_ease-in-out_infinite]",
  },
  COMPLETED: {
    base: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: "Completed",
  },
  FAILED: {
    base: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    icon: <XCircle className="h-4 w-4" />,
    label: "Failed",
  },
};

const PRIORITY_CONFIG: Record<
  string,
  { base: string; icon: ReactNode; label: string }
> = {
  HIGH: {
    base: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    icon: <ArrowUp className="h-3 w-3" />,
    label: "High",
  },
  MEDIUM: {
    base: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: <Minus className="h-3 w-3" />,
    label: "Medium",
  },
  LOW: {
    base: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: <ArrowDown className="h-3 w-3" />,
    label: "Low",
  },
};

interface TaskData {
  featureId: number;
  name: string;
  status: string;
  category: string;
  priority: string;
  testSteps: string;
  resultData?: string | null;
  executionMetric?: any;
  roiMetric?: any;
  dependsOnIds?: number[];
  createdAt: Date;
  updatedAt: Date;
}

function timeAgo(date: Date) {
  const seconds = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / 1000,
  );
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins ago";
  return Math.floor(seconds) + " seconds ago";
}

export function QueueList({ initialTasks }: { initialTasks: TaskData[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [queueStatus, setQueueStatus] = useState<
    "loading" | "running" | "paused"
  >("loading");
  const itemsPerPage = 8;

  // Fetch queue status
  const fetchQueueStatus = async () => {
    try {
      const res = await fetch("/api/queue");
      if (res.ok) {
        const data = await res.json();
        setQueueStatus(data.isPaused ? "paused" : "running");
      }
    } catch (err) {
      console.error("Failed to fetch queue status:", err);
    }
  };

  useEffect(() => {
    fetchQueueStatus();
    // Poll every 5s
    const statusInterval = setInterval(fetchQueueStatus, 5000);
    return () => clearInterval(statusInterval);
  }, []);

  const handleQueueAction = async (action: "pause" | "resume" | "drain") => {
    setQueueStatus("loading");
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setQueueStatus(data.isPaused ? "paused" : "running");
        if (action === "drain") router.refresh();
      } else {
        await fetchQueueStatus(); // revert on fail
      }
    } catch (err) {
      console.error(`Queue ${action} failed:`, err);
      await fetchQueueStatus();
    }
  };

  const filteredTasks = [...initialTasks]
    .filter((task) => {
      if (filter === "ALL") return true;
      return task.status === filter;
    })
    .sort((a, b) => {
      // 1. IN_PROGRESS tasks first
      if (a.status === "IN_PROGRESS" && b.status !== "IN_PROGRESS") return -1;
      if (b.status === "IN_PROGRESS" && a.status !== "IN_PROGRESS") return 1;

      // 2. PENDING tasks second
      if (a.status === "PENDING" && b.status !== "PENDING") return -1;
      if (b.status === "PENDING" && a.status !== "PENDING") return 1;

      // 3. Otherwise, newest (updatedAt or createdAt) first
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / itemsPerPage),
  );
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset to page 1 if filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  useEffect(() => {
    // Poll for updates every 2 seconds for snappier real-time feel
    const interval = setInterval(() => {
      router.refresh();
    }, 2000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between p-4 bg-card rounded-2xl border shadow-sm">
        {/* Orchestrator Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <h2 className="font-semibold tracking-tight text-sm">
              Orchestrator
            </h2>
            <div className="flex items-center gap-1.5 ml-1">
              {queueStatus === "running" && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Running
                </span>
              )}
              {queueStatus === "paused" && (
                <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Paused
                </span>
              )}
              {queueStatus === "loading" && (
                <span className="text-xs font-semibold text-muted-foreground bg-muted border px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="animate-pulse h-2 w-2 rounded-full bg-muted-foreground"></span>
                  Checking
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl">
            <button
              onClick={() => handleQueueAction("resume")}
              disabled={queueStatus !== "paused"}
              className={`p-2 rounded-lg transition-all ${
                queueStatus === "paused"
                  ? "hover:bg-emerald-500/20 text-emerald-600 hover:text-emerald-500 bg-emerald-500/10"
                  : "opacity-50 cursor-not-allowed text-muted-foreground"
              }`}
              title="Resume Queue"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
            <button
              onClick={() => handleQueueAction("pause")}
              disabled={queueStatus !== "running"}
              className={`p-2 rounded-lg transition-all ${
                queueStatus === "running"
                  ? "hover:bg-amber-500/20 text-amber-600 hover:text-amber-500 bg-amber-500/10"
                  : "opacity-50 cursor-not-allowed text-muted-foreground"
              }`}
              title="Pause Queue"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            </button>
            <div className="w-px h-6 bg-border mx-1"></div>
            <button
              onClick={() => {
                if (
                  confirm(
                    "Are you sure you want to STOP the orchestrator? This will drain all pending items from the queue. Currently executing tasks will finish, but no new tasks will start.",
                  )
                ) {
                  handleQueueAction("drain");
                }
              }}
              className="p-2 rounded-lg transition-all hover:bg-rose-500/20 text-rose-600 hover:text-rose-500 bg-rose-500/10"
              title="Drain/Stop Queue"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              </svg>
            </button>
          </div>
        </div>

        {/* Existing Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === "ALL"
                ? "bg-primary text-primary-foreground shadow"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            All
          </button>
          {Object.keys(STATUS_CONFIG).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                filter === status
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {status.replace("_", " ").toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 relative">
        <div className="absolute -inset-4 bg-linear-to-b from-primary/5 to-transparent blur-2xl -z-10 rounded-[3rem]" />

        <Accordion
          type="single"
          collapsible
          className="w-full space-y-4 relative"
        >
          {paginatedTasks.map((task) => {
            const config =
              STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] ||
              STATUS_CONFIG.PENDING;

            return (
              <AccordionItem
                key={task.featureId}
                value={task.featureId.toString()}
                className={`group relative flex flex-col rounded-2xl border bg-card/60 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:bg-card/80 overflow-hidden ${config.animate || ""}`}
              >
                <AccordionTrigger className="hover:no-underline px-5 py-5 m-0 data-[state=open]:border-b">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full pr-4 text-left">
                    <div className="flex items-start gap-4">
                      <div
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${config.base}`}
                      >
                        {config.icon}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground tracking-tight">
                            {task.name}
                          </h3>
                          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-secondary/50 text-secondary-foreground transition-colors">
                            {task.category}
                          </span>
                          {task.dependsOnIds &&
                            task.dependsOnIds.length > 0 && (
                              <div
                                className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 px-2 py-0.5 text-xs font-medium bg-orange-500/10 text-orange-400"
                                title="Dependencies"
                              >
                                <Link className="h-3 w-3" />
                                {task.dependsOnIds
                                  .map(
                                    (id) =>
                                      `FEAT-${id.toString().padStart(3, "0")}`,
                                  )
                                  .join(", ")}
                              </div>
                            )}
                          {task.priority && (
                            <div
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${PRIORITY_CONFIG[task.priority]?.base || PRIORITY_CONFIG.MEDIUM.base}`}
                              title="Priority"
                            >
                              {PRIORITY_CONFIG[task.priority]?.icon ||
                                PRIORITY_CONFIG.MEDIUM.icon}
                              {PRIORITY_CONFIG[task.priority]?.label ||
                                "Medium"}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                            FEAT-{task.featureId.toString().padStart(3, "0")}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <time
                              dateTime={task.updatedAt.toString()}
                              className="text-xs"
                            >
                              {task.status === "IN_PROGRESS"
                                ? "Started "
                                : "Finished "}
                              {timeAgo(task.updatedAt)}
                            </time>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between ml-14 md:ml-0 gap-3">
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium tracking-wide shadow-sm border ${config.base}`}
                      >
                        {config.label}
                      </div>

                      {task.executionMetric ? (
                        <div
                          className={`flex items-center gap-3 flex-wrap ${task.status === "IN_PROGRESS" ? "animate-pulse" : ""}`}
                        >
                          {/* Unique Agent Badges */}
                          {Array.isArray(task.executionMetric.agentsUsed) &&
                            task.executionMetric.agentsUsed.length > 0 &&
                            Array.from(
                              new Set(
                                (
                                  task.executionMetric.agentsUsed as {
                                    role: string;
                                  }[]
                                ).map((r) => r.role),
                              ),
                            ).map((agent: string) => {
                              const style = getAgentStyle(agent);
                              return (
                                <div
                                  key={agent}
                                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border cursor-default ${style.color}`}
                                >
                                  {style.icon}
                                  {agent}
                                </div>
                              );
                            })}

                          {/* Cost & Tokens */}
                          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50">
                            <div
                              className="flex items-center gap-1 cursor-help"
                              title="Tokens used"
                            >
                              <MessageSquare className="h-3 w-3" />
                              {task.executionMetric.promptTokens?.toLocaleString()}
                            </div>
                            <div
                              className="flex items-center gap-1 cursor-help"
                              title="Total API Cost"
                            >
                              <Coins className="h-3 w-3 text-yellow-600/70" />$
                              {task.executionMetric.totalCostUsd?.toFixed(3)}
                            </div>
                          </div>
                        </div>
                      ) : task.status === "IN_PROGRESS" ? (
                        <div className="flex items-center gap-3 text-xs font-medium text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 animate-pulse">
                          <Bot className="h-3.5 w-3.5" />
                          <span>Agents are initializing...</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0 bg-muted/10 border-none m-0">
                  <TaskDetailsPanel task={task} />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed rounded-3xl bg-muted/20">
            <CircleDashed className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No tasks found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-2">
              Try adjusting your filter or wait for more features to be
              processed.
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t mt-6 border-border/50">
            <span className="text-sm text-muted-foreground">
              Showing page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
