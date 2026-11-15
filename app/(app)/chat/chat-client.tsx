"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/primitive";
import { PageHeader } from "@/components/ui/page";

export function ChatClient({
  conversations,
  users,
  user,
}: {
  conversations: any[];
  users: any[];
  user: any;
}) {
  const [activeConv, setActiveConv] = React.useState<string | null>(
    conversations[0]?.id || null
  );
  const [messages, setMessages] = React.useState<any[]>([]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConv);

  React.useEffect(() => {
    if (!activeConv) return;
    fetch(`/api/chat?conversation_id=${activeConv}`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []))
      .catch(() => {});
  }, [activeConv]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: activeConv,
          body: input.trim(),
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
      setInput("");
    } catch {}
    setSending(false);
  };

  const getConvName = (c: any) => {
    if (c.name) return c.name;
    return c.kind === "dm" ? "Direct Message" : "Channel";
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <div className="w-72 shrink-0 border-r border-line flex flex-col">
        <div className="p-4 border-b border-line">
          <div className="flex items-center justify-between mb-3">
            <h2 className="h2">Chat</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Icon name="plus" size={16} />
            </Button>
          </div>
          <div className="relative">
            <Icon
              name="search"
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              placeholder="Search conversations..."
              className="input pl-9 py-1.5 text-[13px]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <p className="px-2 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">
            Channels
          </p>
          {conversations
            .filter((c) => c.kind === "channel")
            .map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConv(c.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors",
                  activeConv === c.id
                    ? "bg-accent-subtle text-ink"
                    : "text-ink-soft hover:bg-subtle"
                )}
              >
                <span className="text-ink-faint">#</span>
                <span className="truncate flex-1">{c.name || "general"}</span>
                {(c.unread_count || 0) > 0 && (
                  <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {c.unread_count}
                  </span>
                )}
              </button>
            ))}

          <p className="px-2 pb-1 pt-4 text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">
            Direct Messages
          </p>
          {conversations
            .filter((c) => c.kind === "dm")
            .map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConv(c.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors",
                  activeConv === c.id
                    ? "bg-accent-subtle text-ink"
                    : "text-ink-soft hover:bg-subtle"
                )}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="truncate flex-1">
                  {c.name || "Direct Message"}
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-col flex-1">
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-line px-5 py-3">
              <span className="text-ink-faint text-lg">#</span>
              <div>
                <p className="text-sm font-semibold">
                  {getConvName(activeConversation)}
                </p>
                <p className="text-xs text-ink-faint">
                  {conversations.length} members
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Icon
                    name="chat"
                    size={40}
                    className="text-ink-faint mb-3"
                  />
                  <p className="text-sm text-ink-faint">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="flex gap-3">
                    <Avatar
                      name={m.user_name || "U"}
                      color={m.avatar_color}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium">
                          {m.user_name || "Unknown"}
                        </span>
                        <span className="text-[11px] text-ink-faint">
                          {m.created_at
                            ? new Date(m.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                      <p className="text-[13px] text-ink-soft leading-relaxed mt-0.5">
                        {m.body}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-line px-5 py-3">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={`Message #${getConvName(activeConversation)}...`}
                  className="input flex-1"
                  disabled={sending}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  size="sm"
                >
                  <Icon name="send" size={15} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Icon name="chat" size={48} className="text-ink-faint mb-4" />
            <h3 className="h3">Select a conversation</h3>
            <p className="text-sm text-ink-faint mt-1">
              Choose a channel or direct message to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
