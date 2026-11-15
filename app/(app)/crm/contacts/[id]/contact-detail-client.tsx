"use client";

import * as React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button, Badge } from "@/components/ui/primitive";
import { PageHeader, EmptyState, LoadingBlock } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";

type Contact = {
  id: string; first_name: string; last_name: string; email: string; phone: string;
  company_id: string; title: string; status: string; tags?: string; score: number; created_at: string;
};
type Company = { id: string; name: string; industry: string; city: string; country: string };
type Deal = { id: string; title: string; stage: string; value: number; probability: number; expected_close: string };

const stageTone: Record<string, string> = {
  Lead: "neutral", Qualified: "blue", Proposal: "yellow", "In Negotiation": "orange", "Closed Won": "green", "Closed Lost": "red",
};

export function ContactDetailClient({ id }: { id: string }) {
  const toast = useToast();
  const [contact, setContact] = React.useState<Contact | null>(null);
  const [company, setCompany] = React.useState<Company | null>(null);
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/crm/contacts?id=${id}`).then((r) => r.json()),
      fetch(`/api/crm/deals?contact_id=${id}`).then((r) => r.json()),
    ])
      .then(([cd, dd]) => {
        const c = cd.row || cd.rows?.[0] || null;
        setContact(c);
        setDeals(dd.rows || []);
        if (c?.company_id) {
          fetch(`/api/crm/companies?id=${c.company_id}`).then((r) => r.json()).then((d) => setCompany(d.row || d.rows?.[0] || null)).catch(() => {});
        }
      })
      .catch(() => toast({ title: "Failed to load contact", variant: "error" }))
      .finally(() => setLoading(false));
  }, [id, toast]);

  if (loading) return <LoadingBlock rows={6} />;
  if (!contact) return <EmptyState title="Contact not found" description="This contact may have been deleted." />;

  const name = `${contact.first_name} ${contact.last_name}`;
  const tags = (() => { try { return JSON.parse(contact.tags || "[]"); } catch { return []; } })();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={name}
        description={contact.title || "Contact"}
        back={`/crm/contacts`}
        actions={<Button><Icon name="edit" size={15} /> Edit</Button>}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge tone={contact.status === "Active" ? "green" : "neutral"}>{contact.status}</Badge>
        <Badge tone="blue">Score {contact.score}</Badge>
        {tags.map((t: string) => <Badge key={t}>{t}</Badge>)}
        {company && (
          <Link href={`/crm/companies/${company.id}`} className="caption inline-flex items-center gap-1 text-accent hover:underline">
            <Icon name="building" size={13} /> {company.name}
          </Link>
        )}
      </div>

      <div className="card p-5">
        <h3 className="h3 mb-4">Contact details</h3>
        <dl className="grid grid-cols-1 gap-4 text-[13px] sm:grid-cols-2">
          <Row label="Email" value={contact.email ? <a className="text-accent hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a> : "—"} />
          <Row label="Phone" value={contact.phone || "—"} />
          <Row label="Title" value={contact.title || "—"} />
          <Row label="Company" value={company ? <a className="text-accent hover:underline" href={`/crm/companies/${company.id}`}>{company.name}</a> : "—"} />
          <Row label="Score" value={String(contact.score ?? 0)} />
          <Row label="Added" value={formatDate(contact.created_at)} />
        </dl>
      </div>

      {deals.length > 0 && (
        <div className="card mt-6 overflow-hidden">
          <div className="border-b border-line px-5 py-3">
            <h3 className="h3">Deals</h3>
          </div>
          <table className="table-base">
            <thead><tr><th>Deal</th><th>Stage</th><th>Value</th><th>Close</th></tr></thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id}>
                  <td className="font-medium text-ink">{d.title}</td>
                  <td><Badge tone={(stageTone[d.stage] || "neutral") as any}>{d.stage}</Badge></td>
                  <td className="font-medium text-ink">{formatCurrency(d.value)}</td>
                  <td className="caption">{formatDate(d.expected_close)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-subtle p-3">
      <dt className="caption">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value}</dd>
    </div>
  );
}
