"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/page";
import { Button, Input } from "@/components/ui/primitive";
import { Badge } from "@/components/ui/primitive";
import { useToast } from "@/components/ui/toast";

type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  created_at: string;
  last_used?: string | null;
};

export function ApiSettingsClient({ user }: { user: any }) {
  const toast = useToast();
  const [keys, setKeys] = React.useState<ApiKey[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState("");
  const [justCreated, setJustCreated] = React.useState<string | null>(null);
  const [webhook, setWebhook] = React.useState("");

  React.useEffect(() => {
    fetch("/api/settings/api-keys")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.keys)) setKeys(d.keys); })
      .catch(() => toast({ title: "Failed to load API keys", variant: "error" }))
      .finally(() => setLoading(false));
  }, []);

  const createKey = async () => {
    if (!name.trim()) { toast({ title: "Enter a name for the key", variant: "error" }); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (res.ok && data?.key) {
        setJustCreated(data.key.secret);
        setKeys([{ id: data.key.id, name: data.key.name, key_prefix: data.key.key_prefix, permissions: data.key.permissions, created_at: data.key.created_at, last_used: data.key.last_used }, ...keys]);
        setName("");
        toast({ title: "API key created", variant: "success" });
      } else {
        toast({ title: data?.error || "Failed to create key", variant: "error" });
      }
    } catch {
      toast({ title: "Failed to create key", variant: "error" });
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setKeys((prev) => prev.filter((k) => k.id !== id));
        toast({ title: "API key revoked", variant: "success" });
      } else {
        toast({ title: "Failed to revoke key", variant: "error" });
      }
    } catch {
      toast({ title: "Failed to revoke key", variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="API & Webhooks"
        description="Manage API keys and webhook integrations"
        actions={
          <Button onClick={createKey} disabled={creating}>
            {creating ? "Creating…" : "Create API Key"}
          </Button>
        }
      />

      <div className="card max-w-3xl p-6 mb-6">
        <h3 className="h3 mb-4">API Keys</h3>
        {loading ? (
          <p className="caption">Loading keys…</p>
        ) : keys.length === 0 ? (
          <p className="caption">No API keys yet. Create one to get started.</p>
        ) : (
          <div className="space-y-3">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between rounded-lg border border-line p-4">
                <div>
                  <p className="text-sm font-medium">{k.name}</p>
                  <p className="font-mono text-xs text-ink-faint mt-1">{k.key_prefix}••••••••••••</p>
                  <p className="text-xs text-ink-faint mt-1">
                    Created {k.created_at} · Permissions: {k.permissions.join(", ") || "read"}
                    {k.last_used ? ` · Last used ${k.last_used}` : ""}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => revoke(k.id)}>Revoke</Button>
              </div>
            ))}
          </div>
        )}

        {justCreated && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">Copy your secret now — it won't be shown again.</p>
            <p className="font-mono text-xs mt-1 break-all">{justCreated}</p>
          </div>
        )}

        <div className="mt-4">
          <Input label="Key name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Production Key" />
        </div>
      </div>

      <div className="card max-w-3xl p-6">
        <h3 className="h3 mb-4">Webhooks</h3>
        <p className="text-sm text-ink-faint mb-4">
          Configure webhook endpoints to receive real-time event notifications (coming with automation engine).
        </p>
        <div className="flex items-center gap-3">
          <Input placeholder="https://your-app.com/webhook" className="flex-1" value={webhook} onChange={(e) => setWebhook(e.target.value)} />
          <Button onClick={() => toast({ title: "Webhook endpoints arrive with the workflow engine", variant: "error" })}>
            Add Endpoint
          </Button>
        </div>
      </div>
    </div>
  );
}