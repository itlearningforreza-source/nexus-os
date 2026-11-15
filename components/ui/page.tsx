"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";
import { Button } from "./primitive";
import { Skeleton } from "./primitive";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  back?: string;
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link
          href={back}
          className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-faint hover:text-ink"
        >
          <Icon name="chevron-left" size={15} /> Back
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="h1">{title}</h1>
          {description && <p className="caption mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-line overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "relative -mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors",
            active === t.id
              ? "border-accent text-ink"
              : "border-transparent text-ink-faint hover:text-ink"
          )}
        >
          {t.label}
          {typeof t.count === "number" && (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[11px]",
                active === t.id ? "bg-accent-soft text-accent" : "bg-subtle text-ink-faint"
              )}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({
  icon = "folder",
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle">
        <Icon name={icon} size={24} className="text-ink-faint" />
      </div>
      <h3 className="h3">{title}</h3>
      {description && <p className="mt-1 max-w-sm caption">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-line px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10">
        <Icon name="alert" size={24} className="text-red-500" />
      </div>
      <h3 className="h3">{title}</h3>
      {description && <p className="mt-1 max-w-sm caption">{description}</p>}
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          <Icon name="refresh" size={15} /> Try Again
        </Button>
      )}
    </div>
  );
}

export function LoadingBlock({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

export function PageTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; icon?: IconName }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="card flex items-center gap-1 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-all",
            active === t.id ? "bg-subtle text-ink shadow-sm" : "text-ink-soft hover:text-ink"
          )}
        >
          {t.icon && <Icon name={t.icon} size={15} />}
          {t.label}
        </button>
      ))}
    </div>
  );
}
