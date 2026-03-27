import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { AUTH_COOKIE_NAME, getUserIdFromToken, verifyJWT } from '@/lib/jwt';

export async function GET(req: Request) {
  void req;

  const raw = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const token = await verifyJWT(raw);
  const userId = token ? getUserIdFromToken(token) : null;

  if (!token || !userId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: userId,
      email: token.email,
      role: token.role,
    },
  });
}
