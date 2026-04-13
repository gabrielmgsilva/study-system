import type { JWTPayload as JoseJWTPayload } from 'jose';
import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';
import type { NextResponse } from 'next/server';

export const AUTH_COOKIE_NAME = 'ameone_token';
export const AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 12;

export type AuthRole = 'user' | 'admin';

export type AuthTokenPayload = JoseJWTPayload & {
  sub: string;
  email: string;
  role: AuthRole;
};

const encoder = new TextEncoder();

export function requireAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('Missing AUTH_SECRET in environment.');
  }

  return secret;
}

function getJwtSecretKey() {
  return encoder.encode(requireAuthSecret());
}

export async function signJWT(input: {
  userId: number;
  email: string;
  role: AuthRole;
}) {
  const nowInSeconds = Math.floor(Date.now() / 1000);

  return new SignJWT({ email: input.email, role: input.role })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(String(input.userId))
    .setIssuedAt(nowInSeconds)
    .setExpirationTime(nowInSeconds + AUTH_TOKEN_TTL_SECONDS)
    .sign(getJwtSecretKey());
}

export async function verifyJWT(
  token: string | undefined | null,
): Promise<AuthTokenPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify<AuthTokenPayload>(token, getJwtSecretKey(), {
      algorithms: ['HS256'],
    });

    if (!payload.sub || !payload.email) {
      return null;
    }

    if (payload.role !== 'user' && payload.role !== 'admin') {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: AUTH_TOKEN_TTL_SECONDS,
    expires: new Date(Date.now() + AUTH_TOKEN_TTL_SECONDS * 1000),
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: new Date(0),
    maxAge: 0,
  });
}

export function getUserIdFromToken(payload: Pick<AuthTokenPayload, 'sub'>) {
  const userId = Number(payload.sub);
  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  return userId;
}