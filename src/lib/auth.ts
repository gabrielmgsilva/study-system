import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// bcrypt (new default)
// ---------------------------------------------------------------------------

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a stored hash.
 * Supports both bcrypt (new) and PBKDF2 (legacy) formats.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  // Legacy PBKDF2 format: pbkdf2$sha256$120000$salt$hash
  if (stored.startsWith('pbkdf2$')) {
    return verifyPbkdf2Password(password, stored);
  }

  // bcrypt format: $2a$... or $2b$...
  return bcrypt.compare(password, stored);
}

/**
 * Check whether a stored hash is in the legacy PBKDF2 format and should be
 * re-hashed with bcrypt on the next successful login.
 */
export function needsRehash(stored: string): boolean {
  return stored.startsWith('pbkdf2$');
}

// ---------------------------------------------------------------------------
// PBKDF2 legacy support (read-only, for migration)
// ---------------------------------------------------------------------------

const PBKDF2_KEYLEN = 32;

function verifyPbkdf2Password(password: string, stored: string): boolean {
  const parts = stored.split('$').filter(Boolean);
  if (parts.length !== 5 || parts[0] !== 'pbkdf2') return false;

  const digest = parts[1];
  const iterations = Number(parts[2]);
  const salt = parts[3];
  const hash = parts[4];

  if (!digest || !iterations || !salt || !hash) return false;

  // Only allow known digest algorithms
  const allowedDigests = ['sha256', 'sha512', 'sha1'];
  if (!allowedDigests.includes(digest)) return false;

  const candidate = crypto
    .pbkdf2Sync(password, salt, iterations, PBKDF2_KEYLEN, digest)
    .toString('hex');

  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(candidate, 'hex');
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// Session signing (HMAC-SHA256)
// ---------------------------------------------------------------------------

export function requireAuthSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('Missing AUTH_SECRET in environment.');
  return s;
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
