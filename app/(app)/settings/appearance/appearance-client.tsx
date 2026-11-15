"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";

const themes = [
  { id: "light", label: "Light", icon: "☀️" },
  { id: "dark", label: "Dark", icon: "🌙" },
  { id: "system", label: "System", icon: "💻" },
];

const languages = [
  { id: "en", label: "English" },
  { id: "id", label: "Bahasa Indonesia" },
];

const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Singapore",
  "Asia/Jakarta",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export function AppearanceSettingsClient({ user }: { user: any }) {
  const toast = useToast();
  const [theme, setTheme] = React.useState(user?.theme || "system");
  const [language, setLanguage] = React.useState(user?.locale || "en");
  const [timezone, setTimezone] = React.useState(user?.timezone || "Asia/Jakarta");

  const persist = async (patch: any, message: string) => {
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      toast({ title: res.ok ? message : "Failed to save preference", variant: res.ok ? "success" : "error" });
    } catch {
      toast({ title: "Failed to save preference", variant: "error" });
    }
  };

  const handleThemeChange = (t: string) => {
    setTheme(t);
    localStorage.setItem("nexus_theme", t);
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else if (t === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
    persist({ theme: t }, `Theme set to ${t}`);
  };

  return (
    <div>
      <PageHeader
        title="Appearance"
        description="Customize how Nexus OS looks"
      />

      <div className="card max-w-2xl p-6 mb-6">
        <h3 className="h3 mb-4">Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => handleThemeChange(t.id)}
              className={`rounded-xl border-2 p-4 text-center transition-all ${
                theme === t.id
                  ? "border-accent bg-accent-subtle"
                  : "border-line hover:border-line-strong"
              }`}
            >
              <span className="text-2xl">{t.icon}</span>
              <p className="mt-2 text-sm font-medium">{t.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="card max-w-2xl p-6 mb-6">
        <h3 className="h3 mb-4">Language</h3>
        <div className="space-y-2">
          {languages.map((l) => (
            <label
              key={l.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                language === l.id
                  ? "border-accent bg-accent-subtle"
                  : "border-line hover:border-line-strong"
              }`}
            >
              <input
                type="radio"
                name="language"
                checked={language === l.id}
                onChange={() => {
                  setLanguage(l.id);
                  persist({ locale: l.id }, `Language set to ${l.label}`);
                }}
                className="accent-accent"
              />
              <span className="text-sm font-medium">{l.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="card max-w-2xl p-6">
        <h3 className="h3 mb-4">Timezone</h3>
        <select
          value={timezone}
          onChange={(e) => {
            setTimezone(e.target.value);
            persist({ timezone: e.target.value }, "Timezone updated");
          }}
          className="input w-full max-w-md"
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
