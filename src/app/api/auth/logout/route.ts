import { NextResponse } from 'next/server';

import { clearAuthCookie } from '@/lib/jwt';

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true, redirectTo: new URL('/', req.url).toString() });
  clearAuthCookie(res);

  return res;
}
