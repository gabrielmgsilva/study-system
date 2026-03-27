import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getCurrentSessionServer } from '@/lib/currentUserServer';

async function getUserIdOrThrow() {
  const session = await getCurrentSessionServer();
  return session?.userId ?? null;
}

export async function GET() {
  const userId = await getUserIdOrThrow();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      primaryLicenseId: true,
      studyLevel: true,
      studyGoal: true,
      onboardingCompletedAt: true,
      createdAt: true,
      lastPasswordChangeAt: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}

export async function PATCH(req: Request) {
  const userId = await getUserIdOrThrow();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { name } = await req.json().catch(() => ({}));

  const clean = name ? String(name).trim().replace(/\s+/g, ' ') : '';
  if (clean && clean.length > 40) {
    return NextResponse.json({ message: 'Name is too long.' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: clean || null },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      primaryLicenseId: true,
      studyLevel: true,
      studyGoal: true,
      onboardingCompletedAt: true,
      createdAt: true,
      lastPasswordChangeAt: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}
