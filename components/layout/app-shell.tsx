"use client";

import * as React from "react";
import { CommandPalette } from "./command-palette";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({
  user,
  children,
  notifications,
}: {
  user: any;
  children: React.ReactNode;
  notifications: any[];
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar user={user} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} unread={unreadCount} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} onOpenSearch={() => setPaletteOpen(true)} notifications={notifications} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] p-6 lg:p-8">{children}</div>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} user={user} />
    </div>
  );
}