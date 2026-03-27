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

  const candidate = crypto
    .pbkdf2Sync(password, salt, iterations, PBKDF2_KEYLEN, digest as string)
    .toString('hex');

  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(candidate, 'hex');
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}
