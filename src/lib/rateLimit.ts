/**
 * In-memory sliding-window rate limiter.
 * No Redis dependency — suitable for single-instance / edge deployments.
 * Each key maps to a sorted list of request timestamps.
 */

type Window = {
  timestamps: number[];
};

const store = new Map<string, Window>();

// Prune entries older than maxAgeMs to prevent unbounded memory growth.
// Runs periodically rather than on every request.
let lastPrune = Date.now();
const PRUNE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function maybePrune(windowMs: number) {
  const now = Date.now();
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  for (const [key, window] of store.entries()) {
    window.timestamps = window.timestamps.filter((t) => now - t < windowMs);
    if (window.timestamps.length === 0) store.delete(key);
  }
}

/**
 * Check and record a request for a given key.
 *
 * @param key    Unique identifier (e.g. `"login:${ip}"`)
 * @param limit  Maximum number of requests allowed within `windowMs`
 * @param windowMs  Rolling window in milliseconds
 * @returns `{ allowed: boolean; remaining: number; resetAt: number }`
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  maybePrune(windowMs);

  const now = Date.now();
  const cutoff = now - windowMs;

  let window = store.get(key);
  if (!window) {
    window = { timestamps: [] };
    store.set(key, window);
  }

  // Drop timestamps outside the current window.
  window.timestamps = window.timestamps.filter((t) => t > cutoff);

  const count = window.timestamps.length;
  const resetAt = window.timestamps.length > 0 ? window.timestamps[0] + windowMs : now + windowMs;

  if (count >= limit) {
    return { allowed: false, remaining: 0, resetAt };
  }

  window.timestamps.push(now);
  return { allowed: true, remaining: limit - count - 1, resetAt };
}

/**
 * Extract the client IP from a Next.js Request.
 * Falls back to 'unknown' when headers are absent (local dev).
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}
