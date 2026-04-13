import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`reset-password:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ message: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const { token, newPassword } = await req.json().catch(() => ({}));
  const t = String(token || '').trim();
  const p = String(newPassword || '');

  if (!t || !p) {
    return NextResponse.json({ message: 'Missing payload.' }, { status: 400 });
  }

  if (p.length < 8) {
    return NextResponse.json({ message: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const row = await prisma.passwordResetToken.findUnique({
    where: { token: t },
    select: { id: true, userId: true, expiresAt: true, usedAt: true, deletedAt: true },
  });

  if (!row || row.deletedAt || row.usedAt || row.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { id: row.userId, deletedAt: null },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 400 });
  }

  const newHash = await hashPassword(p);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash: newHash, lastPasswordChangeAt: new Date() },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
