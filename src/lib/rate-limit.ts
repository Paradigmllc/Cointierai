/**
 * In-memory token bucket rate limiter for /api/* endpoints.
 *
 * Trade-off: in-memory works per instance only (no Redis). For a single
 * Coolify container that's fine. When we scale to N instances, swap the
 * Map to Upstash Redis without changing the call site.
 *
 * Per-IP defaults: 60 tokens / 60 s window. Each endpoint can override.
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();
// Periodic cleanup so the Map doesn't grow unbounded.
let lastSweep = Date.now();
function maybeSweep() {
  if (Date.now() - lastSweep < 5 * 60_000) return;
  lastSweep = Date.now();
  const cutoff = Date.now() - 10 * 60_000;
  for (const [k, b] of buckets) {
    if (b.lastRefill < cutoff) buckets.delete(k);
  }
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export function rateLimit(
  key: string,
  opts: { capacity?: number; refillPerSecond?: number } = {},
): RateLimitDecision {
  const capacity = opts.capacity ?? 60;
  const refillPerSecond = opts.refillPerSecond ?? 1; // 1 token/s → ~60 / minute
  maybeSweep();
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: capacity, lastRefill: now };
  const elapsedSec = (now - b.lastRefill) / 1000;
  b.tokens = Math.min(capacity, b.tokens + elapsedSec * refillPerSecond);
  b.lastRefill = now;
  if (b.tokens >= 1) {
    b.tokens -= 1;
    buckets.set(key, b);
    return { allowed: true, remaining: Math.floor(b.tokens), resetMs: Math.ceil((1 - b.tokens) * 1000 / refillPerSecond) };
  }
  buckets.set(key, b);
  return { allowed: false, remaining: 0, resetMs: Math.ceil((1 - b.tokens) * 1000 / refillPerSecond) };
}

/** Convenience wrapper for Next route handlers. */
export function getClientKey(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '';
  return fwd.split(',')[0].trim() || 'unknown';
}
