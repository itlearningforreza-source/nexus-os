import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD") {
  const symbols: Record<string, string> = {
    USD: "$",
    IDR: "Rp",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    SGD: "S$",
  };
  const symbol = symbols[currency] || "$";
  if (currency === "IDR") {
    return symbol + Math.round(amount).toLocaleString("en-US");
  }
  return (
    symbol +
    amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  );
}

export function formatDate(isoStr?: string | null) {
  if (!isoStr) return "—";
  const d = new Date(isoStr.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime(isoStr?: string | null) {
  if (!isoStr) return "—";
  const d = new Date(isoStr.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function timeAgo(isoStr?: string | null) {
  if (!isoStr) return "—";
  const d = new Date(isoStr.replace(" ", "T") + "Z");
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function shortNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export function uid() {
  // Use crypto.randomUUID() for cryptographically secure IDs
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (should not happen in modern Node/browsers)
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8) +
    Math.random().toString(36).slice(2, 6)
  );
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const header = cols.map(escape).join(",");
  const body = rows
    .map((r) => cols.map((c) => escape(r[c])).join(","))
    .join("\n");
  return header + "\n" + body;
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const blob = new Blob(["\uFEFF" + toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
