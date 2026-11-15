"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/page";
import { Button, Badge, Select } from "@/components/ui/primitive";
import { useToast } from "@/components/ui/toast";

const plans = ["Free", "Starter", "Business", "Enterprise"];

export function BillingSettingsClient({
  org,
  userCount,
  invoices,
  isAdmin,
}: {
  org: any;
  userCount: number;
  invoices: any[];
  isAdmin: boolean;
}) {
  const toast = useToast();
  const [plan, setPlan] = React.useState(org?.plan || "Business");
  const [busy, setBusy] = React.useState(false);
  const planDisp = org?.plan || "Business";

  const changePlan = async (target: string) => {
    setBusy(true);
    setPlan(target);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: target }),
      });
      if (res.ok) toast({ title: `Plan changed to ${target}`, variant: "success" });
      else {
        setPlan(planDisp);
        const data = await res.json().catch(() => ({}));
        toast({ title: data?.error || "Failed to change plan", variant: "error" });
      }
    } catch {
      setPlan(planDisp);
      toast({ title: "Failed to change plan", variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Billing" description="Manage your subscription and billing" />

      <div className="card max-w-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="h3">Current Plan</h3>
            <p className="text-sm text-ink-faint mt-1">
              {userCount} seats used
            </p>
          </div>
          <Badge tone="blue" className="text-sm px-3 py-1">
            {planDisp}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="rounded-lg border border-line p-3">
            <p className="text-xs text-ink-faint">Users</p>
            <p className="text-lg font-bold mt-1">{userCount}</p>
            <p className="text-xs text-ink-faint">seats</p>
          </div>
          <div className="rounded-lg border border-line p-3">
            <p className="text-xs text-ink-faint">Plan</p>
            <p className="text-lg font-bold mt-1">{planDisp}</p>
            <p className="text-xs text-ink-faint">subscription</p>
          </div>
          <div className="rounded-lg border border-line p-3">
            <p className="text-xs text-ink-faint">Recent invoices</p>
            <p className="text-lg font-bold mt-1">{invoices.length}</p>
            <p className="text-xs text-ink-faint">on file</p>
          </div>
        </div>
        {isAdmin ? (
          <div className="flex flex-wrap items-center gap-2">
            <Select value={plan} onChange={(e) => setPlan(e.target.value)}>
              {plans.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
            <Button onClick={() => changePlan(plan)} disabled={busy || plan === planDisp}>
              {busy ? "Saving…" : "Change Plan"}
            </Button>
            <Button variant="ghost" onClick={() => changePlan("Free")} disabled={busy}>
              Cancel Subscription
            </Button>
          </div>
        ) : (
          <p className="caption">Only admins can change the plan.</p>
        )}
      </div>

      <div className="card max-w-2xl p-6">
        <h3 className="h3 mb-4">Recent Invoices</h3>
        {!invoices || invoices.length === 0 ? (
          <p className="text-sm text-ink-faint">No invoices yet</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Number</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="font-medium">{inv.number}</td>
                  <td>${Number(inv.amount || 0).toLocaleString()}</td>
                  <td>
                    <Badge
                      tone={
                        inv.status === "Paid"
                          ? "green"
                          : inv.status === "Overdue"
                            ? "red"
                            : "neutral"
                      }
                    >
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="text-ink-faint">
                    {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
