"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button, Input } from "@/components/ui/primitive";
import { PageHeader } from "@/components/ui/page";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { cn, formatDate } from "@/lib/utils";

type OfficeDoc = {
  id: string;
  name: string;
  kind: "writer" | "spreadsheet" | "presentation";
  folder: string;
  starred?: number;
  version?: number;
  updated_at: string;
  owner_name?: string;
};

const kindMeta: Record<string, { label: string; icon: any; color: string }> = {
  writer: { label: "Writer", icon: "file", color: "#3b82f6" },
  spreadsheet: { label: "Spreadsheet", icon: "table", color: "#10b981" },
  presentation: { label: "Presentation", icon: "layers", color: "#f59e0b" },
};

const editorPath = (d: OfficeDoc) => `/office/${d.kind}/${d.id}`;

export function OfficeClient({
  docs,
  initialKind = null,
}: {
  docs: OfficeDoc[];
  initialKind: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [kind, setKind] = React.useState<string | null>(initialKind);
  const [q, setQ] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [creating, setCreating] = React.useState<"writer" | "spreadsheet" | "presentation" | null>(null);
  const [name, setName] = React.useState("");

  const visible = docs.filter(
    (d) => (kind ? d.kind === kind : true) && d.name.toLowerCase().includes(q.toLowerCase())
  );

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creating) return;
    setCreating(null);
    const res = await fetch("/api/office", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || "Untitled", kind: creating }),
    });
    const data = await res.json();
    if (res.ok) {
      toast({ title: `${kindMeta[creating].label} created`, variant: "success" });
      setCreateOpen(false);
      setName("");
      router.push(`/office/${creating}/${data.id}`);
    } else {
      toast({ title: "Failed to create document", variant: "error" });
      setCreating(null);
    }
  };

  const tabs: { id: string | null; label: string; icon?: any }[] = [
    { id: null, label: "All files", icon: "grid" },
    { id: "writer", label: "Writer", icon: "file" },
    { id: "spreadsheet", label: "Spreadsheet", icon: "table" },
    { id: "presentation", label: "Presentation", icon: "layers" },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Office Suite"
        description={`${docs.length} documents across Writer, Spreadsheet & Presentation`}
        actions={
          <>
            <Input
              placeholder="Search documents…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-56"
            />
            <Button
              onClick={() => {
                setCreateOpen(true);
                setCreating("writer");
                setName("");
              }}
            >
              <Icon name="plus" size={15} /> New
            </Button>
          </>
        }
      />

      <div className="scrollbar-thin mb-6 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.label}
            onClick={() => setKind(t.id)}
            className={cn(
              "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              kind === t.id
                ? "border-ink bg-ink text-canvas"
                : "border-line text-ink-soft hover:bg-subtle"
            )}
          >
            {t.icon && <Icon name={t.icon} size={13} className="mr-1.5 inline" />}
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {visible.map((d) => {
          const meta = kindMeta[d.kind];
          return (
            <Link
              key={d.id}
              href={editorPath(d)}
              className="group card relative p-4 text-left transition-all hover:shadow-pop"
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: meta.color + "1a", color: meta.color }}
              >
                <Icon name={meta.icon} size={20} />
              </div>
              <p className="mt-3 line-clamp-1 text-[13px] font-medium text-ink group-hover:underline">
                {d.name}
              </p>
              <p className="meta mt-0.5">
                {meta.label} · {formatDate(d.updated_at)}
              </p>
              {d.starred ? (
                <span className="absolute right-2 top-2 text-amber-400">
                  <Icon name="star" size={14} className="fill-amber-400" />
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
      {visible.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Icon name="documents" size={28} className="text-ink-faint" />
          <p className="mt-3 font-medium text-ink">No documents here</p>
          <p className="caption mt-1">Create a Writer, Spreadsheet, or Presentation to get started.</p>
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New document"
        description="Start a document in Writer, Spreadsheet, or Presentation."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={create} disabled={!creating}>
              {creating ? "Create" : "Select a type"}
            </Button>
          </>
        }
      >
        <form onSubmit={create} className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Untitled" />
          <div>
            <label className="label">Type</label>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {(["writer", "spreadsheet", "presentation"] as const).map((k) => {
                const meta = kindMeta[k];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setCreating(k)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-[12.5px] font-medium transition-colors",
                      creating === k
                        ? "border-accent bg-accent-subtle text-accent-strong"
                        : "border-line text-ink-soft hover:bg-subtle"
                    )}
                  >
                    <Icon name={meta.icon} size={18} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}