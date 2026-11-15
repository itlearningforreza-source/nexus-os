"use client";

import * as React from "react";
import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  color = "#3b82f6",
  size = "md",
  className,
  status,
}: {
  name: string;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  status?: "online" | "offline" | "away";
}) {
  const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-7 w-7 text-[11px]",
    md: "h-9 w-9 text-xs",
    lg: "h-11 w-11 text-sm",
    xl: "h-16 w-16 text-lg",
  };
  return (
    <span className="relative inline-flex shrink-0">
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full font-semibold text-white select-none",
          sizes[size],
          className
        )}
        style={{ backgroundColor: color }}
      >
        {initials(name)}
      </span>
      {status && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-canvas-raised",
            status === "online" && "bg-emerald-500",
            status === "away" && "bg-amber-400",
            status === "offline" && "bg-zinc-400"
          )}
        />
      )}
    </span>
  );
}

export function AvatarGroup({
  people,
  max = 4,
}: {
  people: { name: string; color?: string }[];
  max?: number;
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((p, i) => (
        <Avatar key={i} name={p.name} color={p.color} size="sm" className="ring-2 ring-canvas-raised" />
      ))}
      {rest > 0 && (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-subtle text-[11px] font-medium text-ink-soft ring-2 ring-canvas-raised">
          +{rest}
        </span>
      )}
    </div>
  );
}
