import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/guards';

export async function POST() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const logbook = await prisma.logbook.create({
    data: { userId: auth.userId },
  });

  return NextResponse.json({ logbookId: String(logbook.id) });
}
