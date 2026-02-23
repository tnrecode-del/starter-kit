import { useEffect, useState, useRef } from "react";
import {
  Terminal,
  X,
  Code2,
  PlayCircle,
  Loader2,
  Sparkles,
  AlertCircle,
  Clock,
  Coins,
  MessageSquare,
  Wrench,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getAgentStyle } from "@/entities/task/lib/agent-styles";

interface LogEntry {
  level: number;
  time: number;
  msg: string;
  [key: string]: any;
}

interface TaskDetailsModalProps {
  task: {
    featureId: number;
    name: string;
    category: string;
    status: string;
    testSteps: string;
    resultData?: string | null;
  };
  onClose: () => void;
}

export function TaskDetailsModal({ task, onClose }: TaskDetailsModalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"terminal" | "result">("terminal");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Poll for live logs
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/logs?featureId=${task.featureId}`);
        if (!res.ok) return;
        const data = await res.json();

        setLogs(data.logs || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchLogs();

    // Only poll if the task is not finished
    if (task.status === "IN_PROGRESS" || task.status === "PENDING") {
      interval = setInterval(fetchLogs, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [task.status, task.featureId]);

  const isAtBottomRef = useRef(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      isAtBottomRef.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    }
  };

  // Auto-scroll when logs change
  useEffect(() => {
    if (
      activeTab === "terminal" &&
      scrollRef.current &&
      isAtBottomRef.current
    ) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [logs, activeTab]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-2xl border shadow-xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/20">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                FEAT-{task.featureId.toString().padStart(3, "0")}
              </span>
              <h2 className="text-xl font-bold tracking-tight">{task.name}</h2>
              {task.status === "IN_PROGRESS" && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-full animate-pulse border border-blue-500/20">
                  <Loader2 className="h-3 w-3 animate-spin" /> Live
                </span>
              )}
            </div>

            {(task as any).executionMetric ? (
              <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mt-1">
                <div className="flex items-center gap-1" title="API Cost">
                  <Coins className="h-3.5 w-3.5 text-yellow-600/70" /> $
                  {(task as any).executionMetric.totalCostUsd?.toFixed(3)}
                </div>
                <div
                  className="flex items-center gap-1"
                  title="Tokens consumed"
                >
                  <MessageSquare className="h-3.5 w-3.5" />{" "}
                  {(task as any).executionMetric.promptTokens?.toLocaleString()}
                </div>
                <div className="flex items-center gap-1" title="Time taken">
                  <Clock className="h-3.5 w-3.5" />{" "}
                  {(task as any).executionMetric.durationSeconds?.toFixed(1)}s
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                Category: {task.category}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 self-start">
            {task.status === "IN_PROGRESS" && (
              <button
                onClick={async () => {
                  try {
                    await fetch(`/api/tasks/${task.featureId}/stop`, {
                      method: "POST",
                    });
                    window.location.reload();
                  } catch (err) {
                    console.error("Failed to stop task", err);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                title="Force stop this task"
              >
                <AlertCircle className="h-3.5 w-3.5" /> Stop
              </button>
            )}
            {task.status === "FAILED" && (
              <button
                onClick={async () => {
                  try {
                    await fetch(`/api/tasks/${task.featureId}/retry`, {
                      method: "POST",
                    });
                    window.location.reload();
                  } catch (err) {
                    console.error("Failed to retry task", err);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                title="Restart this task"
              >
                <PlayCircle className="h-3.5 w-3.5" /> Retry
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 bg-muted/50 hover:bg-muted rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 px-6 pt-3 border-b bg-card">
          <button
            onClick={() => setActiveTab("result")}
            className={`pb-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "result"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Overview & Results
          </button>
          <button
            onClick={() => setActiveTab("terminal")}
            className={`pb-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "terminal"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Terminal className="h-4 w-4" />
            Live Activity
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative flex flex-col bg-muted/10">
          {/* Terminal Tab */}
          {activeTab === "terminal" && (
            <div className="flex flex-col h-full bg-[#0d1117] relative">
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 text-[#e6edf3] font-mono text-xs pb-12"
              >
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Awaiting agent initialization...</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 break-all">
                    {logs.map((log, i) => {
                      const time = log.time
                        ? new Date(log.time).toLocaleTimeString([], {
                            hour12: false,
                          })
                        : "";
                      let color = "text-green-400"; // info
                      if (log.level >= 50) color = "text-red-400"; // error
                      if (log.level === 40) color = "text-yellow-400"; // warn
                      if (log.level <= 20) color = "text-gray-500"; // debug

                      return (
                        <div
                          key={i}
                          className="flex flex-col gap-2 p-3 mb-2 rounded-xl border border-border/10 bg-black/40 shadow-sm backdrop-blur-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className={color + " leading-relaxed"}>
                              {log.msg}
                            </span>
                            <span className="text-muted-foreground shrink-0 mt-0.5">
                              {time}
                            </span>
                          </div>

                          {/* Detailed Agent Logs Output */}
                          {(log.agent || log.skill || log.duration) && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/10 flex-wrap text-muted-foreground font-sans">
                              {log.agent &&
                                (() => {
                                  const style = getAgentStyle(log.agent);
                                  return (
                                    <div
                                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${style.color}`}
                                    >
                                      {style.icon}
                                      {log.agent}
                                    </div>
                                  );
                                })()}
                              {log.skill && (
                                <div className="flex items-center gap-1.5 bg-purple-500/10 text-purple-400 px-2 py-1 rounded-md text-xs font-medium border border-purple-500/20">
                                  <Wrench className="h-3 w-3" />
                                  {log.skill}
                                </div>
                              )}
                              {log.duration && (
                                <div className="flex items-center gap-1.5 bg-muted/20 px-2 py-1 rounded-md text-xs border border-border/50">
                                  <Clock className="h-3 w-3" />
                                  {(log.duration / 1000).toFixed(1)}s
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Result Tab */}
          {activeTab === "result" && (
            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-card">
              {/* Task Goals Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-primary" />
                  Task Goals & Requirements
                </h3>
                <div className="bg-muted/30 border p-4 rounded-xl text-sm leading-relaxed text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>
                    {task.testSteps
                      ? task.testSteps.replace(/\s+(?=\d+\.\s)/g, "\n")
                      : "No steps provided"}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Final Result Content */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                  <Code2 className="h-5 w-5 text-primary" />
                  Generated Result
                </h3>
                {!task.resultData ? (
                  <div className="flex flex-col items-center justify-center text-muted-foreground space-y-4 py-8 bg-muted/10 rounded-xl border border-dashed">
                    {task.status === "IN_PROGRESS" ||
                    task.status === "PENDING" ? (
                      <>
                        <div className="relative">
                          <Code2 className="h-10 w-10 opacity-20" />
                          <Loader2 className="h-6 w-6 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
                        </div>
                        <p>Agents are currently writing code...</p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-10 w-10 opacity-20" />
                        <p>No result data was generated for this feature.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/10 p-6 rounded-xl border">
                    <ReactMarkdown>{task.resultData}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
