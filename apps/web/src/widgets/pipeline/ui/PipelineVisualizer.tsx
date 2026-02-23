"use client";

import { useState, useEffect } from "react";
import {
  Lightbulb,
  Sparkles,
  Network,
  Terminal,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";

const getStages = (t: any) => [
  {
    id: "idea",
    label: t("stages.analyze.label"),
    icon: <Lightbulb className="h-5 w-5" />,
    description: t("stages.analyze.description"),
    content: (
      <div className="space-y-4 font-mono text-sm">
        <div className="flex items-center gap-3 text-foreground/90 bg-muted/30 p-3 rounded-lg border border-border/50 shadow-inner">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          <span className="font-semibold">{t("stages.analyze.promptMsg")}</span>
        </div>
        <div className="p-4 bg-background/50 rounded-lg border border-border shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-linear-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-muted-foreground leading-relaxed italic relative z-10">
            {t("stages.analyze.promptText")}
          </p>
        </div>
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>{t("stages.analyze.parsing")}</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground opacity-50">
            <ChevronRight className="h-4 w-4" />
            <span>{t("stages.analyze.searching")}</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span
              className="flex items-center gap-1.5"
              title={t("stages.analyze.execTime")}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              1.2s
            </span>
            <span
              className="flex items-center gap-1.5"
              title={t("stages.analyze.llmCost")}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" x2="12" y1="2" y2="22" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              $0.002
            </span>
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-0.5 rounded bg-muted">ContextManager</span>
            <span className="px-2 py-0.5 rounded bg-muted">VectorDB</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "design",
    label: t("stages.architect.label"),
    icon: <Sparkles className="h-5 w-5" />,
    description: t("stages.architect.description"),
    content: (
      <div className="space-y-5 font-mono text-sm">
        <div className="flex items-center gap-3 text-emerald-500 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-semibold">{t("stages.architect.drafted")}</span>
        </div>
        <div className="p-4 bg-[#0d1117] rounded-lg border border-border shadow-inner text-emerald-400/90 leading-loose overflow-x-auto">
          <p className="text-emerald-300">├── apps/web/src/widgets/</p>
          <p className="border-l border-emerald-500/30 ml-2 pl-4">
            ├── pipeline/
          </p>
          <p className="border-l border-emerald-500/30 ml-2 pl-4 text-emerald-200 font-bold bg-emerald-500/20 py-0.5 px-2 rounded-md inline-block my-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            │ └── ui/PipelineVisualizer.tsx
          </p>
          <p className="border-l border-emerald-500/30 ml-2 pl-4">
            └── shared/config/tokens.ts
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              0.8s
            </span>
            <span className="flex items-center gap-1.5">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" x2="12" y1="2" y2="22" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              $0.005
            </span>
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-0.5 rounded bg-muted">ArchitectAgent</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "orchestrate",
    label: t("stages.orchestrate.label"),
    icon: <Network className="h-5 w-5" />,
    description: t("stages.orchestrate.description"),
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-primary text-sm font-semibold mb-4 bg-primary/10 p-3 rounded-lg border border-primary/20">
          <Network className="h-4 w-4 animate-pulse" />
          <span>{t("stages.orchestrate.spawning")}</span>
        </div>
        <div className="grid gap-3">
          {[
            {
              agent: "frontend-ui-1",
              task: t("stages.orchestrate.task1"),
              progress: 100,
              status: "done",
            },
            {
              agent: "frontend-logic-1",
              task: t("stages.orchestrate.task2"),
              progress: 85,
              status: "active",
            },
            {
              agent: "qa-testing-2",
              task: t("stages.orchestrate.task3"),
              progress: 30,
              status: "pending",
            },
          ].map((a, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border transition-colors ${
                a.status === "active"
                  ? "bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                  : a.status === "done"
                    ? "bg-muted/30 border-emerald-500/20"
                    : "bg-muted/10 border-border/50"
              }`}
            >
              <div className="flex justify-between items-center text-xs mb-2">
                <div className="flex items-center gap-2">
                  {a.status === "active" ? (
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  ) : a.status === "done" ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground ml-0.5" />
                  )}
                  <span
                    className={`font-semibold ${a.status === "done" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}
                  >
                    @{a.agent}
                  </span>
                </div>
                <span className="text-muted-foreground font-mono">
                  {a.progress}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${a.status === "done" ? "bg-emerald-500" : "bg-primary relative overflow-hidden"}`}
                  style={{ width: `${a.progress}%` }}
                >
                  {a.status === "active" && (
                    <div className="absolute inset-0 bg-white/20 animate-[translateX_1s_infinite] -translate-x-full" />
                  )}
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground mt-2 font-mono">
                $ {a.task}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 truncate">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              {t("stages.orchestrate.savings")}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-0.5 rounded bg-muted text-[10px] hidden sm:block">
              AgentSwarm
            </span>
            <span className="px-2 py-0.5 rounded bg-muted text-[10px]">
              PlannerAgent
            </span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "execute",
    label: t("stages.execute.label"),
    icon: <Terminal className="h-5 w-5" />,
    description: t("stages.execute.description"),
    content: (
      <div className="bg-[#0d1117] rounded-lg p-4 font-mono text-xs overflow-hidden relative shadow-inner border border-border/50 h-[280px] flex flex-col">
        {/* Editor Tab */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10 text-muted-foreground">
          <Terminal className="h-3.5 w-3.5" />
          <span>PipelineVisualizer.tsx</span>
          <span className="ml-auto text-[10px] text-primary bg-primary/20 px-1.5 py-0.5 rounded">
            {t("stages.execute.autosaving")}
          </span>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <div className="absolute top-0 w-full h-8 bg-linear-to-b from-[#0d1117] to-transparent z-10" />

          <div className="text-[#8b949e]">
            1 <span className="text-[#ff7b72]">import</span> {"{"}{" "}
            <span className="text-[#c9d1d9]">useState</span>,{" "}
            <span className="text-[#c9d1d9]">useEffect</span> {"}"}{" "}
            <span className="text-[#ff7b72]">from</span>{" "}
            <span className="text-[#a5d6ff]">"react"</span>;
          </div>
          <div className="text-[#8b949e]">2</div>
          <div className="text-[#8b949e]">
            3 <span className="text-[#ff7b72]">export</span>{" "}
            <span className="text-[#ff7b72]">function</span>{" "}
            <span className="text-[#d2a8ff]">PipelineVisualizer</span>() {"{"}
          </div>
          <div className="pl-4">
            <div className="text-[#8b949e]">
              4 <span className="text-[#ff7b72]">const</span>{" "}
              <span className="text-[#c9d1d9]">
                [activeIndex, setActiveIndex] =
              </span>{" "}
              <span className="text-[#d2a8ff]">useState</span>
              <span className="text-[#c9d1d9]">(0);</span>
            </div>
            <div className="text-[#8b949e]">5</div>
            <div className="text-[#8b949e]">
              6 <span className="text-[#d2a8ff]">useEffect</span>
              <span className="text-[#c9d1d9]">(()</span>{" "}
              <span className="text-[#ff7b72]">{`=>`}</span>{" "}
              <span className="text-[#c9d1d9]">{"{"}</span>
            </div>
            <div className="pl-4 text-[#8b949e] italic pb-1">
              7 // Auto-cycling active pipeline stage
            </div>
            <div className="pl-4 text-[#8b949e]">
              8 <span className="text-[#ff7b72]">const</span>{" "}
              <span className="text-[#c9d1d9]">timer =</span>{" "}
              <span className="text-[#d2a8ff]">setInterval</span>
              <span className="text-[#c9d1d9]">(()</span>{" "}
              <span className="text-[#ff7b72]">{`=>`}</span>{" "}
              <span className="text-[#c9d1d9]">{"{"}</span>
            </div>
            <div className="pl-8 text-[#8b949e]">
              9{" "}
              <span className="text-[#d2a8ff] relative">
                setActiveIndex
                <span className="absolute -right-2 top-0 bottom-0 w-1.5 bg-primary animate-pulse" />
              </span>
              <span className="text-[#c9d1d9] opacity-50">
                ((prev) {`=>`} (prev + 1) % STAGES.length);
              </span>
            </div>
            <div className="pl-4 text-[#8b949e]">
              10 <span className="text-[#c9d1d9]">{"}"},</span>{" "}
              <span className="text-[#79c0ff]">4000</span>
              <span className="text-[#c9d1d9]">);</span>
            </div>
            <div className="text-[#8b949e]">
              11 <span className="text-[#ff7b72]">return</span>{" "}
              <span className="text-[#c9d1d9]">()</span>{" "}
              <span className="text-[#ff7b72]">{`=>`}</span>{" "}
              <span className="text-[#d2a8ff]">clearInterval</span>
              <span className="text-[#c9d1d9]">(timer);</span>
            </div>
          </div>
          <div className="text-[#8b949e]">
            12 <span className="text-[#c9d1d9]">{"}"}</span>
          </div>
          <div className="absolute bottom-0 w-full h-12 bg-linear-to-t from-[#0d1117] to-transparent z-10" />
        </div>
        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[#8b949e] opacity-70 flex-shrink-0 z-20">
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1.5">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              3.4s
            </span>
            <span className="flex items-center gap-1.5">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              $0.008
            </span>
          </div>
          <div className="flex gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] border border-white/10">
              CodeWriter
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] border border-white/10 hidden sm:block">
              LinterTool
            </span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "test",
    label: t("stages.verify.label"),
    icon: <ShieldCheck className="h-5 w-5" />,
    description: t("stages.verify.description"),
    content: (
      <div className="space-y-3 font-mono text-sm h-[280px] flex flex-col justify-center">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 text-emerald-500 bg-emerald-500/5 p-2.5 rounded border border-emerald-500/10">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{t("stages.verify.test1")}</span>
            <span className="ml-auto text-xs opacity-60">12ms</span>
          </div>
          <div className="flex items-center gap-3 text-emerald-500 bg-emerald-500/5 p-2.5 rounded border border-emerald-500/10">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{t("stages.verify.test2")}</span>
            <span className="ml-auto text-xs opacity-60">8ms</span>
          </div>
          <div className="flex items-center gap-3 text-emerald-500 bg-emerald-500/5 p-2.5 rounded border border-emerald-500/10">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{t("stages.verify.test3")}</span>
            <span className="ml-auto text-xs opacity-60">2ms</span>
          </div>
          <div className="flex items-center gap-3 text-emerald-500 bg-emerald-500/5 p-2.5 rounded border border-emerald-500/10">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{t("stages.verify.test4")}</span>
            <span className="ml-auto text-xs opacity-60">45ms</span>
          </div>
        </div>

        <div className="mt-4 p-4 bg-linear-to-r from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 rounded-xl text-center shadow-[0_0_20px_rgba(16,185,129,0.15)] transform hover:scale-[1.02] transition-transform">
          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-base tracking-wide flex items-center justify-center gap-2">
            <RocketIcon />
            {t("stages.verify.ready")}
          </span>
        </div>
        <div className="mt-4 pt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4 text-emerald-600/70 dark:text-emerald-400/70">
            <span className="flex items-center gap-1.5 font-semibold">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {t("stages.verify.totalTime")}
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              {t("stages.verify.totalCost")}
            </span>
          </div>
        </div>
      </div>
    ),
  },
];

function RocketIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

export function PipelineVisualizer() {
  const t = useTranslations("PipelineVisualizer");
  const STAGES = getStages(t);

  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let startTime = performance.now();
    const cycleTime = 4000; // 4 seconds per stage

    const animate = (time: number) => {
      const elapsed = time - startTime;
      let newProgress = (elapsed / cycleTime) * 100;

      if (elapsed >= cycleTime) {
        // Next stage
        startTime = time;
        newProgress = 0;
        setActiveIndex((prev) => (prev + 1) % STAGES.length);
      }

      setProgress(Math.min(newProgress, 100));
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="w-full flex flex-col h-full bg-card/40">
      {/* Mock Browser Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border/50 bg-muted/40 px-4 py-3">
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-destructive/80 shadow-sm" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80 shadow-sm" />
          <div className="h-3 w-3 rounded-full bg-emerald-500/80 shadow-sm" />
        </div>
        <div className="flex-1 max-w-sm flex justify-center">
          <div className="h-7 w-full rounded-md bg-background/80 border border-border/60 flex items-center justify-center text-[13px] text-muted-foreground font-mono shadow-sm">
            <span className="opacity-50 mr-1">https://</span>
            ai-orchestrator.starter.kit
          </div>
        </div>
        <div className="w-16" /> {/* Spacer */}
      </div>

      <div className="flex flex-col md:flex-row min-h-[400px] flex-1">
        {/* Left: Vertical Pipeline Stages (Desktop) / Horizontal (Mobile) */}
        <div className="flex md:flex-col justify-between md:justify-start md:w-56 p-4 md:p-6 border-b md:border-b-0 md:border-r border-border/50 bg-background/20 gap-2 md:gap-4 overflow-x-auto md:overflow-visible">
          {STAGES.map((stage, idx) => {
            const isActive = idx === activeIndex;
            const isPast = idx < activeIndex;

            return (
              <div
                key={stage.id}
                className={`flex items-center gap-3 md:gap-4 cursor-pointer group transition-all duration-300 md:w-full min-w-max p-2 md:p-3 rounded-xl ${
                  isActive
                    ? "bg-primary/10 border-primary/20 shadow-sm border"
                    : "hover:bg-muted border border-transparent"
                }`}
                onClick={() => {
                  setActiveIndex(idx);
                  setProgress(0);
                }}
              >
                <div
                  className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-500 shadow-sm ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)] ring-2 ring-primary/20"
                      : isPast
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {stage.icon}
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg bg-primary/20 animate-ping" />
                  )}
                </div>

                <div className="hidden md:block">
                  <h4
                    className={`font-semibold text-sm transition-colors ${
                      isActive
                        ? "text-primary"
                        : isPast
                          ? "text-foreground/80"
                          : "text-muted-foreground"
                    }`}
                  >
                    {stage.label}
                  </h4>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5 font-medium">
                    {t("step")} {idx + 1}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Dynamic Content Area */}
        <div className="p-6 md:p-8 relative overflow-hidden flex flex-col flex-1 bg-background/10">
          <div className="mb-6 flex justify-between items-center z-20 relative">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-primary flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              {t("header.liveStream")}
            </h3>
            <span className="text-[10px] md:text-xs font-mono text-muted-foreground border border-border/50 px-2 py-1 rounded-full bg-background/50">
              {STAGES[activeIndex].id}.log
            </span>
          </div>

          <div className="flex-1 relative w-full h-[320px]">
            {STAGES.map((stage, idx) => (
              <div
                key={stage.id}
                className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                  idx === activeIndex
                    ? "opacity-100 translate-x-0 relative z-10 scale-100"
                    : idx < activeIndex
                      ? "opacity-0 -translate-x-8 absolute z-0 pointer-events-none scale-95"
                      : "opacity-0 translate-x-8 absolute z-0 pointer-events-none scale-95"
                }`}
              >
                <div className="h-full w-full flex flex-col justify-center">
                  <h4 className="text-xl font-bold mb-2 text-foreground/90 hidden md:block">
                    {stage.label}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4 hidden md:block">
                    {stage.description}
                  </p>
                  <div className="w-full">{stage.content}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Stage Progress Bar */}
          <div className="mt-8 relative z-20">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span className="font-medium">
                {t("executingStage")} • {STAGES[activeIndex].label}
              </span>
              <span className="font-mono text-primary">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-muted/80 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-primary relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute top-0 right-0 bottom-0 left-0 bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
