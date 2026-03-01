"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@shared/ui/chart";
import {
  Activity,
  CircleDollarSign,
  CheckCircle2,
  ListTodo,
} from "lucide-react";

interface AdminDashboardMetricsProps {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  totalSpend: number;
  budgetLimit: number;
  tasksPerDay: { date: string; tasks: number }[];
  topAgents: { agent: string; cost: number }[];
}

export function AdminDashboardMetrics({
  totalTasks,
  activeTasks,
  completedTasks,
  totalSpend,
  budgetLimit,
  tasksPerDay,
  topAgents,
}: AdminDashboardMetricsProps) {
  const burnRatePercent = Math.min(
    100,
    Math.round((totalSpend / budgetLimit) * 100),
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex flex-col rounded-2xl border bg-card/60 backdrop-blur-xl p-5 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-2">
            <ListTodo className="h-4 w-4 text-purple-500" /> Total Tasks
          </span>
          <div className="text-3xl font-bold">{totalTasks}</div>
        </div>

        <div className="flex flex-col rounded-2xl border bg-card/60 backdrop-blur-xl p-5 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-blue-500" /> Active
          </span>
          <div className="text-3xl font-bold">{activeTasks}</div>
        </div>

        <div className="flex flex-col rounded-2xl border bg-card/60 backdrop-blur-xl p-5 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Finished
          </span>
          <div className="text-3xl font-bold text-emerald-600">
            {completedTasks}
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border bg-card/60 backdrop-blur-xl p-5 shadow-sm relative overflow-hidden">
          <div
            className="absolute bottom-0 left-0 h-1 bg-primary transition-all rounded-r-full"
            style={{ width: `${burnRatePercent}%` }}
          />
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-2">
            <CircleDollarSign className="h-4 w-4 text-amber-500" /> Budget Burn
          </span>
          <div className="text-3xl font-bold">
            ${totalSpend.toFixed(2)}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              / ${budgetLimit.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tasks per Day Chart */}
        <div className="rounded-2xl border bg-card/60 backdrop-blur-xl p-5 shadow-sm flex flex-col h-72">
          <div className="mb-4">
            <h3 className="text-sm font-medium">Tasks (Last 7 Days)</h3>
            <p className="text-xs text-muted-foreground">
              Processing volume relative to time
            </p>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ChartContainer
              config={{
                tasks: { label: "Tasks", color: "var(--color-primary)" },
              }}
              className="w-full h-full"
            >
              <BarChart data={tasksPerDay}>
                <CartesianGrid vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="tasks"
                  fill="var(--color-tasks)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        {/* Top Agents Chart */}
        <div className="rounded-2xl border bg-card/60 backdrop-blur-xl p-5 shadow-sm flex flex-col h-72">
          <div className="mb-4">
            <h3 className="text-sm font-medium">Top Agents by Cost</h3>
            <p className="text-xs text-muted-foreground">
              Aggregated spend in USD
            </p>
          </div>
          <div className="flex-1 w-full min-h-0">
            {topAgents.length > 0 ? (
              <ChartContainer
                config={{
                  cost: { label: "Cost ($)", color: "var(--color-chart-2)" },
                }}
                className="w-full h-full"
              >
                <BarChart data={topAgents} layout="vertical">
                  <CartesianGrid horizontal={false} opacity={0.3} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="agent"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="cost"
                    fill="var(--color-cost)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                No cost data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
