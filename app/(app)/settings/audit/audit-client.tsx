"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/page";
import { Badge } from "@/components/ui/primitive";

export function AuditSettingsClient({ logs }: { logs: any[] }) {
  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="Track all actions across your organization"
      />

      <div className="card overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-faint">
            No audit logs yet
          </div>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Object</th>
                <th>Result</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="font-medium">{log.user_name || "System"}</td>
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
                  <td className="text-ink-soft">
                    {log.object} {log.object_id ? `#${log.object_id.slice(0, 8)}` : ""}
                  </td>
                  <td>
                    <Badge tone={log.result === "success" ? "green" : "red"}>
                      {log.result}
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
  );
}
