import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL('/', req.url));

  // delete cookie
  res.cookies.set('ameone_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });

  return res;
}
