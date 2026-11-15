"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/page";
import { Button, Input } from "@/components/ui/primitive";
import { Badge } from "@/components/ui/primitive";
import { useToast } from "@/components/ui/toast";

export function SecuritySettingsClient({
  user,
  sessions,
}: {
  user: any;
  sessions: any[];
}) {
  const toast = useToast();
  const [changing, setChanging] = React.useState(false);
  const [currentPass, setCurrentPass] = React.useState("");
  const [newPass, setNewPass] = React.useState("");
  const [confirmPass, setConfirmPass] = React.useState("");

  const handleChangePassword = async () => {
    if (newPass !== confirmPass) {
      toast({ title: "Passwords do not match", variant: "error" });
      return;
    }
    if (newPass.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "error" });
      return;
    }
    setChanging(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }
      toast({ title: "Password updated", variant: "success" });
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (e: any) {
      toast({ title: e.message || "Failed to update password", variant: "error" });
    } finally {
      setChanging(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Security"
        description="Manage your password and sessions"
      />

      <div className="card max-w-2xl p-6 mb-6">
        <h3 className="h3 mb-4">Change Password</h3>
        <div className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPass}
            onChange={(e) => setCurrentPass(e.target.value)}
          />
          <Input
            label="New Password"
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
          />
          <Button onClick={handleChangePassword} disabled={changing}>
            {changing ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </div>

      <div className="card max-w-2xl p-6">
        <h3 className="h3 mb-4">Active Sessions</h3>
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-sm text-ink-faint">No active sessions</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-line p-3"
              >
                <div>
                  <p className="text-sm font-medium">Session</p>
                  <p className="text-xs text-ink-faint">
                    Expires: {new Date(s.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge tone="green">Active</Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
