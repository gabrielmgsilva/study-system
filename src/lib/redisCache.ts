import { getRedisClient } from './redis';

/**
 * Read-through cache helper.
 * Returns cached value if present, otherwise calls `fetcher`, caches the
 * result for `ttlSeconds`, and returns it.
 * If Redis is unavailable, falls back to `fetcher` directly — zero downtime.
 */
export async function cacheGet<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const client = getRedisClient();
  if (!client) return fetcher();

  try {
    const cached = await client.get(key);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }
  } catch {
    // Redis read failed — fall through to fetcher
  }

  const value = await fetcher();

  try {
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Redis write failed — value is still returned
  }

  return value;
}

/**
 * Invalidate one or more cache keys.
 * Fire-and-forget: errors are silently ignored.
 */
export function cacheInvalidate(...keys: string[]): void {
  const client = getRedisClient();
  if (!client || keys.length === 0) return;

  client.del(...keys).catch(() => {
    // Ignore — best-effort invalidation
  });
}

// Key builders
export function scoresKey(userId: number, moduleKey: string): string {
  return `study:user:${userId}:scores:${moduleKey}`;
}

export function usageKey(userId: number, licenseId: string): string {
  return `study:user:${userId}:usage:${licenseId}`;
}

export function analyticsKey(userId: number, moduleKey: string): string {
  return `study:user:${userId}:analytics:${moduleKey}`;
}
