"use client";

import * as React from "react";
import { Icon } from "@/components/ui/icon";
import { Button, Badge } from "@/components/ui/primitive";
import { Modal } from "@/components/ui/overlay";
import { Input, Textarea, Select } from "@/components/ui/primitive";
import { PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";

const TRIGGERS = [
  "record_created",
  "record_updated",
  "payment_received",
  "ticket_created",
  "deadline_approaching",
  "schedule",
  "webhook",
];

const ACTIONS = [
  "create_record",
  "update_record",
  "send_email",
  "send_notification",
  "create_task",
  "http_request",
  "webhook",
  "ai_action",
];

export function AutomationClient({ automations }: { automations: any[] }) {
  const toast = useToast();
  const [showCreate, setShowCreate] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    trigger: "record_created",
    description: "",
  });

  const handleCreate = async () => {
    if (!form.name) {
      toast({ title: "Name is required", variant: "error" });
      return;
    }
    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          trigger: form.trigger,
          definition: JSON.stringify({
            steps: [
              { type: "trigger", config: { event: form.trigger } },
              { type: "condition", config: { always: true } },
              { type: "action", config: { type: "send_notification" } },
            ],
          }),
          status: "Active",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to create");
      }
      toast({ title: "Automation created", variant: "success" });
      setShowCreate(false);
      setForm({ name: "", trigger: "record_created", description: "" });
      window.location.reload();
    } catch (err) {
      toast({ title: err instanceof Error && err.message ? err.message : "Failed to create", variant: "error" });
    }
  };

  return (
    <div>
      <PageHeader
        title="Automation"
        description="Build workflows to automate repetitive tasks"
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Icon name="plus" size={15} /> New Automation
          </Button>
        }
      />

      {automations.length === 0 ? (
        <div className="card p-12 text-center">
          <Icon name="automation" size={40} className="text-ink-faint mx-auto mb-4" />
          <h3 className="h3">No automations yet</h3>
          <p className="text-sm text-ink-faint mt-1 mb-4">
            Create your first automation to streamline your workflows
          </p>
          <Button onClick={() => setShowCreate(true)}>Create Automation</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map((a) => {
            let trigger = "Unknown";
            try {
              const def = JSON.parse(a.definition || "{}");
              trigger = def.steps?.[0]?.config?.event || a.trigger || "Unknown";
            } catch {
              trigger = a.trigger || "Unknown";
            }

            return (
              <div
                key={a.id}
                className="card flex items-center gap-4 p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-subtle">
                  <Icon name="automation" size={20} className="text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{a.name}</p>
                  <p className="text-xs text-ink-faint mt-0.5">
                    Trigger: {trigger.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Visual workflow preview */}
                  <div className="hidden items-center gap-2 sm:flex">
                    <span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                      Trigger
                    </span>
                    <Icon name="chevron-down" size={12} className="text-ink-faint -rotate-90" />
                    <span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                      Condition
                    </span>
                    <Icon name="chevron-down" size={12} className="text-ink-faint -rotate-90" />
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                      Action
                    </span>
                  </div>
                  <Badge tone={a.status === "active" ? "green" : "yellow"}>
                    {a.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Automation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="e.g. Notify on new deal"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Select
            label="Trigger"
            value={form.trigger}
            onChange={(e) => setForm({ ...form, trigger: e.target.value })}
          >
            {TRIGGERS.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
          <Textarea
            label="Description (optional)"
            placeholder="What should this automation do?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
}
