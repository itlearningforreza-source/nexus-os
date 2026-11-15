"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page";
import { Button, Input, Select } from "@/components/ui/primitive";
import { useToast } from "@/components/ui/toast";

export function GeneralSettingsClient({
  org,
  user,
}: {
  org: any;
  user: any;
}) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState(org?.name || "");
  const [industry, setIndustry] = React.useState(org?.industry || "");
  const [size, setSize] = React.useState(org?.size || "");

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, industry, size }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }
      toast({ title: "Settings saved", variant: "success" });
      router.refresh();
    } catch {
      toast({ title: "Failed to save", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="General"
        description="Manage your organization settings"
      />
      <div className="card max-w-2xl p-6 space-y-5">
        <Input
          label="Organization Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Select
          label="Industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        >
          <option value="">Select industry</option>
          <option value="Technology">Technology</option>
          <option value="Finance">Finance</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Education">Education</option>
          <option value="Retail">Retail</option>
          <option value="Manufacturing">Manufacturing</option>
          <option value="Other">Other</option>
        </Select>
        <Select
          label="Company Size"
          value={size}
          onChange={(e) => setSize(e.target.value)}
        >
          <option value="">Select size</option>
          <option value="1-10">1-10 employees</option>
          <option value="11-50">11-50 employees</option>
          <option value="51-200">51-200 employees</option>
          <option value="201-500">201-500 employees</option>
          <option value="500+">500+ employees</option>
        </Select>
        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
