import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signSessionId, hashPassword, needsRehash } from '@/lib/auth';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));

  const normalizedEmail = String(body?.email ?? '').trim().toLowerCase();
  const pwd = String(body?.password ?? '');

  if (!normalizedEmail || !pwd) {
    return NextResponse.json(
      { message: 'Email and password are required.' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Não revelar se user existe ou não
  if (!user || !user.passwordHash) {
    return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
  }

  const ok = await verifyPassword(pwd, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
  }

  // Transparent migration: re-hash legacy PBKDF2 passwords with bcrypt
  if (needsRehash(user.passwordHash)) {
    const newHash = await hashPassword(pwd);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });
  }

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12);

  const session = await prisma.session.create({
    data: { userId: user.id, expiresAt },
  });

  const cookieValue = signSessionId(session.id);

  const res = NextResponse.json({ ok: true });

  res.cookies.set('ameone_session', cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
    maxAge: 60 * 60 * 12, // 12h
  });

  return res;
}
