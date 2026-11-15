"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page";
import { Button, Input } from "@/components/ui/primitive";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";

export function ProfileSettingsClient({ user }: { user: any }) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState(user?.name || "");
  const [email, setEmail] = React.useState(user?.email || "");
  const [title, setTitle] = React.useState(user?.title || "");
  const [phone, setPhone] = React.useState(user?.phone || "");

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, title, phone }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to save");
      }
      toast({ title: "Profile updated", variant: "success" });
      router.refresh();
    } catch (err) {
      toast({ title: err instanceof Error && err.message ? err.message : "Failed to save", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Profile" description="Manage your personal information" />
      <div className="card max-w-2xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Avatar
            name={user?.name || "U"}
            color={user?.avatar_color}
            size="lg"
          />
          <div>
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-ink-faint">{user?.email}</p>
          </div>
        </div>
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Job Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Software Engineer"
          />
          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}
