import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { requireAuth, isAuthError } from '@/lib/guards';
import { rateLimit } from '@/lib/rateLimit';

const VALID_INTERVALS = new Set(['month', 'year']);

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const rl = rateLimit(`upgrade:${auth.userId}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ message: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { planId, interval } = body as { planId?: number; interval?: string };

  if (!planId || !interval || !VALID_INTERVALS.has(interval)) {
    return NextResponse.json(
      { message: 'planId and interval (month | year) are required.' },
      { status: 400 },
    );
  }

  const user = await prisma.user.findFirst({
    where: { id: auth.userId, deletedAt: null },
    select: {
      id: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionStatus: true,
      planId: true,
    },
  });

  if (!user) {
    return NextResponse.json({ message: 'User not found.' }, { status: 404 });
  }

  // Must have an active or trialing subscription to upgrade
  const hasActiveSub =
    user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';

  if (!hasActiveSub || !user.stripeSubscriptionId) {
    return NextResponse.json(
      { message: 'No active subscription found. Please subscribe first.' },
      { status: 400 },
    );
  }

  const plan = await prisma.plan.findFirst({
    where: { id: planId, isActive: true, deletedAt: null },
    select: { id: true, name: true, stripePriceMonthly: true, stripePriceAnnual: true },
  });

  if (!plan) {
    return NextResponse.json({ message: 'Plan not found.' }, { status: 404 });
  }

  const newPriceId = interval === 'year' ? plan.stripePriceAnnual : plan.stripePriceMonthly;
  if (!newPriceId) {
    return NextResponse.json(
      { message: `No Stripe price configured for ${interval}ly billing.` },
      { status: 400 },
    );
  }

  // Retrieve current subscription to get the item ID
  const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
  const currentItemId = subscription.items.data[0]?.id;

  if (!currentItemId) {
    return NextResponse.json({ message: 'Could not retrieve current subscription item.' }, { status: 500 });
  }

  // Check it's not already the same price
  const currentPriceId = subscription.items.data[0]?.price?.id;
  if (currentPriceId === newPriceId) {
    return NextResponse.json({ message: 'Already on this plan and interval.' }, { status: 400 });
  }

  // Update the subscription in Stripe with proration
  const updated = await stripe.subscriptions.update(user.stripeSubscriptionId, {
    items: [{ id: currentItemId, price: newPriceId }],
    proration_behavior: 'create_prorations',
    metadata: {
      userId: String(user.id),
      planId: String(plan.id),
    },
  });

  // Sync to DB immediately (webhook will also confirm)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      planId: plan.id,
      subscriptionStatus: updated.status,
      subscriptionExpiresAt: new Date(updated.current_period_end * 1000),
    },
  });

  return NextResponse.json({ ok: true });
}
