"use client";

import * as React from "react";
import { Icon } from "@/components/ui/icon";
import { Button, Badge, Input, Select, Spinner } from "@/components/ui/primitive";
import { PageHeader } from "@/components/ui/page";
import { DataTable, type Column } from "@/components/ui/datatable";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusTone: Record<string, "blue" | "green" | "yellow" | "red" | "neutral"> = {
  Draft: "neutral", "Under Review": "blue", Active: "green", Renewal: "yellow", Expired: "red", Ended: "neutral",
};

type Contract = {
  id: string; title: string; status: string; value: number; currency: string;
  counterparty?: string; start_date?: string; expiry_date?: string;
};

export function LegalClient({ contracts, expiringCount, initialCreateOpen = false }: { contracts: Contract[]; expiringCount: number; initialCreateOpen?: boolean }) {
  const toast = useToast();
  const [rows, setRows] = React.useState<Contract[]>(contracts);
  const [createOpen, setCreateOpen] = React.useState(initialCreateOpen);
  const [editing, setEditing] = React.useState<Contract | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", status: "Draft", value: 0, currency: "USD", counterparty: "", start_date: "", expiry_date: "" });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(editing ? `/api/legal/contracts?id=${editing.id}` : "/api/legal/contracts", {
      method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      toast({ title: editing ? "Contract updated" : "Contract created", variant: "success" });
      setCreateOpen(false); setEditing(null);
      if (editing) setRows((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...form } : c)));
      else setRows((prev) => [{ id: data.id, ...form, value: Number(form.value) }, ...prev]);
    } else toast({ title: "Failed to save contract", variant: "error" });
  };

  const openEdit = (c: Contract) => {
    setEditing(c);
    setForm({ title: c.title, status: c.status, value: c.value, currency: c.currency, counterparty: c.counterparty || "", start_date: c.start_date || "", expiry_date: c.expiry_date || "" });
    setCreateOpen(true);
  };

  const totalValue = rows.filter((c) => c.status === "Active").reduce((s, c) => s + c.value, 0);
  const active = rows.filter((c) => c.status === "Active").length;

  const columns: Column<Contract>[] = [
    { key: "title", label: "Contract", sortable: true, render: (c) => <span className="font-medium text-ink">{c.title}</span> },
    { key: "counterparty", label: "Counterparty", render: (c) => <span className="caption">{c.counterparty || "—"}</span> },
    { key: "status", label: "Status", render: (c) => <Badge tone={statusTone[c.status] || "neutral"}>{c.status}</Badge> },
    { key: "value", label: "Value", sortable: true, render: (c) => <span className="font-medium text-ink">{formatCurrency(c.value, c.currency)}</span> },
    { key: "start_date", label: "Start", render: (c) => <span className="meta">{formatDate(c.start_date)}</span> },
    {
      key: "expiry_date", label: "Expires", render: (c) => {
        const soon = c.expiry_date && c.status === "Active" && (Date.parse(c.expiry_date) - Date.now()) < 1000 * 60 * 60 * 24 * 30;
        return <span className={soon ? "meta font-medium text-red-500" : "meta"}>{formatDate(c.expiry_date)}</span>;
      },
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Legal"
        description="Contracts, obligations, and renewal tracking."
        actions={<Button onClick={() => { setEditing(null); setForm({ title: "", status: "Draft", value: 0, currency: "USD", counterparty: "", start_date: "", expiry_date: "" }); setCreateOpen(true); }}><Icon name="plus" size={15} /> New Contract</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active Contracts" value={String(active)} icon="file-signature" accent="#3b82f6" />
        <StatCard label="Contract Value" value={formatCurrency(totalValue)} icon="scale" accent="#10b981" />
        <StatCard label="Expiring in 30 days" value={String(expiringCount)} icon="alert" accent="#ef4444" trend="down" />
        <StatCard label="Drafts in Review" value={String(rows.filter((c) => c.status === "Draft").length)} icon="scale" accent="#8b5cf6" />
      </div>

      <div className="mt-6">
        <DataTable columns={columns} rows={rows} searchPlaceholder="Search contracts…" onRowClick={openEdit}
          onSearch={(q) => setRows(rows.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()) || (c.counterparty || "").toLowerCase().includes(q.toLowerCase())))} />
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={editing ? "Edit contract" : "New contract"}
        footer={<>
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? <Spinner /> : editing ? "Save changes" : "Create contract"}</Button>
        </>}>
        <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Input label="Contract title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <Input label="Counterparty" value={form.counterparty} onChange={(e) => setForm({ ...form, counterparty: e.target.value })} />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option>Draft</option><option>Under Review</option><option>Active</option><option>Renewal</option><option>Ended</option>
          </Select>
          <Input label="Value" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
          <Select label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
            <option>USD</option><option>IDR</option><option>EUR</option><option>SGD</option><option>GBP</option>
          </Select>
          <Input label="Start date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          <Input label="Expiry date" type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
        </form>
      </Modal>
    </div>
  );
}