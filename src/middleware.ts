import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { ROUTES } from '@/lib/routes';

async function verifySignedCookie(value: string | undefined): Promise<boolean> {
  if (!value) return false;

  const v = value.trim();
  const [sessionId, sigHex] = v.split('.');
  if (!sessionId || !sigHex) return false;

  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const expected = await crypto.subtle.sign('HMAC', key, enc.encode(sessionId));
  const expectedHex = Array.from(new Uint8Array(expected))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return expectedHex === sigHex;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const cookie = req.cookies.get('ameone_session')?.value;
  const hasValidSession = await verifySignedCookie(cookie);

  const isPrivate = pathname.startsWith('/app') || pathname.startsWith('/admin');
  const isAuth = pathname.startsWith('/auth');

  // 🔒 Protect private areas
  if (isPrivate && !hasValidSession) {
    const url = req.nextUrl.clone();
    url.pathname = ROUTES.login;

    // keep where user wanted to go (optional but useful)
    const next = `${req.nextUrl.pathname}${req.nextUrl.search || ''}`;
    url.searchParams.set('next', next);

    return NextResponse.redirect(url);
  }

  // 🔁 If logged in, avoid auth pages (but allow landing "/")
  if (isAuth && hasValidSession) {
    const url = req.nextUrl.clone();
    url.pathname = ROUTES.appHome;
    url.search = '';
    return NextResponse.redirect(url);
  }

  // ✅ Landing "/" is always accessible (logged in or not)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
