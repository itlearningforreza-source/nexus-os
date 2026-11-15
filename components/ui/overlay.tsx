"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full rounded-2xl bg-canvas-raised shadow-overlay animate-scale-in flex flex-col max-h-[90vh]",
          sizes[size]
        )}
        role="dialog"
        aria-modal="true"
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
            <div>
              {title && <h2 className="h2">{title}</h2>}
              {description && <p className="caption mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-faint hover:bg-subtle hover:text-ink transition-colors"
              aria-label="Close"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = "right",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  side?: "right" | "left";
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div
        className={cn(
          "absolute top-0 bottom-0 w-full max-w-md bg-canvas-raised shadow-overlay animate-fade-in flex flex-col",
          side === "right" ? "right-0" : "left-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="h2">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-faint hover:bg-subtle transition-colors" aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function Dropdown({
  trigger,
  children,
  align = "right",
  width = "w-56",
}: {
  trigger: React.ReactNode;
  children:
    | React.ReactNode
    | ((close: () => void) => React.ReactNode);
  align?: "left" | "right";
  width?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <span onClick={() => setOpen((o) => !o)} className="inline-flex">
        {trigger}
      </span>
      {open && (
        <>
          <div
            className={cn(
              "absolute z-50 mt-1.5 rounded-xl border border-line bg-canvas-raised shadow-pop animate-scale-in py-1.5",
              width,
              align === "right" ? "right-0" : "left-0"
            )}
          >
            {typeof children === "function" ? children(() => setOpen(false)) : children}
          </div>
        </>
      )}
    </div>
  );
}

export function DropdownItem({
  icon,
  onClick,
  children,
  danger,
}: {
  icon?: IconName;
  onClick?: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors",
        danger ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10" : "text-ink hover:bg-subtle"
      )}
    >
      {icon && <Icon name={icon} size={15} className="text-ink-faint" />}
      {children}
    </button>
  );
}

export function MenuDivider() {
  return <div className="my-1.5 h-px bg-line" />;
}

export function Tooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-pop transition-opacity group-hover:opacity-100 z-50">
        {label}
      </span>
    </span>
  );
}
