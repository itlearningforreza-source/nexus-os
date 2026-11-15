"use client";

import * as React from "react";
import { Icon } from "@/components/ui/icon";
import { Button, Badge, Input, Select, Spinner } from "@/components/ui/primitive";
import { PageHeader } from "@/components/ui/page";
import { DataTable, type Column } from "@/components/ui/datatable";
import { Modal } from "@/components/ui/overlay";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatDate, timeAgo } from "@/lib/utils";

const prioTone: Record<string, "neutral" | "blue" | "yellow" | "red"> = {
  Low: "neutral", Medium: "blue", High: "yellow", Critical: "red",
};
const statusTone: Record<string, "blue" | "yellow" | "purple" | "green" | "neutral"> = {
  Open: "blue", "In Progress": "purple", Waiting: "yellow", Resolved: "green", Closed: "neutral",
};

type Ticket = {
  id: string; number: string; subject: string; priority: string; status: string;
  category: string; assignee_name?: string; avatar_color?: string; company_name?: string; created_at: string;
};

export function SupportClient({ tickets, counts, byStatus, initialCreateOpen = false }: any) {
  const toast = useToast();
  const [rows, setRows] = React.useState<Ticket[]>(tickets);
  const [createOpen, setCreateOpen] = React.useState(initialCreateOpen);
  const [saving, setSaving] = React.useState(false);
  const [selected, setSelected] = React.useState<Ticket | null>(null);
  const [form, setForm] = React.useState({ number: `TK-${5000 + Math.floor(Math.random() * 900)}`, subject: "", priority: "Medium", status: "Open", category: "General", description: "" });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/support/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      toast({ title: "Ticket created", variant: "success" });
      setCreateOpen(false);
      setRows((prev) => [{ id: data.id, number: form.number, subject: form.subject, priority: form.priority, status: form.status, category: form.category, created_at: new Date().toISOString() }, ...prev]);
    } else toast({ title: "Failed to create ticket", variant: "error" });
  };

  const update = async (id: string, patch: any) => {
    const res = await fetch(`/api/support/tickets?id=${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (res.ok) { setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))); toast({ title: "Ticket updated", variant: "success" }); }
  };

  const columns: Column<Ticket>[] = [
    {
      key: "subject", label: "Ticket", sortable: true,
      render: (t) => (
        <div>
          <p className="flex items-center gap-2 font-medium text-ink">
            <span className="meta">{t.number}</span> {t.subject}
          </p>
          <p className="text-[12px] text-ink-faint">{t.category}</p>
        </div>
      ),
    },
    { key: "company_name", label: "Customer", render: (t) => <span className="caption">{t.company_name || "—"}</span> },
    { key: "priority", label: "Priority", render: (t) => <Badge tone={prioTone[t.priority] || "neutral"}>{t.priority}</Badge> },
    { key: "status", label: "Status", render: (t) => <Badge tone={statusTone[t.status] || "neutral"}>{t.status}</Badge> },
    {
      key: "assignee_name", label: "Assignee", render: (t) => t.assignee_name ? (
        <div className="flex items-center gap-2"><Avatar name={t.assignee_name} color={t.avatar_color} size="xs" /><span className="caption">{t.assignee_name}</span></div>
      ) : <span className="meta">Unassigned</span>,
    },
    { key: "created_at", label: "Created", render: (t) => <span className="meta">{timeAgo(t.created_at)}</span> },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Support"
        description="Customer service inbox and ticket management."
        actions={<Button onClick={() => setCreateOpen(true)}><Icon name="plus" size={15} /> New Ticket</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open Tickets" value={String(counts.open || 0)} icon="ticket" accent="#3b82f6" />
        <StatCard label="Critical" value={String(counts.critical || 0)} icon="alert" accent="#ef4444" trend="down" />
        <StatCard label="Resolved" value={String(counts.resolved || 0)} icon="check-circle" accent="#10b981" />
        <StatCard label="SLA" value="95%" change="-2%" changeLabel="this week" icon="clock" accent="#8b5cf6" trend="neutral" />
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={rows}
          searchPlaceholder="Search tickets…"
          onSearch={(q) => setRows(rows.filter((t: any) => t.subject.toLowerCase().includes(q.toLowerCase()) || t.number.toLowerCase().includes(q.toLowerCase())))}
          onRowClick={(t) => setSelected(t)}
        />
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New ticket"
        footer={<>
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={create} disabled={saving}>{saving ? <Spinner /> : "Create ticket"}</Button>
        </>}>
        <form onSubmit={create} className="space-y-4">
          <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
            </Select>
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option>General</option><option>Billing</option><option>Technical</option><option>Account</option>
            </Select>
          </div>
        </form>
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.subject} size="lg"
        footer={<>
          {selected && selected.status !== "Resolved" &&
            <Button variant="secondary" onClick={() => { update(selected.id, { status: "Resolved" }); setSelected(null); }}>
              <Icon name="check-circle" size={15} /> Resolve
            </Button>}
          <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
        </>}>
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{selected.number}</Badge>
              <Badge tone={prioTone[selected.priority]}>{selected.priority} priority</Badge>
              <Badge tone={statusTone[selected.status]}>{selected.status}</Badge>
              <Badge>{selected.category}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="building" size={15} className="text-ink-faint" />
              <span className="caption">{selected.company_name || "No company"} · Customer support conversation</span>
            </div>
            <div className="rounded-xl border border-line bg-subtle/50 p-4">
              <p className="text-[13px] leading-relaxed text-ink-soft">
                Customer reported an issue on the platform. SLA applies: respond within 2 hours during business hours.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Avatar name={selected.assignee_name || "Support"} color={selected.avatar_color} size="sm" />
                <div className="rounded-xl rounded-tl-sm border border-line bg-canvas-raised px-3.5 py-2.5">
                  <p className="text-[13px] text-ink">I'll investigate this right away and update you shortly.</p>
                  <p className="mt-1 text-[11px] text-ink-faint">2h ago</p>
                </div>
              </div>
              <div className="flex items-start justify-end gap-3">
                <div className="rounded-xl rounded-tr-sm border border-line bg-accent-subtle px-3.5 py-2.5">
                  <p className="text-[13px] text-ink">Thanks! We found the root cause — a config mismatch.</p>
                  <p className="mt-1 text-[11px] text-ink-faint">1h ago</p>
                </div>
              </div>
            </div>
            <div className="card flex items-center gap-2 p-2">
              <input className="input border-0 flex-1" placeholder="Reply to customer…" />
              <Button><Icon name="send" size={14} /></Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}