"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Icon } from "@/components/ui/icon";
import { Button, Badge, Input, Select, Spinner, Skeleton } from "@/components/ui/primitive";
import { PageHeader } from "@/components/ui/page";
import { DataTable, type Column } from "@/components/ui/datatable";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const DonutChart = dynamic(() => import("@/components/charts").then((m) => m.DonutChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[200px] w-full" />,
});

const invoiceTone: Record<string, "green" | "yellow" | "red" | "neutral" | "blue"> = {
  Paid: "green", "Partially Paid": "blue", Overdue: "red", Draft: "neutral",
};

type Invoice = {
  id: string; number: string; company_name?: string; status: string;
  issue_date?: string; due_date?: string; amount: number; paid_amount: number; currency: string;
};

export function FinanceClient({ stats, invoices, invoiceStatuses, monthRevs, initialCreateOpen = false }: any) {
  const toast = useToast();
  const [rows, setRows] = React.useState<Invoice[]>(invoices);
  const [companies, setCompanies] = React.useState<any[]>([]);
  const [createOpen, setCreateOpen] = React.useState(initialCreateOpen);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ number: `INV-${2000 + Math.floor(Math.random() * 900)}`, company_id: "", amount: 5000, currency: "USD", due_date: "", status: "Draft" });

  React.useEffect(() => { fetch("/api/crm/companies").then((r) => r.json()).then((d) => setCompanies(d.rows || [])); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/finance/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, issue_date: new Date().toISOString().slice(0, 10), paid_amount: 0 }) });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      toast({ title: "Invoice created", variant: "success" });
      setCreateOpen(false);
      const co = companies.find((c) => c.id === form.company_id);
      setRows((prev) => [{ id: data.id, number: form.number, company_name: co?.name, status: form.status, amount: Number(form.amount), paid_amount: 0, currency: form.currency }, ...prev]);
    } else toast({ title: "Failed to create invoice", variant: "error" });
  };

  const markPaid = async (inv: Invoice) => {
    const res = await fetch(`/api/finance/invoices?id=${inv.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "Paid", paid_amount: inv.amount }) });
    if (res.ok) {
      setRows((prev) => prev.map((r) => (r.id === inv.id ? { ...r, status: "Paid", paid_amount: r.amount } : r)));
      toast({ title: `${inv.number} marked as paid`, variant: "success" });
    }
  };

  const columns: Column<Invoice>[] = [
    { key: "number", label: "Invoice", sortable: true, render: (i) => <span className="font-medium text-ink">{i.number}</span> },
    { key: "company_name", label: "Customer", render: (i) => <span className="caption">{i.company_name || "—"}</span> },
    { key: "status", label: "Status", render: (i) => <Badge tone={invoiceTone[i.status] || "neutral"}>{i.status}</Badge> },
    { key: "amount", label: "Amount", sortable: true, render: (i) => <span className="font-medium text-ink">{formatCurrency(i.amount, i.currency)}</span> },
    { key: "due_date", label: "Due", sortable: true, render: (i) => <span className="meta">{formatDate(i.due_date)}</span> },
    {
      key: "actions", label: "",
      render: (i) =>
        i.status !== "Paid" ? (
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); markPaid(i); }}>
            <Icon name="check-circle" size={14} className="text-emerald-500" /> Mark paid
          </Button>
        ) : <span className="meta">Received</span>,
    },
  ];

  const donutData = (invoiceStatuses || []).filter((s: any) => s.c > 0).map((s: any) => ({
    name: s.status, value: s.c,
    color: s.status === "Paid" ? "#10b981" : s.status === "Overdue" ? "#ef4444" : s.status === "Draft" ? "#a1a1aa" : "#3b82f6",
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Finance"
        description="Invoices, revenue, and accounts receivable."
        actions={
          <>
            <Button variant="secondary"><Icon name="download" size={15} /> Export</Button>
            <Button onClick={() => setCreateOpen(true)}><Icon name="plus" size={15} /> New Invoice</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={formatCurrency(stats.revenue)} change="+18.4%" icon="finance" accent="#10b981" spark={[40, 44, 42, 48, 52, 50, 55]} />
        <StatCard label="Expenses" value={formatCurrency(stats.expenses)} change="-3.2%" icon="receipt" accent="#f59e0b" spark={[30, 32, 31, 29, 28, 27, 25]} />
        <StatCard label="Net Profit" value={formatCurrency(stats.profit)} change="+22.6%" icon="trending" accent="#3b82f6" spark={[20, 24, 23, 27, 30, 33, 36]} />
        <StatCard label="Receivable" value={formatCurrency(stats.receivable)} change={`${stats.overdue} overdue`} changeLabel="needs collection" icon="alert" accent="#ef4444" trend="down" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h3 className="h3 mb-4">Invoice status</h3>
          <DonutChart data={donutData.length ? donutData : [{ name: "No data", value: 1, color: "#a1a1aa" }]} centerValue={String(invoices.length)} centerLabel="invoices" />
        </div>
        <div className="card p-5">
          <h3 className="h3 mb-4">Paid revenue by month</h3>
          <div className="space-y-3 pt-1">
            {monthRevs.slice(0, 6).map((m: any, i: number) => {
              const max = Math.max(...monthRevs.map((x: any) => x.v)) || 1;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-8 text-[12px] text-ink-faint">M{m.m}</span>
                  <div className="h-7 flex-1 overflow-hidden rounded-lg bg-subtle">
                    <div className="h-full rounded-lg bg-accent/80" style={{ width: `${(m.v / max) * 100}%` }} />
                  </div>
                  <span className="w-20 text-right text-[12px] font-medium text-ink">{formatCurrency(m.v)}</span>
                </div>
              );
            })}
            {monthRevs.length === 0 && <p className="caption">No paid invoices yet.</p>}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="h3 mb-4">Accounts receivable</h3>
          <p className="text-[40px] font-semibold tracking-tight text-ink">{formatCurrency(stats.receivable)}</p>
          <p className="mt-1 caption">Outstanding across open invoices</p>
          <div className="mt-5 space-y-3">
            {rows.filter((r: any) => r.status === "Overdue").slice(0, 4).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-subtle p-3">
                <div>
                  <p className="text-[13px] font-medium text-ink">{r.number}</p>
                  <p className="text-[11px] text-ink-faint">{r.company_name || "—"}</p>
                </div>
                <span className="text-[13px] font-semibold text-red-500">{formatCurrency(r.amount, r.currency)}</span>
              </div>
            ))}
            {rows.filter((r: any) => r.status === "Overdue").length === 0 && <p className="caption">No overdue invoices.</p>}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={rows}
          searchable
          searchPlaceholder="Search invoices…"
          onSearch={(q) => setRows(rows.filter((i: any) => i.number.toLowerCase().includes(q.toLowerCase()) || (i.company_name || "").toLowerCase().includes(q.toLowerCase())))}
        />
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New invoice"
        footer={<>
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={create} disabled={saving}>{saving ? <Spinner /> : "Create invoice"}</Button>
        </>}
      >
        <form onSubmit={create} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Invoice number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required />
          <Select label="Customer" value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })}>
            <option value="">Select customer</option>
            {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          <Select label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
            <option>USD</option><option>IDR</option><option>EUR</option><option>SGD</option><option>JPY</option><option>GBP</option>
          </Select>
          <Input label="Due date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option>Draft</option><option>Paid</option><option>Partially Paid</option>
          </Select>
        </form>
      </Modal>
    </div>
  );
}