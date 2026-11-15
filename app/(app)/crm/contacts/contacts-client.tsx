"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button, Badge, Input, Select, Spinner } from "@/components/ui/primitive";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { DataTable, type Column } from "@/components/ui/datatable";
import { Modal } from "@/components/ui/overlay";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  title: string;
  company_id: string;
  status: string;
  score: number;
  created_at: string;
};

const statusTone: Record<string, "green" | "blue" | "yellow" | "neutral"> = {
  Active: "green", Lead: "blue", Inactive: "neutral",
};

export function ContactsClient({ initialCreateOpen = false }: { initialCreateOpen?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [companies, setCompanies] = React.useState<any[]>([]);
  const [createOpen, setCreateOpen] = React.useState(initialCreateOpen);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ first_name: "", last_name: "", email: "", phone: "", title: "", company_id: "", status: "Active" });

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/crm/contacts");
      const data = await res.json();
      setRows(data.rows || []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); fetch("/api/crm/companies").then((r) => r.json()).then((d) => setCompanies(d.rows || [])); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/crm/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: "Contact created", variant: "success" });
        setCreateOpen(false);
        setForm({ first_name: "", last_name: "", email: "", phone: "", title: "", company_id: "", status: "Active" });
        load();
      } else {
        toast({ title: "Failed to create contact", variant: "error" });
      }
    } catch {
      toast({ title: "Failed to create contact", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Contact>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${c.first_name} ${c.last_name}`} size="sm" />
          <div>
            <p className="font-medium text-ink">{c.first_name} {c.last_name}</p>
            <p className="text-[12px] text-ink-faint">{c.email}</p>
          </div>
        </div>
      ),
    },
    { key: "title", label: "Title", render: (c) => <span className="caption">{c.title || "—"}</span> },
    {
      key: "company_id",
      label: "Company",
      render: (c) => {
        const co = companies.find((x) => x.id === c.company_id);
        return <span className="caption">{co?.name || "—"}</span>;
      },
    },
    { key: "status", label: "Status", render: (c) => <Badge tone={statusTone[c.status] || "neutral"}>{c.status}</Badge> },
    {
      key: "score",
      label: "Score",
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-subtle">
            <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: c.score > 75 ? "#10b981" : c.score > 40 ? "#3b82f6" : "#a1a1aa" }} />
          </div>
          <span className="meta">{c.score}</span>
        </div>
      ),
    },
    { key: "created_at", label: "Created", sortable: true, render: (c) => <span className="meta">{formatDate(c.created_at)}</span> },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Contacts"
        description="500+ contacts across your organization."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Icon name="plus" size={15} /> New Contact
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        searchPlaceholder="Search contacts…"
        onSearch={(q) => {
          try {
            setLoading(true);
            fetch(`/api/crm/contacts?q=${encodeURIComponent(q)}`).then((r) => r.json()).then((d) => setRows(d.rows || [])).catch(() => {}).finally(() => setLoading(false));
          } catch { setLoading(false); }
        }}
        onRowClick={(c) => router.push(`/crm/contacts/${c.id}`)}
        toolbar={
          <Button variant="ghost" size="icon">
            <Icon name="filter" size={15} />
          </Button>
        }
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New contact"
        description="Add a person to your CRM."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={saving}>
              {saving ? <Spinner /> : "Create contact"}
            </Button>
          </>
        }
      >
        <form onSubmit={create} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
          <Input label="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select label="Company" value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })}>
            <option value="">No company</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option>Lead</option><option>Active</option><option>Inactive</option>
          </Select>
        </form>
      </Modal>
    </div>
  );
}