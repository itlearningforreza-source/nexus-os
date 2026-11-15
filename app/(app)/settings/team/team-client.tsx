"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/page";
import { Button, Badge, Input, Select } from "@/components/ui/primitive";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";

type Invite = { id: string; email: string; role: string; created_at: string };

export function TeamSettingsClient({
  members,
  currentUser,
}: {
  members: any[];
  currentUser: any;
}) {
  const toast = useToast();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("member");
  const [invites, setInvites] = React.useState<Invite[]>([]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/settings/team-invites")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.invites)) setInvites(d.invites); })
      .catch(() => {});
  }, []);

  const sendInvite = async () => {
    if (!email.trim()) { toast({ title: "Enter an email address", variant: "error" }); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/settings/team-invites", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Invitation sent", variant: "success" });
        setInvites((prev) => [...prev, { id: data.id, email: email.trim().toLowerCase(), role, created_at: "" }]);
        setEmail("");
      } else {
        toast({ title: data?.error || "Failed to send invitation", variant: "error" });
      }
    } catch {
      toast({ title: "Failed to send invitation", variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const revokeInvite = async (id: string) => {
    try {
      const res = await fetch("/api/settings/team-invites", {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
      });
      if (res.ok) { setInvites((prev) => prev.filter((i) => i.id !== id)); toast({ title: "Invitation revoked", variant: "success" }); }
      else toast({ title: "Failed to revoke invitation", variant: "error" });
    } catch { toast({ title: "Failed to revoke invitation", variant: "error" }); }
  };

  return (
    <div>
      <PageHeader
        title="Team"
        description="Manage your team members and roles"
      />

      {(members?.length || invites.length) > 0 && (
        <div className="card max-w-3xl overflow-hidden">
          <table className="table-base">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(members || []).map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} color={m.avatar_color} size="sm" />
                      <div>
                        <p className="text-sm font-medium">
                          {m.name}
                          {m.id === currentUser.id && (
                            <span className="ml-1.5 text-xs text-ink-faint">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-ink-faint">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge tone={m.role === "owner" ? "purple" : "neutral"}>
                      {m.role}
                    </Badge>
                  </td>
                  <td>
                    <Badge tone={m.status === "active" ? "green" : "yellow"}>
                      {m.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {invites.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-subtle text-xs">✉</div>
                      <div>
                        <p className="text-sm font-medium">{inv.email}</p>
                        <p className="text-xs text-ink-faint">Invitation pending</p>
                      </div>
                    </div>
                  </td>
                  <td><Badge>{inv.role}</Badge></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Badge tone="yellow">Pending</Badge>
                      <Button variant="ghost" size="sm" onClick={() => revokeInvite(inv.id)}>Revoke</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card max-w-3xl p-6 mt-6">
        <h3 className="h3 mb-2">Invite a team member</h3>
        <p className="caption mb-4">Send an invitation to join this organization.</p>
        <div className="flex flex-wrap items-center gap-3">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" className="flex-1" />
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="member">Member</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </Select>
          <Button onClick={sendInvite} disabled={busy}>{busy ? "Sending…" : "Invite Member"}</Button>
        </div>
      </div>
    </div>
  );
}
