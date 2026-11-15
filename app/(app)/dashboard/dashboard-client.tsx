"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/primitive";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Skeleton } from "@/components/ui/primitive";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate, formatTime, timeAgo } from "@/lib/utils";

const RevenueArea = dynamic(() => import("@/components/charts").then((m) => m.RevenueArea), {
  ssr: false,
  loading: () => <Skeleton className="h-[220px] w-full" />,
});
const PipelineBars = dynamic(() => import("@/components/charts").then((m) => m.PipelineBars), {
  ssr: false,
  loading: () => <Skeleton className="h-[220px] w-full" />,
});
const DonutChart = dynamic(() => import("@/components/charts").then((m) => m.DonutChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[200px] w-full" />,
});
const WeeklyChart = dynamic(() => import("@/components/charts").then((m) => m.WeeklyChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[140px] w-full" />,
});

export function DashboardClient({ user, stats, userById }: { user: any; stats: any; userById: any }) {
  const router = useRouter();
  const toast = useToast();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const taskCompletion = stats.taskData
    ? (stats.taskData.done / Math.max(1, stats.taskData.done + stats.taskData.inprogress + stats.taskData.overdue)) * 100
    : 0;

  const aiInsights = [
    "3 enterprise deals have a high probability of closing this week.",
    "Project Phoenix is 2 days behind schedule — review resources.",
    "2 contracts expire within 45 days — total value $640K at risk of auto-renewal.",
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="h1">
          {greeting}, {user.name.split(" ")[0]}.
        </h1>
        <p className="mt-1 caption">Here's what's happening across Acme Corporation today.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatCurrency(stats.totalRevenue)}
          change="+18.4%"
          icon="finance"
          accent="#10b981"
          spark={[42, 45, 44, 48, 52, 51, 55, 58, 57, 62, 66, 70]}
        />
        <StatCard
          label="Pipeline"
          value={formatCurrency(stats.pipeline)}
          change="+12.1%"
          icon="sales"
          accent="#8b5cf6"
          spark={[22, 24, 23, 27, 30, 29, 33, 35, 34, 38, 41, 44]}
        />
        <StatCard
          label="Active Projects"
          value={String(stats.activeProjects)}
          change={`${stats.atRiskProjects} at risk`}
          changeLabel="needs attention"
          icon="projects"
          trend="neutral"
          accent="#3b82f6"
        />
        <StatCard
          label="Open Tickets"
          value={String(stats.openTickets)}
          change="-12%"
          changeLabel="vs last period"
          icon="ticket"
          trend="up"
          accent="#f59e0b"
        />
      </div>

      {/* Charts row */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="h3">Revenue</h3>
              <p className="mt-0.5 meta">Last 12 months received payments</p>
            </div>
            <Badge tone="green">+18.4% YoY</Badge>
          </div>
          <RevenueArea data={stats.revenueData} />
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="h3">Sales Pipeline</h3>
              <p className="mt-0.5 meta">{stats.openDeals} open deals</p>
            </div>
            <Link href="/sales" className="flex items-center gap-1 text-[13px] font-medium text-accent hover:underline">
              View <Icon name="chevron-right" size={13} />
            </Link>
          </div>
          <PipelineBars data={stats.pipelineData} />
        </div>
      </div>

      {/* Project health + tasks */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="h3">Task Load</h3>
            <Badge>{Math.round(taskCompletion)}% complete</Badge>
          </div>
          <div className="mb-1 flex items-center justify-between text-[13px]">
            <span className="text-ink-soft">Completed</span>
            <span className="font-medium text-ink">{stats.taskData?.done || 0}</span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-subtle">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, taskCompletion)}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="rounded-xl bg-subtle p-3">
              <p className="text-[11px] text-ink-faint">In Progress</p>
              <p className="mt-0.5 text-lg font-semibold">{stats.taskData?.inprogress || 0}</p>
            </div>
            <div className="rounded-xl bg-subtle p-3">
              <p className="flex items-center gap-1 text-[11px] text-ink-faint">
                <Icon name="alert" size={11} className="text-red-500" /> Overdue
              </p>
              <p className="mt-0.5 text-lg font-semibold text-red-500">{stats.taskData?.overdue || 0}</p>
            </div>
          </div>
          <div className="mt-4">
            <WeeklyChart data={stats.weekData} />
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="h3">Upcoming</h3>
            <Link href="/calendar" className="flex items-center gap-1 text-[13px] font-medium text-accent hover:underline">
              Calendar <Icon name="chevron-right" size={13} />
            </Link>
          </div>
          <div className="space-y-1.5">
            {(stats.upcomingEvents || []).slice(0, 5).map((ev: any) => (
              <div key={ev.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-subtle">
                <span className="flex flex-col items-center rounded-lg bg-accent-subtle px-2.5 py-1.5">
                  <span className="text-[13px] font-semibold leading-none text-accent">
                    {formatDate(ev.start).split(" ")[1]}
                  </span>
                  <span className="text-[10px] uppercase text-ink-faint">
                    {formatDate(ev.start).split(" ")[0]}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{ev.title}</p>
                  <p className="text-[12px] text-ink-faint">
                    {formatTime(ev.start)} · {ev.location || "No location"}
                  </p>
                </div>
              </div>
            ))}
            {stats.upcomingEvents?.length === 0 && <p className="caption">No upcoming events.</p>}
          </div>
          <div className="mt-4 border-t border-line pt-3">
            <h4 className="meta mb-2 font-medium">Overdue invoices</h4>
            <div className="space-y-1.5">
              {stats.overdueInvoices?.slice(0, 3).map((inv: any) => (
                <div key={inv.number} className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-soft">{inv.number} · {inv.company}</span>
                  <span className="font-medium text-red-500">{formatCurrency(inv.amount, inv.currency)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="h3 flex items-center gap-1.5">
              <Icon name="sparkles" size={15} className="text-accent" /> AI Insights
            </h3>
            <Badge tone="blue">3 insights</Badge>
          </div>
          <div className="space-y-3">
            {aiInsights.map((ins, i) => (
              <div key={i} className="flex gap-2.5 rounded-xl border border-line bg-subtle/60 p-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                  <Icon name="sparkles" size={11} className="text-accent" />
                </span>
                <p className="text-[13px] leading-relaxed text-ink-soft">{ins}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-line pt-3">
            <h4 className="meta mb-2 font-medium">Top accounts</h4>
            <div className="space-y-2">
              {stats.topAccounts?.map((c: any) => (
                <div key={c.id} className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${c.health === "Healthy" ? "bg-emerald-500" : c.health === "At Risk" ? "bg-amber-500" : "bg-red-500"}`} />
                    <span className="truncate text-[13px] text-ink-soft">{c.name}</span>
                  </div>
                  <span className="text-[13px] font-medium text-ink">{formatCurrency(c.deal_value || 0)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-accent-subtle p-3">
            <Icon name="ai" size={16} className="text-accent" />
            <button
              onClick={() => router.push("/ai")}
              className="text-[13px] font-medium text-accent hover:underline"
            >
              Ask AI what needs attention →
            </button>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card mt-4 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="h3 flex items-center gap-2">
            <Icon name="activity" size={15} className="text-ink-faint" /> Recent activity
          </h3>
          <span className="meta">Live workspace feed</span>
        </div>
        <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
          {stats.recentActivity?.map((a: any, i: number) => {
            const u = userById[a.user_id] || { name: "System" };
            return (
              <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-subtle">
                <Avatar name={u.name} color={u.avatar_color} size="sm" />
                <p className="flex-1 truncate text-[13px] text-ink-soft">
                  <span className="font-medium text-ink">{u.name}</span> {a.action.toLowerCase()}
                </p>
                <span className="meta">{timeAgo(a.created_at)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}