"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "../ui/icon";
import { Avatar } from "../ui/avatar";
import { Dropdown, DropdownItem, MenuDivider } from "../ui/overlay";
import { createOptions } from "@/lib/nav";

export function Topbar({
  user,
  onOpenSearch,
  notifications = [],
}: {
  user: any;
  onOpenSearch: () => void;
  notifications: { id: string; title: string; body: string; category: string; read: number }[];
}) {
  const router = useRouter();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="flex h-14 items-center gap-3 border-b border-line bg-canvas/80 px-4 backdrop-blur-sm">
      <button
        onClick={onOpenSearch}
        className="flex w-full max-w-sm items-center gap-2.5 rounded-lg border border-line bg-subtle bg-canvas-raised px-3 py-2 text-[13px] text-ink-faint transition-colors hover:border-line-strong"
        aria-label="Search"
      >
        <Icon name="search" size={15} />
        <span>Search everything…</span>
        <kbd className="ml-auto flex items-center gap-0.5 rounded-md border border-line bg-subtle px-1.5 text-[10.5px] text-ink-faint">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <Dropdown
          width="w-56"
          trigger={
            <button className="flex h-8 items-center gap-1 rounded-lg border border-dashed border-line-strong px-2.5 text-[13px] font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent" aria-label="Create">
              <Icon name="plus" size={15} /> <span className="hidden sm:inline">Create</span>
            </button>
          }
        >
          {(close) => (
            <>
              {createOptions.map((o) => (
                <DropdownItem
                  key={o.label}
                  icon={o.icon as any}
                  onClick={() => { router.push(o.href); close(); }}
                >
                  {o.label}
                </DropdownItem>
              ))}
            </>
          )}
        </Dropdown>

        <Dropdown
          width="w-80"
          trigger={
            <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-subtle hover:text-ink" aria-label="Notifications">
              <Icon name="bell" size={17} />
              {unread > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent ring-2 ring-canvas" />
              )}
            </button>
          }
        >
          <div className="px-4 pb-1 pt-2">
            <p className="text-[13px] font-semibold">Notifications</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.slice(0, 8).map((n) => (
              <div key={n.id} className="flex gap-3 rounded-lg px-4 py-2.5 hover:bg-subtle">
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    n.read ? "bg-zinc-300 dark:bg-zinc-700" : "bg-accent"
                  }`}
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-ink">{n.title}</p>
                  <p className="truncate text-[12px] text-ink-soft">{n.body}</p>
                </div>
              </div>
            ))}
          </div>
          <MenuDivider />
          <DropdownItem icon="settings" onClick={() => router.push("/settings/notifications")}>
            Notification settings
          </DropdownItem>
        </Dropdown>

        <Dropdown
          width="w-60"
          trigger={
            <button className="rounded-full transition-opacity hover:opacity-80" aria-label="Menu">
              <Avatar name={user?.name || "A"} color={user?.avatar_color} size="sm" status="online" />
            </button>
          }
        >
          <div className="px-4 pb-2 pt-3">
            <p className="text-[13px] font-semibold">{user?.name}</p>
            <p className="truncate text-[12px] text-ink-faint">{user?.email}</p>
          </div>
          <MenuDivider />
          <DropdownItem icon="user" onClick={() => router.push("/settings/profile")}>Profile</DropdownItem>
          <DropdownItem icon="settings" onClick={() => router.push("/settings")}>Settings</DropdownItem>
          <DropdownItem icon="moon" onClick={() => router.push("/settings/appearance")}>Appearance</DropdownItem>
          <MenuDivider />
          <DropdownItem icon="logout" onClick={() => { router.push("/logout"); }} danger>
            Sign out
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}