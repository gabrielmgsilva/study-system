import crypto from 'crypto';

const ITERATIONS = 120_000;
const KEYLEN = 32;
const DIGEST = 'sha256';

export function requireAuthSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('Missing AUTH_SECRET in environment.');
  return s;
}

/**
 * Format:
 * pbkdf2$sha256$120000$saltHex$hashHex
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST)
    .toString('hex');
  return `pbkdf2$${DIGEST}$${ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  // Support both "pbkdf2$sha256$..." and any accidental extra separators (defensive)
  const parts = stored.split('$').filter(Boolean);

  // Expected: [ 'pbkdf2', digest, iterations, salt, hash ]
  if (parts.length !== 5 || parts[0] !== 'pbkdf2') return false;

  const digest = parts[1];
  const iterations = Number(parts[2]);
  const salt = parts[3];
  const hash = parts[4];

  if (!digest || !iterations || !salt || !hash) return false;

  const candidate = crypto
    .pbkdf2Sync(password, salt, iterations, KEYLEN, digest as any)
    .toString('hex');

  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(candidate, 'hex');
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

export function signSessionId(sessionId: string): string {
  const secret = requireAuthSecret();
  const sig = crypto.createHmac('sha256', secret).update(sessionId).digest('hex');
  return `${sessionId}.${sig}`;
}

export function verifySignedSession(cookieValue: string | undefined | null): string | null {
  if (!cookieValue) return null;
  const [sessionId, sig] = cookieValue.split('.');
  if (!sessionId || !sig) return null;

  const secret = requireAuthSecret();
  const expected = crypto.createHmac('sha256', secret).update(sessionId).digest('hex');

  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  return sessionId;
}
