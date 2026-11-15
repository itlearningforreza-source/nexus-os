"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button, Spinner } from "@/components/ui/primitive";
import { useToast } from "@/components/ui/toast";

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
    organization: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      toast({ title: "Workspace created", description: "Welcome to Nexus OS!", variant: "success" });
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 inline-flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
            <Icon name="layers" size={20} />
          </div>
          <span className="text-[15px] font-semibold">Nexus OS</span>
        </Link>
        <h2 className="text-[28px] font-semibold tracking-tight">Create your workspace</h2>
        <p className="mt-1.5 text-sm text-ink-soft">Set up your company operating system in minutes.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="label">Your name</label>
            <input className="input" placeholder="Alex Rivera" value={form.name} onChange={set("name")} required />
          </div>
          <div>
            <label className="label">Company name</label>
            <input className="input" placeholder="Acme Corporation" value={form.organization} onChange={set("organization")} required />
          </div>
          <div>
            <label className="label">Work email</label>
            <input type="email" className="input" placeholder="you@company.com" value={form.email} onChange={set("email")} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" className="input" placeholder="At least 6 characters" value={form.password} onChange={set("password")} required minLength={6} />
          </div>
          {error && (
            <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <Icon name="alert" size={14} /> {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Spinner /> : <>Create workspace</>}
          </Button>
        </form>
        <p className="mt-6 text-center text-[13px] text-ink-soft">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}