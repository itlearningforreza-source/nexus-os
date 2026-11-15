"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button, Badge } from "@/components/ui/primitive";
import { PageHeader } from "@/components/ui/page";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency, timeAgo } from "@/lib/utils";

export function CrmOverview({ stats, recentCompanies, recentContacts, topDeals }: any) {
  const router = useRouter();
  const healthColor: Record<string, string> = {
    Healthy: "bg-emerald-500",
    "At Risk": "bg-amber-500",
    Critical: "bg-red-500",
    Other: "bg-zinc-400",
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="CRM"
        description="Manage relationships, pipeline, and customer health."
        actions={
          <>
            <Button variant="secondary" onClick={() => router.push("/crm/contacts")}>
              <Icon name="users" size={15} /> Contacts
            </Button>
            <Button onClick={() => router.push("/sales")}>
              <Icon name="plus" size={15} /> New Deal
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Contacts", value: String(stats.contacts), icon: "users", accent: "#3b82f6", href: "/crm/contacts" },
          { label: "Companies", value: String(stats.companies), icon: "building", accent: "#8b5cf6", href: "/crm/companies" },
          { label: "Leads", value: String(stats.leads), icon: "target", accent: "#f59e0b", href: "/crm/contacts?status=lead" },
          { label: "Open Pipeline", value: formatCurrency(stats.pipelineValue), icon: "sales", accent: "#10b981", href: "/sales" },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="card group block p-5 transition-all duration-150 hover:shadow-pop hover:-translate-y-[1px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] font-medium text-ink-soft">{s.label}</p>
                <p className="mt-2 text-[26px] font-semibold tracking-tight text-ink">{s.value}</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${s.accent} 12%, transparent)`, color: s.accent }}>
                <Icon name={s.icon as any} size={17} />
              </span>
            </div>
            <p className="mt-3 text-[12px] font-medium text-accent">{stats.openDeals} open deals →</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="h3">Companies</h3>
            <Link href="/crm/companies" className="text-[13px] font-medium text-accent hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {recentCompanies.map((c: any) => (
              <button key={c.id} onClick={() => router.push(`/crm/companies/${c.id}`)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-subtle">
                <span className={`h-2 w-2 shrink-0 rounded-full ${healthColor[c.health] || healthColor.Other}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{c.name}</p>
                  <p className="text-[12px] text-ink-faint">{c.industry}</p>
                </div>
                <span className="text-[13px] font-medium text-ink">{formatCurrency(c.annual_revenue)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="h3">Recent contacts</h3>
            <Link href="/crm/contacts" className="text-[13px] font-medium text-accent hover:underline">View all</Link>
          </div>
          <div className="space-y-1.5">
            {recentContacts.map((c: any) => (
              <button key={c.id} onClick={() => router.push(`/crm/contacts/${c.id}`)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-subtle">
                <Avatar name={`${c.first_name} ${c.last_name}`} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{c.first_name} {c.last_name}</p>
                  <p className="truncate text-[12px] text-ink-faint">{c.title}</p>
                </div>
                <Badge tone={c.score > 75 ? "green" : c.score > 40 ? "blue" : "neutral"}>{c.score}</Badge>
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="h3">Top deals</h3>
            <Link href="/sales" className="text-[13px] font-medium text-accent hover:underline">Pipeline</Link>
          </div>
          <div className="space-y-2">
            {topDeals.map((d: any) => (
              <button key={d.id} onClick={() => router.push("/sales")} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-subtle">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{d.title}</p>
                  <p className="truncate text-[12px] text-ink-faint">{d.company_name || "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold text-ink">{formatCurrency(d.value)}</p>
                  <p className="text-[11px] text-ink-faint">{d.probability}%</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}