"use client";

import * as React from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/primitive";
import { Modal } from "@/components/ui/overlay";
import { Input, Textarea } from "@/components/ui/primitive";
import { PageHeader } from "@/components/ui/page";
import { EmptyState } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";

export function KnowledgeClient({ pages }: { pages: any[] }) {
  const toast = useToast();
  const [selected, setSelected] = React.useState<any>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", content: "" });

  const handleCreate = async () => {
    if (!form.title) {
      toast({ title: "Title is required", variant: "error" });
      return;
    }
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to create");
      }
      toast({ title: "Page created", variant: "success" });
      setShowCreate(false);
      setForm({ title: "", content: "" });
      window.location.reload();
    } catch (err) {
      toast({ title: err instanceof Error && err.message ? err.message : "Failed to create", variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description="Company wiki and documentation"
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Icon name="plus" size={15} /> New Page
          </Button>
        }
      />

      {pages.length === 0 ? (
        <EmptyState
          icon="knowledge"
          title="No pages yet"
          description="Create your first knowledge base page"
          action={
            <Button onClick={() => setShowCreate(true)}>Create Page</Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Page list */}
          <div className="lg:col-span-1">
            <div className="card divide-y divide-line">
              {pages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                    selected?.id === p.id
                      ? "bg-accent-subtle"
                      : "hover:bg-subtle"
                  }`}
                >
                  <Icon name="file" size={16} className="mt-0.5 text-ink-faint shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-xs text-ink-faint mt-0.5 line-clamp-2">
                      {p.content?.slice(0, 100) || "Empty page"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Page content */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">{selected.title}</h2>
                <div className="prose prose-sm max-w-none text-ink-soft leading-relaxed whitespace-pre-wrap">
                  {selected.content || "No content"}
                </div>
                <div className="mt-6 pt-4 border-t border-line">
                  <p className="text-xs text-ink-faint">
                    Created{" "}
                    {selected.created_at
                      ? new Date(selected.created_at).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="card p-12 text-center">
                <Icon name="knowledge" size={40} className="text-ink-faint mx-auto mb-3" />
                <p className="text-sm text-ink-faint">
                  Select a page to view its content
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Knowledge Page"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Page</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Page title..."
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Textarea
            label="Content"
            placeholder="Write your content here... (supports plain text)"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={12}
          />
        </div>
      </Modal>
    </div>
  );
}
