"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icon";

const settingsNav: { label: string; href: string; icon: IconName }[] = [
  { label: "General", href: "/settings", icon: "settings" },
  { label: "Profile", href: "/settings/profile", icon: "user" },
  { label: "Team", href: "/settings/team", icon: "hr" },
  { label: "Security", href: "/settings/security", icon: "admin" },
  { label: "Notifications", href: "/settings/notifications", icon: "bell" },
  { label: "Appearance", href: "/settings/appearance", icon: "moon" },
  { label: "Billing", href: "/settings/billing", icon: "receipt" },
  { label: "API & Webhooks", href: "/settings/api", icon: "automation" },
  { label: "Audit Log", href: "/settings/audit", icon: "analytics" },
];

export function SettingsNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/settings") return pathname === "/settings";
    return pathname.startsWith(href);
  };

  return (
    <nav className="w-56 shrink-0">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
        Settings
      </p>
      <div className="space-y-[1px]">
        {settingsNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
              isActive(item.href)
                ? "bg-accent-subtle text-ink"
                : "text-ink-soft hover:bg-subtle hover:text-ink"
            )}
          >
            <Icon
              name={item.icon}
              size={16}
              className={isActive(item.href) ? "text-accent" : "text-ink-faint"}
            />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
