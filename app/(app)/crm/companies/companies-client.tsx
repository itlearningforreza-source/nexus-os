"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button, Badge, Input, Select, Spinner } from "@/components/ui/primitive";
import { PageHeader } from "@/components/ui/page";
import { DataTable, type Column } from "@/components/ui/datatable";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";

type Company = {
  id: string;
  name: string;
  industry: string;
  city: string;
  country: string;
  employees: number;
  annual_revenue: number;
  health: string;
  created_at: string;
};

const healthTone: Record<string, "green" | "yellow" | "red"> = { Healthy: "green", "At Risk": "yellow", Critical: "red" };

export function CompaniesClient({ initialCreateOpen = false }: { initialCreateOpen?: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const [rows, setRows] = React.useState<Company[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(initialCreateOpen);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", industry: "", city: "", website: "", employees: 10, annual_revenue: 100000, health: "Healthy" });

  const load = React.useCallback(() => {
    fetch("/api/crm/companies").then((r) => r.json()).then((d) => { setRows(d.rows || []); setLoading(false); });
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/crm/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { toast({ title: "Company created", variant: "success" }); setCreateOpen(false); load(); }
    else toast({ title: "Failed to create company", variant: "error" });
  };

  const bulkDelete = async (ids: string[]) => {
    const res = await fetch("/api/crm/companies", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
    if (res.ok) { toast({ title: `${ids.length} companies deleted`, variant: "success" }); load(); }
    else toast({ title: "Delete failed", variant: "error" });
  };

  const columns: Column<Company>[] = [
    {
      key: "name", label: "Company", sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-subtle text-[13px] font-semibold text-accent">
            {c.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <p className="font-medium text-ink">{c.name}</p>
            <p className="text-[12px] text-ink-faint">{c.city}, {c.country}</p>
          </div>
        </div>
      ),
    },
    { key: "industry", label: "Industry", render: (c) => <Badge>{c.industry}</Badge> },
    { key: "employees", label: "Employees", sortable: true, render: (c) => <span className="caption">{c.employees?.toLocaleString()}</span> },
    { key: "annual_revenue", label: "Revenue", sortable: true, render: (c) => <span className="font-medium text-ink">{formatCurrency(c.annual_revenue)}</span> },
    { key: "health", label: "Health", render: (c) => <Badge tone={healthTone[c.health] || "neutral"}>{c.health}</Badge> },
    {
      key: "actions", label: "",
      render: (c) => (
        <span className="flex justify-end"><Button variant="ghost" size="icon"><Icon name="more" size={16} /></Button></span>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Companies"
        description="100+ accounts across industries."
        actions={<Button onClick={() => setCreateOpen(true)}><Icon name="plus" size={15} /> New Company</Button>}
      />
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchPlaceholder="Search companies…"
        selectable
        exportFileName={"companies.csv"}
        onRowClick={(c) => router.push(`/crm/companies/${c.id}`)}
        bulkActions={[
          { label: "Delete", icon: "trash", variant: "danger", onClick: bulkDelete },
        ]}
        onSearch={(q) => fetch(`/api/crm/companies?q=${encodeURIComponent(q)}`).then((r) => r.json()).then((d) => setRows(d.rows || []))}
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New company"
        footer={<>
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={create} disabled={saving}>{saving ? <Spinner /> : "Create company"}</Button>
        </>}
      >
        <form onSubmit={create} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Company name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
          <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          <Input label="Employees" type="number" value={form.employees} onChange={(e) => setForm({ ...form, employees: Number(e.target.value) })} />
          <Input label="Annual revenue (USD)" type="number" value={form.annual_revenue} onChange={(e) => setForm({ ...form, annual_revenue: Number(e.target.value) })} />
          <Select label="Health" value={form.health} onChange={(e) => setForm({ ...form, health: e.target.value })}>
            <option>Healthy</option><option>At Risk</option><option>Critical</option>
          </Select>
        </form>
      </Modal>
    </div>
  );
}