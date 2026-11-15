"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button, Spinner } from "@/components/ui/primitive";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      toast({ title: "Welcome back", description: "Signed in successfully", variant: "success" });
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-zinc-950 p-12 lg:flex">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
            <Icon name="layers" size={20} />
          </div>
          <span className="text-[15px] font-semibold text-white">Nexus OS</span>
        </div>
        <div className="relative z-10">
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight text-white">
            One platform.
            <br />
            One workspace.
            <br />
            <span className="text-white/50">Your entire company operating system.</span>
          </h1>
          <div className="mt-10 space-y-4">
            {[
              "Unified CRM, projects, finance, HR & more",
              "One search, one AI, one automation engine",
              "Enterprise-grade security & permissions",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm text-white/70">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                  <Icon name="check" size={12} className="text-white/80" />
                </span>
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs text-white/40">© 2025 Nexus OS, Inc. All rights reserved.</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-10 inline-flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
              <Icon name="layers" size={20} />
            </div>
            <span className="text-[15px] font-semibold">Nexus OS</span>
          </Link>

          <h2 className="text-[28px] font-semibold tracking-tight">Welcome back</h2>
          <p className="mt-1.5 text-sm text-ink-soft">Sign in to your workspace to continue.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label mb-0">Password</label>
                <button type="button" className="text-xs font-medium text-accent hover:underline">
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600 dark:bg-red-500/10 dark:text-red-400">
                <Icon name="alert" size={14} /> {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner /> : <>Sign in <Icon name="chevron-right" size={14} /></>}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">or</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <button
            onClick={() => { setEmail("demo@example.com"); setPassword("demo123"); setTimeout(() => submit(), 50); }}
            className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line-strong px-4 py-4 text-sm transition-all hover:border-accent hover:bg-accent-subtle"
          >
            <span className="font-medium text-ink">Explore the demo workspace</span>
            <span className="text-xs text-ink-faint">demo@example.com · demo123</span>
          </button>

          <p className="mt-8 text-center text-[13px] text-ink-soft">
            New to Nexus OS?{" "}
            <Link href="/register" className="font-medium text-accent hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}