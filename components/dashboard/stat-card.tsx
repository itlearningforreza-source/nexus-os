"use client";

import { cn } from "@/lib/utils";
import { Icon, type IconName } from "../ui/icon";
import { Sparkline } from "../charts";

export function StatCard({
  label,
  value,
  change,
  changeLabel = "vs last period",
  icon,
  spark,
  trend = "up",
  accent = "#3b82f6",
}: {
  label: string;
  value: string;
  change?: string;
  changeLabel?: string;
  icon: IconName;
  spark?: number[];
  trend?: "up" | "down" | "neutral";
  accent?: string;
}) {
  return (
    <div className="card p-5 transition-shadow hover:shadow-pop">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-ink-soft">{label}</p>
          <p className="mt-2 text-[26px] font-semibold tracking-tight text-ink">{value}</p>
        </div>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}
        >
          <Icon name={icon} size={17} />
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        {change && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
              trend === "up" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
              trend === "down" && "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
              trend === "neutral" && "bg-subtle text-ink-soft"
            )}
          >
            <Icon name={trend === "up" ? "trending" : trend === "down" ? "alert" : "minus"} size={11} />
            {change}
          </span>
        )}
        <span className="text-[11px] text-ink-faint">{changeLabel}</span>
      </div>
      {spark && (
        <div className="mt-3 -mb-1">
          <Sparkline data={spark} color={accent} />
        </div>
      )}
    </div>
  );
}