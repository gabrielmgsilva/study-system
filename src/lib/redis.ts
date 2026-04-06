import Redis from 'ioredis';

let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redis) return redis;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.warn('[REDIS] connection error, falling back to DB:', err.message);
    });

    redis.connect().catch(() => {
      // Ignore — graceful fallback
    });

    return redis;
  } catch {
    return null;
  }
}

export { getRedisClient };
