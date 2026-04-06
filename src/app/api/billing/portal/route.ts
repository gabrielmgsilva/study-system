import { NextResponse } from 'next/server';

import { getCurrentSessionServer } from '@/lib/currentUserServer';
import { createPortalSession } from '@/lib/stripe-helpers';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const session = await getCurrentSessionServer();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await prisma.user.findFirstOrThrow({
    where: { id: session.userId, deletedAt: null },
    select: { stripeCustomerId: true },
  });

  if (!dbUser.stripeCustomerId) {
    return NextResponse.json(
      { error: 'No billing account found.' },
      { status: 400 },
    );
  }

  const portalSession = await createPortalSession(dbUser.stripeCustomerId);

  return NextResponse.redirect(portalSession.url);
}
