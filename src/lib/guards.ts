// src/lib/guards.ts
import 'server-only';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { verifySignedSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthContext = {
  userId: string;
  email: string;
  role: 'user' | 'admin';
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the current user from the session cookie.
 * Returns `null` when the request is not authenticated.
 */
async function resolveUser(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get('ameone_session')?.value;
  const sessionId = verifySignedSession(raw);
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      expiresAt: true,
      user: { select: { id: true, email: true, role: true } },
    },
  });

  if (!session || session.expiresAt.getTime() < Date.now()) return null;

  return {
    userId: session.user.id,
    email: session.user.email,
    role: session.user.role,
  };
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/**
 * Require an authenticated user. Returns `AuthContext` on success or a 401
 * `NextResponse` that the caller must return from the route handler.
 */
export async function requireAuth(): Promise<AuthContext | NextResponse> {
  const ctx = await resolveUser();
  if (!ctx) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  return ctx;
}

/**
 * Require an admin user. Returns `AuthContext` on success or a 401/403
 * `NextResponse`.
 */
export async function requireAdmin(): Promise<AuthContext | NextResponse> {
  const result = await requireAuth();
  if (result instanceof NextResponse) return result;

  if (result.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  return result;
}

/**
 * Type guard — check whether a guard result is an error response.
 */
export function isAuthError(
  result: AuthContext | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}
