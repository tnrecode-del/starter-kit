import { useEffect, useState, useRef } from "react";
import {
  Terminal,
  Code2,
  PlayCircle,
  Loader2,
  AlertCircle,
  Clock,
  Wrench,
  BarChart2,
  LayoutDashboard,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getAgentStyle } from "@/entities/task/lib/agent-styles";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@core/shared";
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

interface LogEntry {
  level: number;
  time: number;
  msg: string;
  agent?: string;
  skill?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface TaskDetailsPanelProps {
  task: {
    featureId: number;
    name: string;
    category: string;
    status: string;
    testSteps: string;
    resultData?: string | null;
    executionMetric?: any;
    roiMetric?: any;
  };
}

export function TaskDetailsPanel({ task }: TaskDetailsPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
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
    if (scrollRef.current && isAtBottomRef.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [logs]);

  // Extract changed files if present in resultData
  const getChangedFiles = () => {
    if (!task.resultData) return null;
    const match = task.resultData.match(
      /### Changed Files\n\n```text\n([\s\S]*?)```/,
    );
    if (match && match[1]) {
      return match[1].trim().split("\n").filter(Boolean);
    }
    return null;
  };

  const changedFiles = getChangedFiles();

  return (
    <div className="flex flex-col border-t bg-muted/5 animate-in fade-in slide-in-from-top-2 duration-300 relative z-0">
      <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent pointer-events-none" />

      <Tabs
        defaultValue="metrics"
        className="w-full flex flex-col h-[500px] md:h-auto"
      >
        {/* Controls & Tabs Header */}
        <div className="flex items-center justify-between px-6 py-2 border-b bg-muted/20 sticky top-0 z-10">
          <TabsList className="bg-transparent space-x-2 h-10 w-auto p-0">
            <TabsTrigger
              value="metrics"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-2 pt-2 h-full flex items-center gap-2 text-sm"
            >
              <BarChart2 className="h-4 w-4" />
              Metrics
            </TabsTrigger>
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-2 pt-2 h-full flex items-center gap-2 text-sm"
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview & Results
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 pb-2 pt-2 h-full flex items-center gap-2 text-sm"
            >
              <Terminal className="h-4 w-4" />
              Live Logs
              {task.status === "IN_PROGRESS" && (
                <span className="relative flex h-2 w-2 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {task.status === "IN_PROGRESS" && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
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
                <AlertCircle className="h-3.5 w-3.5" /> Stop Task
              </button>
            )}
            {task.status === "FAILED" && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
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
                <PlayCircle className="h-3.5 w-3.5" /> Retry Task
              </button>
            )}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-hidden relative md:overflow-visible">
          <TabsContent
            value="overview"
            className="h-full md:h-auto m-0 p-0 overflow-y-auto md:overflow-visible"
          >
            <div className="p-8 space-y-8 min-h-full">
              {/* Task Goals Section */}
              <div className="space-y-3 max-w-4xl mx-auto">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                  <PlayCircle className="h-4 w-4" />
                  Requirements
                </h3>
                <div className="bg-background/50 border p-5 rounded-xl text-sm leading-relaxed text-foreground prose prose-sm dark:prose-invert max-w-none shadow-xs">
                  <ReactMarkdown>
                    {task.testSteps
                      ? task.testSteps.replace(/\s+(?=\d+\.\s)/g, "\n")
                      : "No requirements provided"}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Final Result Content */}
              <div className="space-y-3 max-w-4xl mx-auto pb-8">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider border-b pb-2">
                  <Code2 className="h-4 w-4" />
                  Generated Result
                </h3>
                {!task.resultData ? (
                  <div className="flex flex-col items-center justify-center text-muted-foreground space-y-4 py-12 bg-background/30 rounded-xl border border-dashed">
                    {task.status === "IN_PROGRESS" ||
                    task.status === "PENDING" ? (
                      <>
                        <div className="relative">
                          <Code2 className="h-10 w-10 opacity-20" />
                          <Loader2 className="h-6 w-6 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
                        </div>
                        <p>Agents are currently working...</p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-10 w-10 opacity-20" />
                        <p>No result data was generated.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="bg-background/50 border p-5 rounded-xl shadow-xs space-y-4">
                    <p className="text-sm text-muted-foreground">
                      The designated AI agents have completed processing this
                      task. The generated codebase files and architecture
                      guidelines are available via the detailed output below.
                    </p>

                    {changedFiles && changedFiles.length > 0 && (
                      <div className="space-y-2 mt-4 mb-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                          <Code2 className="h-4 w-4" /> Changed Files
                        </h4>
                        <ul className="text-sm text-muted-foreground bg-muted/20 border rounded-md p-3 space-y-1 font-mono overflow-x-auto max-h-[300px] overflow-y-auto">
                          {changedFiles.map((f, i) => {
                            const isAdded = f.startsWith("A");
                            const isDeleted = f.startsWith("D");

                            return (
                              <li key={i} className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-bold px-1.5 py-0.5 rounded ${isAdded ? "bg-green-500/20 text-green-500" : isDeleted ? "bg-red-500/20 text-red-500" : "bg-blue-500/20 text-blue-500"}`}
                                >
                                  {f.split(/\s+/)[0]}
                                </span>
                                <span>{f.split(/\s+/).slice(1).join(" ")}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="raw-output" className="border-none">
                        <AccordionTrigger className="hover:no-underline px-4 py-3 bg-muted/20 rounded-md border text-sm data-[state=open]:rounded-b-none transition-all">
                          View Raw Output
                        </AccordionTrigger>
                        <AccordionContent className="p-4 bg-muted/10 border border-t-0 rounded-b-md max-h-[400px] overflow-y-auto">
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{task.resultData}</ReactMarkdown>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="metrics"
            className="h-full md:h-auto m-0 p-0 overflow-y-auto md:overflow-visible"
          >
            <div className="p-8 space-y-8 min-h-full max-w-4xl mx-auto">
              {!task.executionMetric ? (
                <div className="flex flex-col items-center justify-center text-muted-foreground space-y-4 py-16 bg-background/30 rounded-xl border border-dashed">
                  {task.status === "IN_PROGRESS" ||
                  task.status === "PENDING" ? (
                    <>
                      <div className="relative">
                        <BarChart2 className="h-10 w-10 opacity-20" />
                        <Loader2 className="h-6 w-6 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
                      </div>
                      <p>
                        Aggregating metrics... This will be available when
                        agents finish.
                      </p>
                    </>
                  ) : (
                    <>
                      <BarChart2 className="h-10 w-10 opacity-20" />
                      <p>Metrics are not available for this task.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Token Breakdown */}
                  <div className="bg-background/50 border p-6 rounded-xl shadow-xs">
                    <h3 className="text-sm font-semibold mb-6 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                      Token Breakdown
                    </h3>
                    <div className="h-[250px] w-full">
                      <ChartContainer
                        config={{
                          prompt: {
                            label: "Prompt",
                            color: "var(--color-chart-1)",
                          },
                          completion: {
                            label: "Completion",
                            color: "var(--color-chart-2)",
                          },
                          cached: {
                            label: "Cached",
                            color: "var(--color-chart-3)",
                          },
                        }}
                        className="w-full h-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Pie
                              data={[
                                {
                                  name: "Prompt",
                                  value: task.executionMetric.promptTokens || 0,
                                  fill: "var(--color-chart-1)",
                                },
                                {
                                  name: "Completion",
                                  value:
                                    task.executionMetric.completionTokens || 0,
                                  fill: "var(--color-chart-2)",
                                },
                                {
                                  name: "Cached",
                                  value: task.executionMetric.cachedTokens || 0,
                                  fill: "var(--color-chart-3)",
                                },
                              ]}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  </div>

                  {/* Cost Details */}
                  <div className="bg-background/50 border p-6 rounded-xl shadow-xs">
                    <h3 className="text-sm font-semibold mb-6 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                      Cost Details
                    </h3>
                    <div className="h-[250px] w-full">
                      <ChartContainer
                        config={{
                          cost: {
                            label: "$Cost",
                            color: "var(--color-chart-4)",
                          },
                        }}
                        className="w-full h-full"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={task.executionMetric.agentsUsed?.map(
                              (a: any) => ({
                                name: a.role.split("-")[0],
                                cost: a.cost,
                              }),
                            )}
                            margin={{
                              top: 10,
                              right: 10,
                              left: -20,
                              bottom: 0,
                            }}
                          >
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(val) => `$${val}`}
                              tick={{ fontSize: 12 }}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar
                              dataKey="cost"
                              fill="var(--color-chart-4)"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 col-span-full">
                    <div className="bg-background/50 border p-4 rounded-xl flex flex-col gap-1 items-center justify-center text-center">
                      <span className="text-2xl font-bold tracking-tight text-primary">
                        ${task.executionMetric.totalCostUsd?.toFixed(3)}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Total Cost
                      </span>
                    </div>
                    <div className="bg-background/50 border p-4 rounded-xl flex flex-col gap-1 items-center justify-center text-center">
                      <span className="text-2xl font-bold tracking-tight">
                        {task.executionMetric.durationSeconds}s
                      </span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Duration
                      </span>
                    </div>
                    <div className="bg-background/50 border p-4 rounded-xl flex flex-col gap-1 items-center justify-center text-center">
                      <span className="text-2xl font-bold tracking-tight">
                        {task.executionMetric.successRate}%
                      </span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Success
                      </span>
                    </div>
                    <div className="bg-background/50 border p-4 rounded-xl flex flex-col gap-1 items-center justify-center text-center">
                      <span className="text-2xl font-bold tracking-tight text-primary">
                        {task.roiMetric?.estimatedHumanHoursSaved
                          ? `${task.roiMetric.estimatedHumanHoursSaved}h`
                          : "--"}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Hours Saved
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="h-full md:h-[500px] m-0 p-0">
            <div className="flex flex-col h-full bg-[#0d1117] relative">
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 md:p-6 text-[#e6edf3] font-mono text-xs pb-12"
              >
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Awaiting agent initialization...</p>
                  </div>
                ) : (
                  <div className="space-y-2 break-all max-w-5xl mx-auto">
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
                          className="flex flex-col gap-2 p-3 rounded-lg border border-white/5 bg-black/40 hover:bg-black/60 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <span className={color + " leading-relaxed"}>
                              {log.msg}
                            </span>
                            <span className="text-white/30 shrink-0 mt-0.5 whitespace-nowrap">
                              {time}
                            </span>
                          </div>

                          {/* Detailed Agent Logs Output */}
                          {(log.agent || log.skill || log.duration) && (
                            <div className="flex items-center gap-2 mt-1 pt-2 border-t border-white/5 flex-wrap text-white/50 font-sans">
                              {log.agent &&
                                (() => {
                                  const style = getAgentStyle(log.agent);
                                  return (
                                    <div
                                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border ${style.color}`}
                                    >
                                      {style.icon}
                                      {log.agent}
                                    </div>
                                  );
                                })()}
                              {log.skill && (
                                <div className="flex items-center gap-1.5 bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded text-[10px] font-medium border border-purple-500/20">
                                  <Wrench className="h-3 w-3" />
                                  {log.skill}
                                </div>
                              )}
                              {log.duration && (
                                <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded text-[10px] border border-white/10">
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
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
