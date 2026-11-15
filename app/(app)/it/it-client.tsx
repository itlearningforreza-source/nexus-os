"use client";

import * as React from "react";
import { Icon } from "@/components/ui/icon";
import { Button, Badge, Input, Select, Spinner } from "@/components/ui/primitive";
import { PageHeader } from "@/components/ui/page";
import { DataTable, type Column } from "@/components/ui/datatable";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatDate } from "@/lib/utils";

const statusTone: Record<string, "green" | "yellow" | "red" | "neutral"> = { Active: "green", "In Service": "green", Maintenance: "yellow", Retired: "neutral" };
const categoryIcon: Record<string, any> = { Laptop: "monitor", Desktop: "monitor", Phone: "phone", Tablet: "phone", Software: "code", Server: "server", Peripheral: "keyboard" };

type Asset = { id: string; name: string; asset_id?: string; assigned_to?: string; status: string; category?: string; purchase_date?: string; warranty_until?: string };

export function ItClient({ assets }: { assets: Asset[] }) {
  const toast = useToast();
  const [rows, setRows] = React.useState<Asset[]>(assets);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", asset_id: "", assigned_to: "", status: "Active", category: "Laptop", purchase_date: "", warranty_until: "" });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/it/assets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast({ title: "Asset added", variant: "success" });
        setCreateOpen(false);
        setRows((prev) => [{ id: data.id, ...form }, ...prev]);
      } else toast({ title: data?.error || "Failed to add asset", variant: "error" });
    } catch {
      toast({ title: "Failed to add asset", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const update = async (id: string, patch: any) => {
    try {
      const res = await fetch(`/api/it/assets?id=${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      if (res.ok) { setRows((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a))); toast({ title: "Asset updated", variant: "success" }); }
      else { const data = await res.json().catch(() => ({})); toast({ title: data?.error || "Failed to update asset", variant: "error" }); }
    } catch {
      toast({ title: "Failed to update asset", variant: "error" });
    }
  };

  const columns: Column<Asset>[] = [
    {
      key: "name", label: "Asset", render: (a) => (
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-subtle"><Icon name={categoryIcon[(a.category || "")] || "monitor"} size={16} className="text-ink-soft" /></span>
          <div>
            <p className="font-medium text-ink">{a.name}</p>
            {a.asset_id && <p className="text-[12px] text-ink-faint">{a.asset_id}</p>}
          </div>
        </div>
      ),
    },
    { key: "category", label: "Category", render: (a) => <Badge>{a.category}</Badge> },
    { key: "assigned_to", label: "Assigned to", render: (a) => <span className="caption">{a.assigned_to || "Unassigned"}</span> },
    { key: "status", label: "Status", render: (a) => <Badge tone={statusTone[a.status] || "neutral"}>{a.status}</Badge> },
    { key: "purchase_date", label: "Purchased", render: (a) => <span className="meta">{formatDate(a.purchase_date)}</span> },
    {
      key: "warranty_until", label: "Warranty",
      render: (a) => {
        const expiring = a.warranty_until && a.status !== "Retired" && (Date.parse(a.warranty_until) - Date.now()) < 1000 * 60 * 60 * 24 * 90;
        return <span className={expiring ? "meta font-medium text-amber-500" : "meta"}>{formatDate(a.warranty_until)}</span>;
      },
    },
    {
      key: "actions", label: "",
      render: (a) => a.status === "Active" ? (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); update(a.id, { status: "Maintenance" }); }}>Maintenance</Button>
      ) : a.status === "Maintenance" ? (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); update(a.id, { status: "Active" }); }}>Restore</Button>
      ) : null,
    },
  ];

  const counts = {
    total: rows.length,
    active: rows.filter((a) => a.status === "Active").length,
    maintenance: rows.filter((a) => a.status === "Maintenance").length,
    expiring: rows.filter((a) => a.warranty_until && a.status !== "Retired" && (Date.parse(a.warranty_until) - Date.now()) < 1000 * 60 * 60 * 24 * 90).length,
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="IT & Security" description="Hardware inventory, assets, and operational health."
        actions={<Button onClick={() => setCreateOpen(true)}><Icon name="plus" size={15} /> Add Asset</Button>} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Assets" value={String(counts.total)} icon="server" accent="#3b82f6" />
        <StatCard label="Active" value={String(counts.active)} icon="shield" accent="#10b981" />
        <StatCard label="In Maintenance" value={String(counts.maintenance)} icon="wrench" accent="#f59e0b" />
        <StatCard label="Warranty expiring soon" value={String(counts.expiring)} icon="alert" accent="#ef4444" trend="down" />
      </div>

      <div className="mt-6">
        <DataTable columns={columns} rows={rows} searchPlaceholder="Search assets…"
          onSearch={(q) => setRows(rows.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()) || (a.asset_id || "").toLowerCase().includes(q.toLowerCase()) || (a.assigned_to || "").toLowerCase().includes(q.toLowerCase())))} />
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add asset"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={create} disabled={saving}>{saving ? <Spinner /> : "Add asset"}</Button></>}>
        <form onSubmit={create} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Asset name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Asset ID" value={form.asset_id} onChange={(e) => setForm({ ...form, asset_id: e.target.value })} />
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option>Laptop</option><option>Desktop</option><option>Phone</option><option>Tablet</option><option>Server</option><option>Software</option><option>Peripheral</option>
          </Select>
          <Input label="Assigned to" value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} />
          <Input label="Purchase date" type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} />
          <Input label="Warranty until" type="date" value={form.warranty_until} onChange={(e) => setForm({ ...form, warranty_until: e.target.value })} />
        </form>
      </Modal>
    </div>
  );
}