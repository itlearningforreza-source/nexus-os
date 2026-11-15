"use client";

import * as React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button, Badge, Skeleton } from "@/components/ui/primitive";
import { PageHeader, EmptyState, LoadingBlock } from "@/components/ui/page";
import { PageTabs } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate, initials } from "@/lib/utils";

type Company = {
  id: string; name: string; industry: string; website: string;
  city: string; country: string; employees: number; annual_revenue: number;
  health: string; owner_id: string; tags?: string; created_at: string;
};
type Contact = { id: string; first_name: string; last_name: string; title: string; email: string; phone: string; status: string };
type Deal = { id: string; title: string; stage: string; value: number; probability: number; expected_close: string };
type Project = { id: string; name: string; status: string; progress: number; end_date: string };

const healthTone: Record<string, "green" | "yellow" | "red"> = { Healthy: "green", "At Risk": "yellow", Critical: "red" };
const stageTone: Record<string, string> = {
  Lead: "neutral", Qualified: "blue", Proposal: "yellow", "In Negotiation": "orange", "Closed Won": "green", "Closed Lost": "red",
};

export function CompanyDetailClient({ id }: { id: string }) {
  const toast = useToast();
  const [company, setCompany] = React.useState<Company | null>(null);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState("overview");

  React.useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/crm/companies?id=${id}`).then((r) => r.json()),
      fetch(`/api/crm/contacts?company_id=${id}`).then((r) => r.json()),
      fetch(`/api/crm/deals?company_id=${id}`).then((r) => r.json()),
      fetch(`/api/projects?company_id=${id}`).then((r) => r.json()),
    ])
      .then(([cd, ctd, dd, pd]) => {
        setCompany(cd.row || cd.rows?.[0] || null);
        setContacts(ctd.rows || []);
        setDeals(dd.rows || []);
        setProjects(pd.rows || []);
      })
      .catch(() => toast({ title: "Failed to load company", variant: "error" }))
      .finally(() => setLoading(false));
  }, [id, toast]);

  if (loading) return <LoadingBlock rows={6} />;
  if (!company) return <EmptyState title="Company not found" description="This company may have been deleted." />;

  const tags = (() => { try { return JSON.parse(company.tags || "[]"); } catch { return []; } })();

  const tabs = [
    { id: "overview", label: "Overview", icon: "home" as const },
    { id: "contacts", label: `Contacts (${contacts.length})` },
    { id: "deals", label: `Deals (${deals.length})` },
    { id: "projects", label: `Projects (${projects.length})` },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={company.name}
        description={`${company.industry} · ${company.city}, ${company.country}`}
        back={`/crm/companies`}
        actions={
          <>
            <Button variant="secondary"><Icon name="edit" size={15} /> Edit</Button>
            <Button><Icon name="plus" size={15} /> New Deal</Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge tone={healthTone[company.health] || "neutral"}>{company.health}</Badge>
        <Badge>{company.industry}</Badge>
        {tags.map((t: string) => <Badge key={t} tone="blue">{t}</Badge>)}
        {company.website && (
          <a href={company.website} target="_blank" rel="noreferrer" className="caption inline-flex items-center gap-1 text-accent hover:underline">
            <Icon name="globe" size={13} /> {company.website}
          </a>
        )}
      </div>

      <div className="mb-6">
        <PageTabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
            <StatCard icon="users" label="Employees" value={company.employees?.toLocaleString()} />
            <StatCard icon="dollar" label="Annual revenue" value={formatCurrency(company.annual_revenue)} />
            <StatCard icon="briefcase" label="Contacts" value={String(contacts.length)} />
            <StatCard icon="trending" label="Open deals" value={String(deals.length)} />
          </div>

          <div className="card p-5">
            <h3 className="h3 mb-4">About</h3>
            <dl className="space-y-3 text-[13px]">
              <Row label="Industry" value={company.industry || "—"} />
              <Row label="Location" value={`${company.city}, ${company.country}`} />
              <Row label="Website" value={<a className="text-accent hover:underline" href={company.website} target="_blank" rel="noreferrer">{company.website}</a>} />
              <Row label="Created" value={formatDate(company.created_at)} />
              <Row label="Tags" value={tags.join(", ") || "—"} />
            </dl>
          </div>
        </div>
      )}

      {tab === "contacts" && (
        <div className="card overflow-hidden">
          {contacts.length === 0 ? <EmptyState title="No contacts" /> : (
            <table className="table-base">
              <thead><tr><th>Contact</th><th>Title</th><th>Email</th><th>Status</th></tr></thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/crm/contacts/${c.id}`} className="flex items-center gap-3">
                        <span className="avatar">{initials(c.first_name + " " + c.last_name)}</span>
                        <span className="font-medium text-ink">{c.first_name} {c.last_name}</span>
                      </Link>
                    </td>
                    <td className="caption">{c.title}</td>
                    <td className="caption">{c.email}</td>
                    <td><Badge tone={c.status === "Active" ? "green" : "neutral"}>{c.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "deals" && (
        <div className="card overflow-hidden">
          {deals.length === 0 ? <EmptyState title="No deals" /> : (
            <table className="table-base">
              <thead><tr><th>Deal</th><th>Stage</th><th>Value</th><th>Prob.</th><th>Close</th></tr></thead>
              <tbody>
                {deals.map((d) => (
                  <tr key={d.id}>
                    <td className="font-medium text-ink">{d.title}</td>
                    <td><Badge tone={(stageTone[d.stage] || "neutral") as any}>{d.stage}</Badge></td>
                    <td className="font-medium text-ink">{formatCurrency(d.value)}</td>
                    <td className="caption">{d.probability}%</td>
                    <td className="caption">{formatDate(d.expected_close)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "projects" && (
        <div className="card overflow-hidden">
          {projects.length === 0 ? <EmptyState title="No projects" /> : (
            <table className="table-base">
              <thead><tr><th>Project</th><th>Status</th><th>Progress</th><th>Due</th></tr></thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium text-ink"><Link href={`/projects/${p.id}`} className="hover:underline">{p.name}</Link></td>
                    <td><Badge tone={p.status === "Completed" ? "green" : p.status === "On Hold" ? "yellow" : "blue"}>{p.status}</Badge></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-subtle"><div className="h-full rounded-full bg-accent" style={{ width: `${p.progress}%` }} /></div>
                        <span className="caption">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="caption">{formatDate(p.end_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-subtle text-accent"><Icon name={icon} size={20} /></span>
      <div><p className="h3">{value || "—"}</p><p className="meta">{label}</p></div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
