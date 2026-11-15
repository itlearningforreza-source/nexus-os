"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/primitive";

const suggestedPrompts = [
  "Analyze sales pipeline",
  "Summarize today's meetings",
  "Find overdue projects",
  "Find contracts expiring soon",
  "Analyze customer churn risk",
  "Create weekly report",
  "Show top performing employees",
  "Review open support tickets",
];

export function AiClient({
  history,
  user,
}: {
  history: any[];
  user: any;
}) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [messages, setMessages] = React.useState<any[]>(history);
  const [input, setInput] = React.useState(initialQuery);
  const [loading, setLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    if (initialQuery) handleSend(initialQuery);
  }, []);

  const handleSend = async (text?: string) => {
    const query = text || input.trim();
    if (!query || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });
      const data = await res.json();
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I couldn't process that request.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          created_at: new Date().toISOString(),
        },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Header */}
      <div className="border-b border-line px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-purple-500">
            <Icon name="sparkles" size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">AI Assistant</h1>
            <p className="text-xs text-ink-faint">
              Ask anything about your business
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-purple-500 mb-6">
              <Icon name="sparkles" size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2">How can I help?</h2>
            <p className="text-sm text-ink-soft mb-8 max-w-md text-center">
              I can analyze your CRM, finance, projects, and more. Try asking
              one of the suggested prompts below.
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
              {suggestedPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="rounded-xl border border-line bg-canvas-raised p-3 text-left text-sm text-ink-soft transition-all hover:border-accent hover:text-ink hover:shadow-card"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex gap-3",
                  m.role === "user" && "flex-row-reverse"
                )}
              >
                {m.role === "assistant" ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-purple-500">
                    <Icon name="sparkles" size={16} className="text-white" />
                  </div>
                ) : (
                  <Avatar
                    name={user?.name || "U"}
                    color={user?.avatar_color}
                    size="sm"
                  />
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-accent text-white"
                      : "bg-canvas-raised border border-line"
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-purple-500">
                  <Icon name="sparkles" size={16} className="text-white" />
                </div>
                <div className="rounded-2xl bg-canvas-raised border border-line px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-ink-faint animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-ink-faint animate-bounce [animation-delay:0.1s]" />
                    <span className="h-2 w-2 rounded-full bg-ink-faint animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-line px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask anything about your business..."
            className="input flex-1"
            disabled={loading}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
          >
            <Icon name="send" size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
