"use client";

import * as React from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button, Input, Spinner } from "@/components/ui/primitive";
import { PageHeader } from "@/components/ui/page";
import { Modal, Dropdown, DropdownItem } from "@/components/ui/overlay";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const typeIcon: Record<string, IconName> = {
  document: "file", sheet: "grid", slide: "file", folder: "folder", image: "image", pdf: "file",
};

type Doc = {
  id: string; name: string; type: string; folder: string; owner_name?: string; starred?: number;
  size?: number; updated_at: string;
};

export function DocumentsClient({ documents, initialCreateOpen = false }: { documents: Doc[]; initialCreateOpen?: boolean }) {
  const toast = useToast();
  const [all, setAll] = React.useState<Doc[]>(documents);
  const [folder, setFolder] = React.useState<string>("All");
  const [q, setQ] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(initialCreateOpen);
  const [editing, setEditing] = React.useState<Doc | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", type: "document", folder: "My Drive" });

  const folders = ["My Drive", "Shared", "Team", "Finance", "Legal", "Resources", "Templates"];
  const visible = all.filter((d) => (folder === "All" || d.folder === folder) && d.name.toLowerCase().includes(q.toLowerCase()));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const method = editing ? "PATCH" : "POST";
    const url = editing ? `/api/documents?id=${editing.id}` : "/api/documents";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      toast({ title: editing ? "Document updated" : "Document created", variant: "success" });
      setCreateOpen(false);
      setEditing(null);
      if (editing) setAll((prev) => prev.map((d) => (d.id === editing.id ? { ...d, ...form } : d)));
      else setAll((prev) => [{ id: data.id, ...form, starred: 0, updated_at: new Date().toISOString() }, ...prev]);
    } else toast({ title: "Failed to save document", variant: "error" });
  };

  const toggleStar = async (d: Doc) => {
    const starred = d.starred ? 0 : 1;
    try {
      const res = await fetch(`/api/documents?id=${d.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ starred }) });
      if (!res.ok) throw new Error();
      setAll((prev) => prev.map((x) => (x.id === d.id ? { ...x, starred } : x)));
    } catch {
      toast({ title: "Failed to update document", variant: "error" });
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Documents"
        description={`${all.length} files across ${folders.length} folders`}
        actions={
          <>
            <div className="flex items-center gap-2">
              <Input placeholder="Search files…" value={q} onChange={(e) => setQ(e.target.value)} className="w-56" />
            </div>
            <Button onClick={() => { setEditing(null); setForm({ name: "", type: "document", folder: "My Drive" }); setCreateOpen(true); }}>
              <Icon name="plus" size={15} /> New
            </Button>
          </>
        }
      />

      <div className="scrollbar-thin mb-6 flex gap-2 overflow-x-auto pb-1">
        {["All", ...folders].map((f) => (
          <button
            key={f}
            onClick={() => setFolder(f)}
            className={cn("whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors", folder === f ? "border-ink bg-ink text-canvas" : "border-line text-ink-soft hover:bg-subtle")}
          >
            {f === "All" ? <span className="flex items-center gap-1.5"><Icon name="grid" size={13} /> All files</span> : f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {visible.map((d) => (
          <button key={d.id} onClick={() => { setEditing(d); setForm({ name: d.name, type: d.type, folder: d.folder }); setCreateOpen(true); }}
            className="group card relative p-4 text-left transition-all hover:shadow-pop">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-subtle">
              <Icon name={typeIcon[d.type] || "file"} size={20} className="text-ink-soft" />
            </div>
            <p className="mt-3 line-clamp-1 text-[13px] font-medium text-ink group-hover:underline">{d.name}</p>
            <p className="meta mt-0.5">{d.folder} · {formatDate(d.updated_at)}</p>
            <div className="absolute right-2 top-2 flex items-center gap-1">
              <span onClick={(e) => { e.stopPropagation(); toggleStar(d); }} className={cn("rounded p-1 text-ink-faint transition-colors hover:bg-subtle", d.starred && "text-amber-500")}>
                <Icon name="star" size={14} className={d.starred ? "fill-amber-400" : ""} />
              </span>
            </div>
          </button>
        ))}
      </div>
      {visible.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Icon name="file" size={28} className="text-ink-faint" />
          <p className="mt-3 font-medium text-ink">No files here</p>
          <p className="caption mt-1">Create a document to get started.</p>
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={editing ? "Edit document" : "New document"}
        footer={<>
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? <Spinner /> : editing ? "Save changes" : "Create"}</Button>
        </>}>
        <form onSubmit={save} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {["document", "sheet", "slide", "folder"].map((t) => (
                  <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                    className={cn("flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12.5px] capitalize", form.type === t ? "border-accent bg-accent-subtle text-accent-strong" : "border-line text-ink-soft")}>
                    <Icon name={(typeIcon[t] || "file") as IconName} size={14} /> {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Folder</label>
              <select className="select mt-1" value={form.folder} onChange={(e) => setForm({ ...form, folder: e.target.value })}>
                {folders.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}