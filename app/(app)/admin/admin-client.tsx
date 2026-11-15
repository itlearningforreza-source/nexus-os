"use client";

import * as React from "react";
import { Icon } from "@/components/ui/icon";
import { Badge, Switch } from "@/components/ui/primitive";
import { PageHeader } from "@/components/ui/page";

export function AdminClient({
  org,
  userCount,
  totalDeals,
  totalRevenue,
  featureFlags,
  auditLogs,
}: {
  org: any;
  userCount: number;
  totalDeals: number;
  totalRevenue: number;
  featureFlags: any[];
  auditLogs: any[];
}) {
  const [flags, setFlags] = React.useState(featureFlags);

  const toggleFlag = async (id: string) => {
    const next = flags.map((f) => (f.id === id ? { ...f, enabled: f.enabled ? 0 : 1 } : f));
    setFlags(next);
    try {
      const res = await fetch("/api/feature-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flags: next }),
      });
      if (!res.ok) {
        setFlags(flags);
      }
    } catch {
      setFlags(flags);
    }
  };

  return (
    <div>
      <PageHeader
        title="Admin Console"
        description="Organization administration and system health"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
              <Icon name="hr" size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{userCount}</p>
              <p className="text-xs text-ink-faint">Users</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
              <Icon name="sales" size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalDeals}</p>
              <p className="text-xs text-ink-faint">Total Deals</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10">
              <Icon name="finance" size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                ${(totalRevenue / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-ink-faint">Revenue</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10">
              <Icon name="admin" size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{flags.length}</p>
              <p className="text-xs text-ink-faint">Feature Flags</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Feature Flags */}
        <div className="card p-5">
          <h3 className="h3 mb-4">Feature Flags</h3>
          <div className="space-y-1">
            {flags.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between py-2.5 border-b border-line last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{f.name}</p>
                  {f.description && (
                    <p className="text-xs text-ink-faint mt-0.5">
                      {f.description}
                    </p>
                  )}
                </div>
                <Switch
                  checked={!!f.enabled}
                  onCheckedChange={() => toggleFlag(f.id)}
                />
              </div>
            ))}
            {flags.length === 0 && (
              <p className="text-sm text-ink-faint py-4 text-center">
                No feature flags configured
              </p>
            )}
          </div>
        </div>

        {/* Audit Log */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <h3 className="h3">Recent Audit Log</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="p-5 text-sm text-ink-faint text-center">
                No audit logs
              </p>
            ) : (
              <table className="table-base">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="text-sm">{log.user_name || "System"}</td>
                      <td>
                        <Badge
                          tone={
                            log.action?.includes("create")
                              ? "green"
                              : log.action?.includes("delete")
                                ? "red"
                                : "neutral"
                          }
                        >
                          {log.action}
                        </Badge>
                      </td>
                      <td className="text-xs text-ink-faint whitespace-nowrap">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
