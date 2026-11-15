"use client";

import * as React from "react";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/primitive";

const COLUMNS = ["Backlog", "Todo", "In Progress", "Review", "Done"];
const colColor: Record<string, string> = {
  Backlog: "bg-zinc-400",
  Todo: "bg-blue-500",
  "In Progress": "bg-amber-500",
  Review: "bg-purple-500",
  Done: "bg-emerald-500",
};
const prioTone: Record<string, string> = {
  Low: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800",
  Medium: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400",
  High: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400",
  Critical: "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400",
};

export function KanbanBoard({ tasks, users, onMove, onCreateTask }: {
  tasks: any[];
  users: { id: string; name: string; avatar_color: string }[];
  onMove: (id: string, status: string) => void;
  onCreateTask: (status: string) => void;
}) {
  const [dragging, setDragging] = React.useState<string | null>(null);
  const [overCol, setOverCol] = React.useState<string | null>(null);
  const userById = Object.fromEntries(users.map((u) => [u.id, u]));

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ scrollbarWidth: "thin" }}>
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col);
        return (
          <div
            key={col}
            data-col={col}
            onDragOver={(e) => { e.preventDefault(); setOverCol(col); }}
            onDragLeave={() => setOverCol(null)}
            onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/task"); if (id) onMove(id, col); setDragging(null); setOverCol(null); }}
            className={cn("flex min-w-[230px] flex-1 flex-col rounded-2xl border bg-canvas-subtle/60 transition-colors", overCol === col ? "border-accent bg-accent-subtle/50" : "border-line")}
          >
            <div className="flex items-center justify-between px-3.5 pb-2 pt-3.5">
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", colColor[col])} />
                <span className="text-[13px] font-semibold text-ink">{col}</span>
                <span className="meta">{colTasks.length}</span>
              </div>
              <button onClick={() => onCreateTask(col)} className="rounded p-1 text-ink-faint hover:bg-subtle hover:text-ink" aria-label={`Add to ${col}`}>
                <Icon name="plus" size={14} />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 px-2.5 pb-3">
              {colTasks.map((t) => {
                const assignee = t.assignee_id ? userById[t.assignee_id] : null;
                const overdue = t.due_date && t.due_date < new Date().toISOString().slice(0, 10) && t.status !== "Done";
                return (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData("text/task", t.id); setDragging(t.id); }}
                    onDragEnd={() => { setDragging(null); setOverCol(null); }}
                    className={cn("group cursor-grab rounded-xl border border-line bg-canvas-raised p-3 shadow-card transition-all hover:shadow-pop active:cursor-grabbing", dragging === t.id && "opacity-40 rotate-2")}
                  >
                    <p className="text-[13px] font-medium leading-snug text-ink">{t.title}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className={cn("rounded-md px-1.5 py-0.5 text-[10.5px] font-medium", prioTone[t.priority] || prioTone.Medium)}>
                        {t.priority}
                      </span>
                      {(t.tags || []).map((tag: string, i: number) => (
                        <span key={i} className="rounded-md bg-subtle px-1.5 py-0.5 text-[10.5px] text-ink-faint">{tag}</span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      {overdue ? (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-red-500">
                          <Icon name="alert" size={11} /> {formatDate(t.due_date)}
                        </span>
                      ) : t.due_date ? (
                        <span className="flex items-center gap-1 text-[11px] text-ink-faint">
                          <Icon name="calendar" size={11} /> {formatDate(t.due_date)}
                        </span>
                      ) : <span />}
                      {assignee ? (
                        <Avatar name={assignee.name} color={assignee.avatar_color} size="xs" />
                      ) : <span />}
                    </div>
                  </div>
                );
              })}
              {colTasks.length === 0 && (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-line-strong py-8 text-[12px] text-ink-faint">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}