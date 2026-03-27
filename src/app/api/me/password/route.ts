import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { getCurrentSessionServer } from '@/lib/currentUserServer';

async function getUserIdOrNull() {
  const session = await getCurrentSessionServer();
  return session?.userId ?? null;
}

export async function POST(req: Request) {
  const userId = await getUserIdOrNull();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { currentPassword, newPassword } = await req.json().catch(() => ({}));

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ message: 'Missing payload.' }, { status: 400 });
  }

  const newPass = String(newPassword);
  if (newPass.length < 8) {
    return NextResponse.json(
      { message: 'Password must be at least 8 characters.' },
      { status: 400 },
    );
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { passwordHash: true },
  });
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const ok = await verifyPassword(String(currentPassword), user.passwordHash);
  if (!ok) {
    return NextResponse.json({ message: 'Current password is incorrect.' }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPass);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, lastPasswordChangeAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
