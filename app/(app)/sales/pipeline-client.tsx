"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button, Badge, Input, Select, Spinner } from "@/components/ui/primitive";
import { PageHeader } from "@/components/ui/page";
import { Modal } from "@/components/ui/overlay";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
const stageTone: Record<string, string> = {
  Lead: "text-ink-faint bg-subtle border-line",
  Qualified: "text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20",
  Proposal: "text-purple-600 bg-purple-50 border-purple-100 dark:text-purple-400 dark:bg-purple-500/10 dark:border-purple-500/20",
  Negotiation: "text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20",
  Won: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20",
  Lost: "text-red-600 bg-red-50 border-red-100 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20",
};

type Deal = {
  id: string;
  title: string;
  company_name?: string;
  contact_name?: string;
  owner_id?: string;
  stage: string;
  value: number;
  probability: number;
  expected_close?: string;
};

export function SalesPipeline({ deals, users, companies, initialCreateOpen = false }: { deals: Deal[]; users: any[]; companies: any[]; initialCreateOpen?: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const [localDeals, setLocalDeals] = React.useState<Deal[]>(deals);
  const [newOpen, setNewOpen] = React.useState(initialCreateOpen);
  const [dragging, setDragging] = React.useState<string | null>(null);
  const [overStage, setOverStage] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [rankBy, setRankBy] = React.useState<"stage" | "value">("stage");
  const [form, setForm] = React.useState({ title: "", company_id: "", owner_id: "", value: 25000, stage: "Lead", expected_close: "", source: "Website" });
  const userById = Object.fromEntries(users.map((u) => [u.id, u]));

  const moveDeal = async (dealId: string, stage: string) => {
    setLocalDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage } : d)));
    const res = await fetch(`/api/crm/deals?id=${dealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    if (!res.ok) {
      setLocalDeals(deals);
      toast({ title: "Failed to update deal", variant: "error" });
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/deal");
    const stage = e.currentTarget.getAttribute("data-stage");
    if (id && stage) moveDeal(id, stage);
    setDragging(null);
    setOverStage(null);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/crm/deals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      toast({ title: "Deal created", variant: "success" });
      setNewOpen(false);
      const co = companies.find((c) => c.id === form.company_id);
      setLocalDeals((prev) => [...prev, { id: data.id, title: form.title, stage: form.stage, value: Number(form.value), probability: 30, company_name: co?.name, owner_id: form.owner_id }]);
      setForm({ title: "", company_id: "", owner_id: "", value: 25000, stage: "Lead", expected_close: "", source: "Website" });
    } else toast({ title: "Failed to create deal", variant: "error" });
  };

  const totalValue = localDeals.filter((d) => d.stage !== "Lost").reduce((s, d) => s + d.value, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Sales Pipeline"
        description={`${localDeals.length} deals · ${formatCurrency(totalValue)} open pipeline`}
        actions={
          <>
            <div className="card flex items-center gap-1 p-1">
              {(["stage", "value"] as const).map((r) => (
                <button key={r} onClick={() => setRankBy(r)} className={cn("rounded-lg px-3 py-1.5 text-[13px] font-medium capitalize transition-colors", rankBy === r ? "bg-subtle text-ink shadow-sm" : "text-ink-soft")}>
                  By {r}
                </button>
              ))}
            </div>
            <Button onClick={() => setNewOpen(true)}><Icon name="plus" size={15} /> New Deal</Button>
          </>
        }
      />

      <div className="flex gap-3 overflow-x-auto pb-4" style={{ scrollbarWidth: "thin" }}>
        {STAGES.map((stage) => {
          const stageDeals = localDeals.filter((d) => d.stage === stage);
          const stageValue = stageDeals.reduce((s, d) => s + d.value, 0);
          return (
            <div
              key={stage}
              data-stage={stage}
              onDragOver={(e) => { e.preventDefault(); setOverStage(stage); }}
              onDragLeave={() => setOverStage(null)}
              onDrop={onDrop}
              className={cn(
                "flex min-w-[260px] flex-1 flex-col rounded-2xl border bg-canvas-subtle/60 transition-colors",
                overStage === stage ? "border-accent bg-accent-subtle/50" : "border-line"
              )}
            >
              <div className="flex items-center justify-between px-3.5 pb-2 pt-3.5">
                <div className="flex items-center gap-2">
                  <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", stageTone[stage])}>
                    {stage}
                  </span>
                  <span className="meta">{stageDeals.length}</span>
                </div>
                <span className="text-[12px] font-medium text-ink-faint">{formatCurrency(stageValue)}</span>
              </div>

              <div className="flex flex-1 flex-col gap-2 px-2.5 pb-3">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData("text/deal", deal.id); setDragging(deal.id); }}
                    onDragEnd={() => { setDragging(null); setOverStage(null); }}
                    onClick={() => router.push(`/sales/${deal.id}`)}
                    className={cn(
                      "group cursor-grab rounded-xl border border-line bg-canvas-raised p-3.5 shadow-card transition-all hover:shadow-pop active:cursor-grabbing",
                      dragging === deal.id && "pointer-events-none opacity-40 rotate-2"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-semibold leading-snug text-ink">{deal.title}</p>
                      <span className="text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">
                        <Icon name="gantt" size={14} />
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-ink-faint">{deal.company_name || "No company"}</p>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <p className="text-[15px] font-semibold text-ink">{formatCurrency(deal.value)}</p>
                        <p className="text-[11px] text-ink-faint">{deal.probability}% probability</p>
                      </div>
                      {deal.owner_id && (
                        <span title={userById[deal.owner_id]?.name}>
                          <Avatar name={userById[deal.owner_id]?.name || "?"} color={userById[deal.owner_id]?.avatar_color} size="sm" />
                        </span>
                      )}
                    </div>
                    {deal.expected_close && (
                      <p className="mt-2 flex items-center gap-1 text-[11px] text-ink-faint">
                        <Icon name="calendar" size={11} /> Close {formatDate(deal.expected_close)}
                      </p>
                    )}
                  </div>
                ))}
                {stageDeals.length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-line-strong py-8 text-[12px] text-ink-faint">
                    Drop deals here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="New deal"
        description="Add an opportunity to the pipeline."
        footer={<>
          <Button variant="secondary" onClick={() => setNewOpen(false)}>Cancel</Button>
          <Button onClick={create} disabled={saving}>{saving ? <Spinner /> : "Create deal"}</Button>
        </>}
      >
        <form onSubmit={create} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Deal title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Acme Enterprise License" />
          </div>
          <Select label="Company" value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })}>
            <option value="">Select company</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Owner" value={form.owner_id} onChange={(e) => setForm({ ...form, owner_id: e.target.value })}>
            <option value="">Unassigned</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <Input label="Value (USD)" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
          <Select label="Stage" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
            {STAGES.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Input label="Expected close" type="date" value={form.expected_close} onChange={(e) => setForm({ ...form, expected_close: e.target.value })} />
          <Select label="Source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
            <option>Website</option><option>Referral</option><option>Outbound</option><option>Inbound</option><option>Partner</option><option>Event</option>
          </Select>
        </form>
      </Modal>
    </div>
  );
}