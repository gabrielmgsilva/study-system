// src/lib/guards.ts
import 'server-only';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { AUTH_COOKIE_NAME, getUserIdFromToken, verifyJWT } from '@/lib/jwt';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthContext = {
  userId: number;
  email: string;
  role: 'user' | 'admin';
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the current user from the auth token cookie.
 * Returns `null` when the request is not authenticated.
 */
async function resolveUser(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const token = await verifyJWT(cookieStore.get(AUTH_COOKIE_NAME)?.value);
  if (!token) return null;

  const userId = getUserIdFromToken(token);
  if (!userId) return null;

  return {
    userId,
    email: token.email,
    role: token.role,
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
