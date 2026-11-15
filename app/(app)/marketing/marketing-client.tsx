"use client";

import * as React from "react";
import { Icon } from "@/components/ui/icon";
import { Badge, Button, Input, Select, Spinner } from "@/components/ui/primitive";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Modal } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";

type Campaign = {
  id: string; name: string; status: string; type?: string;
  budget?: number; revenue?: number; leads?: number; open_rate?: number; ctr?: number;
};

export function MarketingClient({ campaigns: initial, initialCreateOpen = false }: { campaigns: Campaign[]; initialCreateOpen?: boolean }) {
  const toast = useToast();
  const [campaigns, setCampaigns] = React.useState<Campaign[]>(initial);
  const [open, setOpen] = React.useState(initialCreateOpen);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", type: "Email", status: "Draft", budget: "5000" });

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, type: form.type, status: form.status, budget: Number(form.budget || 0), revenue: 0, leads: 0, open_rate: 0, ctr: 0 }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        toast({ title: "Campaign created", variant: "success" });
        setCampaigns((prev) => [{ id: data.id, name: form.name, type: form.type, status: form.status, budget: Number(form.budget || 0), revenue: 0, leads: 0, open_rate: 0, ctr: 0 }, ...prev]);
        setOpen(false);
        setForm({ name: "", type: "Email", status: "Draft", budget: "5000" });
      } else {
        toast({ title: data?.error || "Failed to create campaign", variant: "error" });
      }
    } catch {
      toast({ title: "Failed to create campaign", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Marketing"
        description="Manage your marketing campaigns"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Icon name="plus" size={15} /> New Campaign
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs text-ink-faint">Total Campaigns</p>
          <p className="mt-1 text-2xl font-bold">{campaigns.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-faint">Active</p>
          <p className="mt-1 text-2xl font-bold">
            {campaigns.filter((c) => c.status === "Active").length}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-faint">Total Leads</p>
          <p className="mt-1 text-2xl font-bold">
            {campaigns.reduce((s, c) => s + (c.leads || 0), 0)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-faint">Avg. Open Rate</p>
          <p className="mt-1 text-2xl font-bold">
            {campaigns.length > 0
              ? `${(
                  campaigns.reduce((s, c) => s + (c.open_rate || 0), 0) /
                  campaigns.length
                ).toFixed(1)}%`
              : "0%"}
          </p>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon="marketing"
          title="No campaigns yet"
          description="Create your first marketing campaign"
          action={<Button onClick={() => setOpen(true)}>Create Campaign</Button>}
        />
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="card flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10">
                <Icon
                  name="marketing"
                  size={20}
                  className="text-purple-600 dark:text-purple-400"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-xs text-ink-faint mt-0.5">
                  {c.type || "Email"} · Budget: ${Number(c.budget || 0).toLocaleString()}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-6 text-center">
                <div>
                  <p className="text-sm font-bold">{c.leads || 0}</p>
                  <p className="text-[11px] text-ink-faint">Leads</p>
                </div>
                <div>
                  <p className="text-sm font-bold">{c.open_rate || 0}%</p>
                  <p className="text-[11px] text-ink-faint">Open Rate</p>
                </div>
                <div>
                  <p className="text-sm font-bold">{c.ctr || 0}%</p>
                  <p className="text-[11px] text-ink-faint">CTR</p>
                </div>
                <div>
                  <p className="text-sm font-bold">
                    ${Number(c.revenue || 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-ink-faint">Revenue</p>
                </div>
              </div>
              <Badge
                tone={
                  c.status === "Active"
                    ? "green"
                    : c.status === "Completed"
                      ? "blue"
                      : "yellow"
                }
              >
                {c.status}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New campaign"
        footer={<>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={create} disabled={saving}>{saving ? <Spinner /> : "Create campaign"}</Button>
        </>}
      >
        <form onSubmit={create} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option>Email</option><option>Social</option><option>Webinar</option><option>Paid</option><option>Content</option>
          </Select>
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option>Draft</option><option>Active</option><option>Paused</option>
          </Select>
          <Input label="Budget (USD)" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
        </form>
      </Modal>
    </div>
  );
}