"use client";

import * as React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button, Badge } from "@/components/ui/primitive";
import { PageHeader, EmptyState, LoadingBlock } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";

type Deal = {
  id: string; title: string; stage: string; value: number; probability: number;
  expected_close: string; source: string; owner_id: string; company_id: string; contact_id: string; created_at: string;
};
type Company = { id: string; name: string; industry: string };
type Invoice = { id: string; number: string; status: string; amount: number; issue_date: string };
type Contract = { id: string; title: string; status: string; value: number; expiry_date: string };

const stageTone: Record<string, string> = {
  Lead: "neutral", Qualified: "blue", Proposal: "yellow", "In Negotiation": "orange", "Closed Won": "green", "Closed Lost": "red",
};
const STAGES = ["Lead", "Qualified", "Proposal", "In Negotiation", "Closed Won", "Closed Lost"];

export function DealDetailClient({ id }: { id: string }) {
  const toast = useToast();
  const [deal, setDeal] = React.useState<Deal | null>(null);
  const [company, setCompany] = React.useState<Company | null>(null);
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [contracts, setContracts] = React.useState<Contract[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingStage, setSavingStage] = React.useState(false);

  const load = React.useCallback(() => {
    if (!id) return;
    fetch(`/api/crm/deals?id=${id}`)
      .then((r) => r.json())
      .then((dd) => {
        const d = dd.row || dd.rows?.[0] || null;
        setDeal(d);
        if (d?.company_id) {
          fetch(`/api/crm/companies?id=${d.company_id}`).then((r) => r.json()).then((x) => setCompany(x.row || x.rows?.[0] || null)).catch(() => {});
          fetch(`/api/finance/invoices?company_id=${d.company_id}`).then((r) => r.json()).then((x) => setInvoices(x.rows || [])).catch(() => {});
          fetch(`/api/legal/contracts?company_id=${d.company_id}`).then((r) => r.json()).then((x) => setContracts(x.rows || [])).catch(() => {});
        }
      })
      .catch(() => toast({ title: "Failed to load deal", variant: "error" }))
      .finally(() => setLoading(false));
  }, [id, toast]);

  React.useEffect(() => { load(); }, [load]);

  const setStage = (stage: string) => {
    setSavingStage(true);
    fetch(`/api/crm/deals?id=${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage }) })
      .then((r) => r.json())
      .then(() => { setDeal((p) => (p ? { ...p, stage } : p)); toast({ title: `Deal moved to ${stage}`, variant: "success" }); })
      .catch(() => toast({ title: "Update failed", variant: "error" }))
      .finally(() => setSavingStage(false));
  };

  if (loading) return <LoadingBlock rows={6} />;
  if (!deal) return <EmptyState title="Deal not found" description="This deal may have been deleted." />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={deal.title}
        description={company?.name || `Stage: ${deal.stage}`}
        back={`/sales`}
        actions={<Button><Icon name="edit" size={15} /> Edit</Button>}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge tone={(stageTone[deal.stage] || "neutral") as any}>{deal.stage}</Badge>
        <Badge tone="blue">{deal.probability}%</Badge>
        <Badge tone="yellow">{formatCurrency(deal.value)}</Badge>
        {company && (
          <Link href={`/crm/companies/${company.id}`} className="caption inline-flex items-center gap-1 text-accent hover:underline">
            <Icon name="building" size={13} /> {company.name}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-5">
            <h3 className="h3 mb-4">Stage</h3>
            <div className="flex flex-wrap items-center gap-2">
              {STAGES.map((s, i) => (
                <React.Fragment key={s}>
                  <button
                    onClick={() => setStage(s)}
                    disabled={savingStage}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all ${deal.stage === s ? "bg-accent text-white shadow-card" : "border border-line bg-canvas-raised text-ink-soft hover:border-accent/40"}`}
                  >
                    {s}
                  </button>
                  {i < STAGES.length - 1 && <Icon name="chevron-right" size={13} className="text-ink-faint" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-line px-5 py-3"><h3 className="h3">Invoices</h3></div>
            {invoices.length === 0 ? <EmptyState title="No invoices" /> : (
              <table className="table-base">
                <thead><tr><th>Number</th><th>Status</th><th>Amount</th><th>Issued</th></tr></thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="font-medium text-ink">{inv.number}</td>
                      <td><Badge tone={inv.status === "Paid" ? "green" : inv.status === "Overdue" ? "red" : "yellow"}>{inv.status}</Badge></td>
                      <td className="font-medium text-ink">{formatCurrency(inv.amount)}</td>
                      <td className="caption">{formatDate(inv.issue_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-line px-5 py-3"><h3 className="h3">Contracts</h3></div>
            {contracts.length === 0 ? <EmptyState title="No contracts" /> : (
              <table className="table-base">
                <thead><tr><th>Contract</th><th>Status</th><th>Value</th><th>Expiry</th></tr></thead>
                <tbody>
                  {contracts.map((c) => (
                    <tr key={c.id}>
                      <td className="font-medium text-ink">{c.title}</td>
                      <td><Badge tone={c.status === "Active" ? "green" : "neutral"}>{c.status}</Badge></td>
                      <td className="font-medium text-ink">{formatCurrency(c.value)}</td>
                      <td className="caption">{formatDate(c.expiry_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="h3 mb-4">Deal info</h3>
          <dl className="space-y-3 text-[13px]">
            <Meta label="Value" value={formatCurrency(deal.value)} />
            <Meta label="Probability" value={`${deal.probability}%`} />
            <Meta label="Source" value={deal.source || "—"} />
            <Meta label="Expected close" value={formatDate(deal.expected_close)} />
            <Meta label="Industry" value={company?.industry || "—"} />
            <Meta label="Created" value={formatDate(deal.created_at)} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line/60 pb-3">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
