"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Button, Input, Spinner } from "@/components/ui/primitive";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";

type Email = {
  id: string;
  folder: string;
  from_name?: string;
  from_email?: string;
  to_email?: string;
  subject?: string;
  body?: string;
  read: number;
  starred: number;
  created_at: string;
};

const FOLDERS = [
  { id: "inbox", label: "Inbox", icon: "inbox" },
  { id: "starred", label: "Starred", icon: "star" },
  { id: "sent", label: "Sent", icon: "send" },
  { id: "drafts", label: "Drafts", icon: "file" },
  { id: "archive", label: "Archive", icon: "documents" },
  { id: "trash", label: "Trash", icon: "x" },
];

function timeFormat(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso.replace(" ", "T") + (iso.includes("Z") ? "" : "Z"));
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function EmailClient({ user }: { user: any }) {
  const toast = useToast();
  const [folder, setFolder] = React.useState("inbox");
  const [emails, setEmails] = React.useState<Email[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [composeOpen, setComposeOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [draftForm, setDraftForm] = React.useState({ to: "", subject: "", body: "" });

  const load = React.useCallback(async (f: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/emails?folder=${f}`);
      const data = await res.json();
      if (res.ok) {
        setEmails(data.emails || []);
      } else {
        setEmails([]);
      }
    } catch {
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    setSelectedId(null);
    load(folder);
  }, [folder, load]);

  const selected = emails.find((e) => e.id === selectedId);

  const markRead = async (email: Email) => {
    if (email.read) return;
    const prev = email.read;
    setEmails((prevEmails) => prevEmails.map((e) => (e.id === email.id ? { ...e, read: 1 } : e)));
    try {
      const res = await fetch(`/api/emails?id=${email.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: 1 }),
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      setEmails((prevEmails) => prevEmails.map((e) => (e.id === email.id ? { ...e, read: prev } : e)));
    }
  };

  const toggleStar = async (email: Email) => {
    const starred = email.starred ? 0 : 1;
    const prev = email.starred;
    setEmails((prevEmails) => prevEmails.map((e) => (e.id === email.id ? { ...e, starred } : e)));
    try {
      const res = await fetch(`/api/emails?id=${email.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred }),
      });
      if (!res.ok) throw new Error("failed");
    } catch {
      setEmails((prevEmails) => prevEmails.map((e) => (e.id === email.id ? { ...e, starred: prev } : e)));
      toast({ title: "Could not update email", variant: "error" });
    }
  };

  const moveTo = async (email: Email, target: string) => {
    await fetch(`/api/emails?id=${email.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: target }),
    });
    if (target === "trash") {
      toast({ title: "Email moved to trash", variant: "success" });
    }
    if (selectedId === email.id) setSelectedId(null);
    load(folder);
  };

  const archived = async (email: Email) => moveTo(email, "archive");

  const trash = async (email: Email) => moveTo(email, "trash");

  const send = async (asDraft: boolean) => {
    if (!asDraft && !draftForm.subject.trim()) {
      toast({ title: "Subject is required", variant: "error" });
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draftForm, draft: asDraft }),
      });
      if (!res.ok) {
        throw new Error("Failed to send");
      }
      toast({ title: asDraft ? "Draft saved" : "Email sent", variant: "success" });
      setComposeOpen(false);
      setDraftForm({ to: "", subject: "", body: "" });
      load(asDraft ? "drafts" : "sent");
    } catch {
      toast({ title: "Failed to send email", variant: "error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Email"
        description="Manage your inbox"
        actions={
          <Button onClick={() => setComposeOpen(true)}>
            <Icon name="plus" size={15} /> Compose
          </Button>
        }
      />

      {composeOpen && (
        <div className="card mb-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="h3">{draftForm.subject ? "Compose" : "New Message"}</h3>
            <Button variant="ghost" size="sm" onClick={() => setComposeOpen(false)}>
              <Icon name="x" size={16} />
            </Button>
          </div>
          <div className="space-y-3">
            <Input
              label="To"
              placeholder="recipient@example.com"
              value={draftForm.to}
              onChange={(e) => setDraftForm({ ...draftForm, to: e.target.value })}
            />
            <Input
              label="Subject"
              placeholder="Subject"
              value={draftForm.subject}
              onChange={(e) => setDraftForm({ ...draftForm, subject: e.target.value })}
            />
            <div>
              <label className="text-[13px] font-medium text-ink-soft">Message</label>
              <textarea
                className="input min-h-[140px] w-full resize-y py-2"
                placeholder="Write your message..."
                value={draftForm.body}
                onChange={(e) => setDraftForm({ ...draftForm, body: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => send(false)} disabled={sending}>
                {sending ? <Spinner /> : <><Icon name="send" size={14} /> Send</>}
              </Button>
              <Button variant="secondary" onClick={() => send(true)} disabled={sending}>
                Save Draft
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-14rem)] rounded-2xl border border-line bg-canvas-raised overflow-hidden">
        {/* Folder sidebar */}
        <div className="w-44 shrink-0 border-r border-line p-3 space-y-1">
          {FOLDERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFolder(f.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                folder === f.id ? "bg-accent-subtle text-ink" : "text-ink-soft hover:bg-subtle"
              )}
            >
              <Icon name={f.icon as any} size={16} className={folder === f.id ? "text-accent" : "text-ink-faint"} />
              <span className="flex-1 text-left">{f.label}</span>
            </button>
          ))}
        </div>

        {/* Email list */}
        <div className={cn("border-r border-line overflow-y-auto", selected ? "w-80 hidden lg:block" : "flex-1")}>
          {loading ? (
            <div className="flex items-center justify-center p-10">
              <Spinner />
            </div>
          ) : emails.length === 0 ? (
            <div className="p-10 text-center">
              <Icon name="inbox" size={40} className="text-ink-faint mx-auto mb-3" />
              <p className="text-sm text-ink-faint">No messages in this folder</p>
            </div>
          ) : (
            emails.map((e) => (
              <button
                key={e.id}
                onClick={() => { setSelectedId(e.id); markRead(e); }}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left border-b border-line transition-colors",
                  selectedId === e.id && "bg-accent-subtle",
                  !e.read && "bg-accent-subtle/15"
                )}
              >
                <Avatar name={e.from_name || e.from_email || "?"} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={cn("text-sm truncate", !e.read && "font-semibold")}>
                      {e.from_name || e.from_email || "Unknown"}
                    </p>
                    <span className="text-[11px] text-ink-faint whitespace-nowrap shrink-0">
                      {timeFormat(e.created_at)}
                    </span>
                  </div>
                  <p className={cn("text-sm truncate", !e.read && "font-medium")}>
                    {e.subject || "(no subject)"}
                  </p>
                  <p className="text-xs text-ink-faint truncate mt-0.5 whitespace-pre-line">
                    {e.body || ""}
                  </p>
                </div>
                {!!e.starred && (
                  <Icon name="star" size={14} className="text-amber-500 shrink-0" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Email content */}
        {selected ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{selected.subject || "(no subject)"}</h2>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleStar(selected)}>
                  <Icon name="star" size={16} className={selected.starred ? "text-amber-500" : ""} />
                </Button>
                {selected.folder !== "archive" && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => archived(selected)}>
                    <Icon name="documents" size={16} />
                  </Button>
                )}
                {selected.folder !== "trash" && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => trash(selected)}>
                    <Icon name="x" size={16} />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <Avatar name={selected.from_name || selected.from_email || "?"} />
              <div>
                <p className="text-sm font-medium">{selected.from_name || "Unknown"}</p>
                <p className="text-xs text-ink-faint">{selected.from_email}</p>
              </div>
              <span className="ml-auto text-xs text-ink-faint">{timeFormat(selected.created_at)}</span>
            </div>
            <div className="prose prose-sm max-w-none text-ink-soft leading-relaxed whitespace-pre-line">
              <p>{selected.body || "(no body)"}</p>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="hidden lg:flex flex-1 items-center justify-center">
              <div className="text-center">
                <Icon name="inbox" size={48} className="text-ink-faint mx-auto mb-3" />
                <p className="text-sm text-ink-faint">Select an email to read</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
