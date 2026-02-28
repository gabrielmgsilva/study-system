import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { prisma } from '@/lib/prisma';
import { verifySignedSession } from '@/lib/auth';

async function getUserIdOrThrow() {
  const cookie = (await cookies()).get('ameone_session')?.value;
  const sessionId = verifySignedSession(cookie);
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  return session.userId;
}

export async function GET() {
  const userId = await getUserIdOrThrow();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
      termsAcceptedAt: true,
      termsVersion: true,
      lastPasswordChangeAt: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}

export async function PATCH(req: Request) {
  const userId = await getUserIdOrThrow();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { username } = await req.json().catch(() => ({}));

  const clean = username ? String(username).trim() : '';
  if (clean && clean.length > 40) {
    return NextResponse.json({ message: 'Username is too long.' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { username: clean || null },
    select: {
      id: true,
      email: true,
      username: true,
      createdAt: true,
      termsAcceptedAt: true,
      termsVersion: true,
      lastPasswordChangeAt: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}
