"use client";

import * as React from "react";
import { cn, downloadCsv } from "@/lib/utils";
import { Icon, type IconName } from "../ui/icon";
import { Button, Badge, Checkbox } from "../ui/primitive";
import { EmptyState } from "../ui/page";
import { Skeleton } from "../ui/primitive";

export type Column<T> = {
  key: string;
  label: string;
  exportKey?: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
};

export type BulkAction = {
  label: string;
  icon?: IconName;
  onClick: (ids: string[]) => void;
  variant?: "secondary" | "danger";
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  searchable = true,
  searchPlaceholder = "Search…",
  onSearch,
  onRowClick,
  toolbar,
  emptyTitle = "No results found",
  emptyDescription,
  selectable = false,
  onSelectionChange,
  bulkActions,
  exportFileName,
  pageSize = 8,
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
  onRowClick?: (row: T) => void;
  toolbar?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  selectable?: boolean;
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: BulkAction[];
  exportFileName?: string;
  pageSize?: number;
}) {
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [selected, setSelected] = React.useState<string[]>([]);

  React.useEffect(() => setPage(0), [q, rows.length]);

  const exportRows = () => {
    const exportable = columns.filter((c) => c.exportKey || c.key !== "actions");
    const data = rows.map((r) => {
      const out: Record<string, unknown> = {};
      for (const c of exportable) {
        const k = c.exportKey || c.key;
        out[c.label] = (r as any)[k] ?? "";
      }
      return out;
    });
    downloadCsv(exportFileName || "export.csv", data);
  };

  const handleSearch = (v: string) => {
    setQ(v);
    onSearch && onSearch(v);
  };

  let displayRows = rows;
  if (sortKey) {
    const col = columns.find((c) => c.key === sortKey);
    if (col) {
      displayRows = [...rows].sort((a, b) => {
        const av = (a as any)[sortKey];
        const bv = (b as any)[sortKey];
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
  }

  const totalPages = Math.max(1, Math.ceil(displayRows.length / pageSize));
  const pageRows = displayRows.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSelect = (id: string) => {
    const next = selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];
    setSelected(next);
    onSelectionChange?.(next);
  };

  const toggleAll = () => {
    const allIds = pageRows.map((r) => r.id);
    const next = selected.length === allIds.length ? [] : allIds;
    setSelected(next);
    onSelectionChange?.(next);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {(searchable || toolbar || exportFileName) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {searchable && (
            <div className="relative w-full max-w-xs">
              <Icon name="search" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                className="input pl-9"
                placeholder={searchPlaceholder}
                value={q}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {exportFileName && (
              <Button variant="secondary" size="sm" onClick={exportRows}>
                <Icon name="download" size={14} /> Export
              </Button>
            )}
            {toolbar}
          </div>
        </div>
      )}

      {selectable && selected.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-accent/20 bg-accent-subtle px-3 py-2">
          <span className="caption font-medium text-accent">
            {selected.length} selected
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {(bulkActions || []).map((a, i) => (
              <Button
                key={i}
                size="sm"
                variant={a.variant || "secondary"}
                onClick={() => a.onClick(selected)}
              >
                {a.icon && <Icon name={a.icon} size={14} />} {a.label}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => { setSelected([]); onSelectionChange?.([]); }}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                {selectable && (
                  <th className="w-10">
                    <Checkbox
                      checked={selected.length === pageRows.length && pageRows.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn("cursor-pointer select-none", col.className)}
                    onClick={() => {
                      if (!col.sortable) return;
                      if (sortKey === col.key) {
                        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                      } else {
                        setSortKey(col.key);
                        setSortDir("desc");
                      }
                    }}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && sortKey === col.key && (
                        <Icon name="chevron-down" size={11} className={cn(sortDir === "asc" && "rotate-180")} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {selectable && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected.includes(row.id)} onCheckedChange={() => toggleSelect(row.id)} />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={col.className}>
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pageRows.length === 0 && (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )}

        <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
          <p className="meta">
            {displayRows.length} result{displayRows.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              Previous
            </Button>
            <span className="meta px-2">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}