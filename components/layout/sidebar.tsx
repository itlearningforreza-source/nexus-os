"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "../ui/icon";
import { mainNav } from "@/lib/nav";
import { Avatar } from "../ui/avatar";

export function Sidebar({
  user,
  collapsed,
  onToggle,
  unread = 3,
}: {
  user?: any;
  collapsed: boolean;
  onToggle: () => void;
  unread?: number;
}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-line bg-canvas transition-[width] duration-200 ease-out shrink-0",
        collapsed ? "w-[60px]" : "w-[232px]"
      )}
    >
      <div className={cn("flex h-14 items-center gap-2.5 px-4", collapsed && "justify-center px-0")}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-accent text-white shadow-sm">
          <Icon name="layers" size={17} />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-[13.5px] font-semibold tracking-tight">Nexus OS</p>
            <p className="truncate text-[10px] text-ink-faint">{user?.org_name || "Organization"}</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {mainNav.map((section) => (
          <div key={section.section || "main"} className="mt-2">
            {section.section && !collapsed && (
              <p className="px-2 pb-1.5 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                {section.section}
              </p>
            )}
            <div className="space-y-[1px]">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const hasChildren =
                  item.href === "/crm" || item.href === "/projects" || item.href === "/hr";
                const isOpen = expanded[item.href];
                return (
                  <div key={item.label}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex items-center rounded-lg px-2 py-[7px] text-[13px] font-medium transition-colors",
                        collapsed && "justify-center px-0",
                        active
                          ? "bg-accent-subtle text-ink"
                          : "text-ink-soft hover:bg-subtle hover:text-ink"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className={cn("flex items-center", collapsed ? "" : "w-6")}>
                        <Icon name={item.icon as any} size={17} className={active ? "text-accent" : "text-ink-faint"} />
                      </span>
                      {!collapsed && <span className="ml-2 truncate">{item.label}</span>}
                      {!collapsed && item.label === "Inbox" && (
                        <span className="ml-auto rounded-md bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                          {unread}
                        </span>
                      )}
                      {active && !item.label.includes("Inbox") && (
                        <span className="absolute left-0 top-1/2 h-4 -translate-y-1/2 rounded-r-full bg-accent w-[3px]" />
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className={cn("border-t border-line p-3", collapsed && "flex justify-center px-0")}>
        <div className="flex items-center gap-2.5 rounded-lg px-1 py-1">
          <Avatar name={user?.name || "A"} color={user?.avatar_color} size="sm" status="online" />
          {!collapsed && (
            <>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[13px] font-medium">{user?.name || "User"}</p>
                <p className="truncate text-[11px] capitalize text-ink-faint">{user?.role || "Member"}</p>
              </div>
              <button onClick={onToggle} className="ml-auto rounded p-1 text-ink-faint hover:bg-subtle" aria-label="Collapse sidebar">
                <Icon name="chevron-down" size={15} className="rotate-180" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}