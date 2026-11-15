"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/primitive";
import { PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Kind = "writer" | "spreadsheet" | "presentation";

const templates: Record<Kind, { label: string; icon: any; hint: string }> = {
  writer: { label: "Writer", icon: "file", hint: "Rich text document" },
  spreadsheet: { label: "Spreadsheet", icon: "table", hint: "Cells + formulas" },
  presentation: { label: "Presentation", icon: "layers", hint: "Slides & deck" },
};

export function NewOfficeClient({
  initialKind,
  initialName,
}: {
  initialKind: Kind;
  initialName: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [kind, setKind] = React.useState<Kind>(initialKind);
  const [name, setName] = React.useState(initialName);
  const [saving, setSaving] = React.useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/office", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || "Untitled", kind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Created", variant: "success" });
      router.push(`/office/${kind}/${data.id}`);
    } catch {
      setSaving(false);
      toast({ title: "Failed to create", variant: "error" });
    }
  };

  return (
    <div className="mx-auto max-w-xl animate-fade-in">
      <PageHeader
        title="New document"
        description="Pick a type and give your file a name."
        back="/office"
      />
      <form onSubmit={create} className="card space-y-5 p-6">
        <div>
          <label className="label">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(templates) as Kind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-4 text-[12.5px] font-medium transition-colors",
                  kind === k ? "border-accent bg-accent-subtle text-accent-strong" : "border-line text-ink-soft hover:bg-subtle"
                )}
              >
                <Icon name={templates[k].icon} size={20} />
                {templates[k].label}
                <span className="text-[10px] font-normal text-ink-faint">{templates[k].hint}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder={`Untitled ${templates[kind].label.toLowerCase()}`}
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => router.push("/office")}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Icon name="refresh" size={14} className="animate-spin" /> : <Icon name="plus" size={14} />}
            Create
          </Button>
        </div>
      </form>
    </div>
  );
}