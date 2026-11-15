"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/page";
import { Button } from "@/components/ui/primitive";
import { Switch } from "@/components/ui/primitive";
import { useToast } from "@/components/ui/toast";

const notificationSettings = [
  { key: "email_mentions", label: "Email me when someone mentions me", default: true },
  { key: "email_assignments", label: "Email me when a task is assigned", default: true },
  { key: "email_deals", label: "Email me on deal updates", default: false },
  { key: "email_tickets", label: "Email me on ticket updates", default: true },
  { key: "email_invoices", label: "Email me on invoice status changes", default: true },
  { key: "push_mentions", label: "Push notifications for mentions", default: true },
  { key: "push_assignments", label: "Push notifications for assignments", default: true },
  { key: "push_messages", label: "Push notifications for messages", default: true },
  { key: "digest_daily", label: "Daily digest email", default: false },
  { key: "digest_weekly", label: "Weekly summary email", default: true },
];

export function NotificationsSettingsClient({ user }: { user: any }) {
  const toast = useToast();
  const savedPrefs = React.useMemo(() => {
    try {
      return typeof user?.preferences === "string" ? JSON.parse(user.preferences) : (user?.preferences || {});
    } catch {
      return {};
    }
  }, [user]);
  const [settings, setSettings] = React.useState<Record<string, boolean>>(
    Object.fromEntries(notificationSettings.map((s) => [s.key, typeof savedPrefs[s.key] === "boolean" ? savedPrefs[s.key] : s.default]))
  );
  const [saving, setSaving] = React.useState(false);

  const handleToggle = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: settings }),
      });
      toast({ title: res.ok ? "Notification preferences saved" : "Failed to save preferences", variant: res.ok ? "success" : "error" });
    } catch {
      toast({ title: "Failed to save preferences", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Choose what notifications you receive"
      />
      <div className="card max-w-2xl p-6 space-y-1">
        {notificationSettings.map((s) => (
          <div
            key={s.key}
            className="flex items-center justify-between py-3 border-b border-line last:border-0"
          >
            <p className="text-sm">{s.label}</p>
            <Switch
              checked={settings[s.key]}
              onCheckedChange={() => handleToggle(s.key)}
            />
          </div>
        ))}
        <div className="pt-4">
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Preferences"}</Button>
        </div>
      </div>
    </div>
  );
}
