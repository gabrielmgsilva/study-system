import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { requireAuth, isAuthError } from '@/lib/guards';

export async function POST() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: auth.userId },
    select: { stripeCustomerId: true },
  });

  if (!user.stripeCustomerId) {
    return NextResponse.json(
      { message: 'No billing account found. Please subscribe first.' },
      { status: 400 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/app/student`,
  });

  return NextResponse.json({ ok: true, url: session.url });
}
