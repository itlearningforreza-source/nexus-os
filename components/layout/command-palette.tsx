"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "../ui/icon";
import { Avatar } from "../ui/avatar";

type PaletteResult = {
  label: string;
  href?: string;
  icon?: IconName;
  group?: string;
  action?: () => void;
  hint?: string;
};

export function CommandPalette({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: { name: string; email: string; avatar_color?: string };
}) {
  const [query, setQuery] = React.useState("");
  const [idx, setIdx] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const commands: PaletteResult[] = [
    { group: "Navigate", label: "Home", href: "/dashboard", icon: "home" },
    { group: "Navigate", label: "CRM", href: "/crm", icon: "crm" },
    { group: "Navigate", label: "Sales Pipeline", href: "/sales", icon: "sales" },
    { group: "Navigate", label: "Projects", href: "/projects", icon: "projects" },
    { group: "Navigate", label: "Tasks", href: "/projects?view=tasks", icon: "check-circle" },
    { group: "Navigate", label: "Calendar", href: "/calendar", icon: "calendar" },
    { group: "Navigate", label: "Documents", href: "/documents", icon: "documents" },
    { group: "Navigate", label: "Office Suite", href: "/office", icon: "documents" },
    { group: "Navigate", label: "Writer", href: "/office?kind=writer", icon: "file" },
    { group: "Navigate", label: "Spreadsheet", href: "/office?kind=spreadsheet", icon: "table" },
    { group: "Navigate", label: "Presentation", href: "/office?kind=presentation", icon: "layers" },
    { group: "Navigate", label: "Chat", href: "/chat", icon: "chat" },
    { group: "Navigate", label: "Finance", href: "/finance", icon: "finance" },
    { group: "Navigate", label: "HR / People", href: "/hr", icon: "hr" },
    { group: "Navigate", label: "Support / Tickets", href: "/support", icon: "support" },
    { group: "Navigate", label: "Legal / Contracts", href: "/legal", icon: "legal" },
    { group: "Navigate", label: "Marketing", href: "/marketing", icon: "marketing" },
    { group: "Navigate", label: "IT / Assets", href: "/it", icon: "it" },
    { group: "Navigate", label: "Analytics", href: "/analytics", icon: "analytics" },
    { group: "Navigate", label: "Automation", href: "/automation", icon: "automation" },
    { group: "Navigate", label: "AI Assistant", href: "/ai", icon: "ai" },
    { group: "Navigate", label: "Settings", href: "/settings", icon: "settings" },
    { group: "Create", label: "New Person", href: "/crm/contacts?create=true", icon: "user" },
    { group: "Create", label: "New Company", href: "/crm/companies?create=true", icon: "building" },
    { group: "Create", label: "New Deal", href: "/sales?create=true", icon: "sales" },
    { group: "Create", label: "New Task", href: "/projects?create=task", icon: "check-circle" },
    { group: "Create", label: "New Project", href: "/projects?create=project", icon: "projects" },
    { group: "Create", label: "New Invoice", href: "/finance?create=true", icon: "receipt" },
    { group: "Create", label: "New Document", href: "/documents?create=true", icon: "file" },
    { group: "Create", label: "New Writer Doc", href: "/office/new?kind=writer", icon: "file" },
    { group: "Create", label: "New Spreadsheet", href: "/office/new?kind=spreadsheet", icon: "table" },
    { group: "Create", label: "New Presentation", href: "/office/new?kind=presentation", icon: "layers" },
    { group: "Create", label: "New Contract", href: "/legal?create=true", icon: "legal" },
    { group: "Create", label: "New Ticket", href: "/support?create=true", icon: "ticket" },
    { group: "Create", label: "New Event", href: "/calendar?create=true", icon: "calendar" },
    { group: "Create", label: "New Employee", href: "/hr?create=true", icon: "hr" },
    { group: "Create", label: "New Campaign", href: "/marketing?create=true", icon: "marketing" },
    { group: "AI", label: "Ask AI", href: "/ai", icon: "sparkles", hint: "Analyze revenue, summarize meetings, find overdue tasks..." },
    { group: "AI", label: "Analyze sales pipeline", href: "/ai?q=Analyze+sales+pipeline", icon: "sparkles" },
    { group: "AI", label: "Find overdue projects", href: "/ai?q=Find+overdue+projects", icon: "sparkles" },
    { group: "AI", label: "Find contracts expiring soon", href: "/ai?q=Find+contracts+expiring+soon", icon: "sparkles" },
  ];

  const filtered = query.trim()
    ? commands.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.hint?.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const grouped = filtered.reduce<Record<string, PaletteResult[]>>((acc, c) => {
    const g = c.group || "Actions";
    (acc[g] = acc[g] || []).push(c);
    return acc;
  }, {});

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setIdx((i) => Math.min(i + 1, filtered.length - 1));
      if (e.key === "ArrowUp") setIdx((i) => Math.max(i - 1, 0));
      if (e.key === "Enter" && filtered[idx]) {
        const target = filtered[idx];
        if (target.href) router.push(target.href);
        if (target.action) target.action();
        onClose();
      }
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, filtered, idx, onClose, router]);

  if (!open) return null;
  const flatIdx = () => {
    let count = 0;
    for (const [g, items] of Object.entries(grouped)) {
      for (const it of items) {
        if (count === idx) return it;
        count++;
      }
    }
    return filtered[0];
  };

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <div className="absolute left-1/2 top-[15%] w-full max-w-lg -translate-x-1/2 animate-scale-in">
        <div className="overflow-hidden rounded-2xl border border-line bg-canvas-raised shadow-overlay">
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Icon name="search" size={18} className="text-ink-faint" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setIdx(0); }}
              placeholder="Search or type a command…"
              className="w-full bg-transparent py-3.5 text-[15px] outline-none placeholder:text-ink-faint"
            />
            <kbd className="rounded-md border border-line bg-subtle px-1.5 py-0.5 text-[11px] text-ink-faint">ESC</kbd>
          </div>
          <div className="max-h-80 overflow-y-auto py-2">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                  {group}
                </p>
                {items.map((item) => (
                  <Link
                    key={group + item.label}
                    href={item.href || "#"}
                    onClick={onClose}
                    onMouseEnter={() =>
                      setIdx(filtered.indexOf(item) >= 0 ? filtered.indexOf(item) : 0)
                    }
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 text-sm",
                      flatIdx()?.label === item.label
                        ? "bg-accent-subtle text-ink"
                        : "text-ink-soft hover:bg-subtle"
                    )}
                  >
                    <span className="flex h-6 w-6 items-center justify-center">
                      <Icon name={item.icon || "command"} size={15} className="text-ink-faint" />
                    </span>
                    {item.label}
                    {item.hint && (
                      <span className="ml-auto truncate text-[11px] text-ink-faint">{item.hint}</span>
                    )}
                  </Link>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-ink-faint">
                No results for "{query}"
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 border-t border-line bg-subtle px-4 py-2 text-[11px] text-ink-faint">
            <span className="flex items-center gap-1"><kbd className="rounded border border-line bg-canvas-raised px-1">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="rounded border border-line bg-canvas-raised px-1">↵</kbd> Select</span>
            {user && (
              <span className="ml-auto flex items-center gap-1.5">
                <Avatar name={user.name} color={user.avatar_color} size="xs" /> {user.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}