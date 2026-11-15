"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";

type Toast = {
  id: number;
  title: string;
  description?: string;
  variant?: "success" | "error" | "info";
};

const ToastContext = React.createContext<{
  toast: (t: Omit<Toast, "id">) => void;
} | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [mounted, setMounted] = React.useState(false);
  const idRef = React.useRef(0);

  // Only render the portal after hydration. This avoids a server/client HTML
  // mismatch when ToastProvider lives in a server-rendered layout.
  React.useEffect(() => setMounted(true), []);

  const toast = React.useCallback((t: Omit<Toast, "id">) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 3500);
  }, []);

  const icons: Record<string, IconName> = {
    success: "check-circle",
    error: "alert",
    info: "info",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border bg-canvas-raised px-4 py-3 shadow-overlay animate-toast-in w-80",
                  t.variant === "success" && "border-emerald-200 dark:border-emerald-500/20",
                  t.variant === "error" && "border-red-200 dark:border-red-500/20",
                  t.variant === "info" && "border-line"
                )}
              >
                <Icon
                  name={icons[t.variant || "info"]}
                  size={18}
                  className={cn(
                    "mt-0.5",
                    t.variant === "success" && "text-emerald-500",
                    t.variant === "error" && "text-red-500",
                    t.variant === "info" && "text-accent"
                  )}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 text-[13px] text-ink-soft">{t.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
