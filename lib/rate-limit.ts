// Lightweight in-memory rate limiter keyed by IP (and optionally a secondary key).
// Suitable for a single-node deployment. For multi-node, replace with a shared store.
const buckets = new Map<string, number[]>();
const MAX_BUCKETS = 20_000;
let lastPrune = Date.now();
const PRUNE_INTERVAL_MS = 5 * 60_000;

export function rateLimit(ip: string, opts?: { limit?: number; windowMs?: number; key?: string }) {
  const limit = opts?.limit ?? 10;
  const windowMs = opts?.windowMs ?? 60_000;
  const key = `${ip}:${opts?.key || "default"}`;
  const now = Date.now();

  // Periodically drop empty/stale buckets to bound memory. Cheap amortized check.
  if (now - lastPrune > PRUNE_INTERVAL_MS) {
    lastPrune = now;
    buckets.forEach((times, k) => {
      const active = times.filter((t) => now - t < windowMs);
      if (active.length === 0) buckets.delete(k);
    });
    if (buckets.size > MAX_BUCKETS) buckets.clear();
  }

  const recent = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    return { allowed: false, retryAfterMs: windowMs - (now - recent[0]) };
  }
  recent.push(now);
  buckets.set(key, recent);
  return { allowed: true, retryAfterMs: 0 };
}

// Testable introspection (not used at runtime).
export function _rateLimitStats() {
  let active = 0;
  const now = Date.now();
  buckets.forEach((times) => {
    active += times.filter((t) => now - t < 60_000).length;
  });
  return { buckets: buckets.size, active };
}
