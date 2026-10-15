import "server-only";

/**
 * Fixed-window rate limiter. V1: in-memory per instance (best effort).
 * Production: replace with a shared store (e.g. Upstash/Supabase) behind the same interface.
 */
export interface RateLimiter {
  allow(key: string): boolean;
}

export function createMemoryRateLimiter(limit: number, windowMs: number, now: () => number = Date.now): RateLimiter {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return {
    allow(key) {
      const t = now();
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= t) {
        hits.set(key, { count: 1, resetAt: t + windowMs });
        return true;
      }
      entry.count += 1;
      return entry.count <= limit;
    },
  };
}
