"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/primitive";
import { PageHeader } from "@/components/ui/page";

const tabs = [
  { id: "all", label: "All" },
  { id: "mentions", label: "Mentions" },
  { id: "assignments", label: "Assignments" },
  { id: "tasks", label: "Tasks" },
  { id: "notifications", label: "Notifications" },
];

export function InboxClient({
  notifications,
  tasks,
  tickets,
}: {
  notifications: any[];
  tasks: any[];
  tickets: any[];
}) {
  const [activeTab, setActiveTab] = React.useState("all");

  const allItems = [
    ...notifications.map((n) => ({
      id: n.id,
      type: "notification" as const,
      title: n.title,
      body: n.body,
      category: n.category,
      read: n.read,
      time: n.created_at,
    })),
    ...tasks.map((t) => ({
      id: t.id,
      type: "task" as const,
      title: t.title,
      body: `Priority: ${t.priority} · Status: ${t.status}`,
      category: "task",
      read: 0,
      time: t.created_at,
    })),
    ...tickets.map((t) => ({
      id: t.id,
      type: "ticket" as const,
      title: t.subject || `Ticket #${t.number}`,
      body: `${t.priority} · ${t.status}`,
      category: "ticket",
      read: 0,
      time: t.created_at,
    })),
  ].sort((a, b) => {
    if (!a.time || !b.time) return 0;
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  });

  const filtered =
    activeTab === "all"
      ? allItems
      : activeTab === "mentions"
        ? allItems.filter((i) => i.category === "mention")
        : activeTab === "assignments"
          ? allItems.filter((i) => i.category === "assignment")
          : activeTab === "tasks"
            ? allItems.filter((i) => i.type === "task")
            : allItems.filter((i) => i.type === "notification");

  const unreadCount = allItems.filter((i) => !i.read).length;

  return (
    <div>
      <PageHeader
        title="Inbox"
        description={`${unreadCount} unread items`}
      />

      <div className="flex gap-1 border-b border-line mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "relative -mb-px px-4 py-2.5 text-[13px] font-medium transition-colors",
              activeTab === t.id
                ? "border-b-2 border-accent text-ink"
                : "text-ink-faint hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card divide-y divide-line">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Icon name="inbox" size={40} className="text-ink-faint mx-auto mb-3" />
            <p className="text-sm text-ink-faint">Your inbox is clear</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-start gap-4 px-5 py-4 transition-colors hover:bg-subtle cursor-pointer",
                !item.read && "bg-accent-subtle/30"
              )}
            >
              <div className="mt-1">
                {!item.read && (
                  <span className="block h-2 w-2 rounded-full bg-accent" />
                )}
              </div>
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  item.type === "task"
                    ? "bg-amber-50 dark:bg-amber-500/10"
                    : item.type === "ticket"
                      ? "bg-red-50 dark:bg-red-500/10"
                      : "bg-blue-50 dark:bg-blue-500/10"
                )}
              >
                <Icon
                  name={
                    item.type === "task"
                      ? "check-circle"
                      : item.type === "ticket"
                        ? "support"
                        : "bell"
                  }
                  size={16}
                  className={
                    item.type === "task"
                      ? "text-amber-600 dark:text-amber-400"
                      : item.type === "ticket"
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400"
                  }
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", !item.read && "font-medium")}>
                  {item.title}
                </p>
                <p className="text-xs text-ink-faint mt-0.5 truncate">
                  {item.body}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] text-ink-faint whitespace-nowrap">
                  {item.time
                    ? new Date(item.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </p>
                <Badge
                  tone={
                    item.category === "security"
                      ? "red"
                      : item.category === "finance"
                        ? "green"
                        : "neutral"
                  }
                  className="mt-1"
                >
                  {item.category || item.type}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
