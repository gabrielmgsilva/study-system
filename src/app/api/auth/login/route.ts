import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, needsRehash, verifyPassword } from '@/lib/auth';
import { setAuthCookie, signJWT } from '@/lib/jwt';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ message: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({} as any));

  const normalizedEmail = String(body?.email ?? '').trim().toLowerCase();
  const pwd = String(body?.password ?? '');

  if (!normalizedEmail || !pwd) {
    return NextResponse.json(
      { message: 'Email and password are required.' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail, deletedAt: null },
  });

  // Não revelar se user existe ou não
  if (!user || user.deletedAt || !user.passwordHash) {
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

  const cookieValue = await signJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const res = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      role: user.role,
    },
  });
  setAuthCookie(res, cookieValue);

  return res;
}
