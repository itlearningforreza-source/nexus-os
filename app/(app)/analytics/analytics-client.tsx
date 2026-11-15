"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/page";
import { Badge } from "@/components/ui/primitive";
import { Icon } from "@/components/ui/icon";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function AnalyticsClient({
  revenue,
  deals,
  tickets,
  projects,
  employees,
  topDeals,
  recentInvoices,
}: {
  revenue: any[];
  deals: any[];
  tickets: any[];
  projects: any[];
  employees: any[];
  topDeals: any[];
  recentInvoices: any[];
}) {
  revenue = revenue || [];
  deals = deals || [];
  tickets = tickets || [];
  projects = projects || [];
  employees = employees || [];
  topDeals = topDeals || [];
  recentInvoices = recentInvoices || [];

  const deptMax = Math.max(0, ...employees.map((e) => e.count || 0));

  const totalRevenue = revenue.reduce((s, r) => s + (r.total || 0), 0);
  const totalDealValue = deals.reduce(
    (s, d) => s + (d.total_value || 0),
    0
  );
  const totalTickets = tickets.reduce((s, t) => s + (t.count || 0), 0);
  const totalProjects = projects.reduce((s, p) => s + (p.count || 0), 0);

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Business intelligence and reporting dashboard"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs text-ink-faint">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold">
            ${(totalRevenue / 1000).toFixed(0)}K
          </p>
          <p className="mt-1 text-xs text-emerald-600">Paid invoices</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-faint">Pipeline Value</p>
          <p className="mt-1 text-2xl font-bold">
            ${(totalDealValue / 1000).toFixed(0)}K
          </p>
          <p className="mt-1 text-xs text-blue-600">{deals.length} stages</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-faint">Support Tickets</p>
          <p className="mt-1 text-2xl font-bold">{totalTickets}</p>
          <p className="mt-1 text-xs text-amber-600">
            {tickets.find((t) => t.status === "Open")?.count || 0} open
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-faint">Active Projects</p>
          <p className="mt-1 text-2xl font-bold">{totalProjects}</p>
          <p className="mt-1 text-xs text-purple-600">
            {projects.find((p) => p.health === "Green")?.count || 0} healthy
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="card p-5">
          <h3 className="h3 mb-4">Revenue Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  stroke="#a1a1aa"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e4e4e7",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deals Pipeline */}
        <div className="card p-5">
          <h3 className="h3 mb-4">Sales Pipeline</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deals}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e4e4e7",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-3">
        {/* Ticket Status */}
        <div className="card p-5">
          <h3 className="h3 mb-4">Ticket Status</h3>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tickets}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="count"
                  nameKey="status"
                >
                  {tickets.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {tickets.map((t, i) => (
              <div key={t.status} className="flex items-center gap-1.5 text-xs">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                {t.status}: {t.count}
              </div>
            ))}
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="card p-5">
          <h3 className="h3 mb-4">Departments</h3>
          <div className="space-y-3">
            {employees.map((e, i) => (
              <div key={e.department}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{e.department}</span>
                  <span className="text-ink-faint">{e.count}</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${deptMax > 0 ? (e.count / deptMax) * 100 : 0}%`,
                      background: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Deals */}
        <div className="card p-5">
          <h3 className="h3 mb-4">Top Deals</h3>
          <div className="space-y-3">
            {topDeals.map((d) => (
              <div
                key={d.title}
                className="flex items-center justify-between rounded-lg border border-line p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{d.title}</p>
                  <p className="text-xs text-ink-faint">{d.company_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold">
                    ${(d.value / 1000).toFixed(0)}K
                  </p>
                  <Badge tone="blue">{d.stage}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-line">
          <h3 className="h3">Recent Invoices</h3>
        </div>
        <table className="table-base">
          <thead>
            <tr>
              <th>Number</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentInvoices.map((inv) => (
              <tr key={inv.number}>
                <td className="font-medium">{inv.number}</td>
                <td>${inv.amount?.toLocaleString()}</td>
                <td>
                  <Badge
                    tone={
                      inv.status === "Paid"
                        ? "green"
                        : inv.status === "Overdue"
                          ? "red"
                          : "neutral"
                    }
                  >
                    {inv.status}
                  </Badge>
                </td>
                <td className="text-ink-faint">
                  {inv.issue_date
                    ? new Date(inv.issue_date).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
