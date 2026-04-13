import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { requireAuth, isAuthError } from '@/lib/guards';
import { rateLimit } from '@/lib/rateLimit';

const VALID_INTERVALS = new Set(['month', 'year']);

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const rl = rateLimit(`checkout:${auth.userId}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ message: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { planId, interval, couponCode } = body as {
    planId?: number;
    interval?: string;
    couponCode?: string;
  };

  if (!planId || !interval || !VALID_INTERVALS.has(interval)) {
    return NextResponse.json(
      { message: 'planId and interval (month | year) are required.' },
      { status: 400 },
    );
  }

  const plan = await prisma.plan.findFirst({
    where: { id: planId, isActive: true, deletedAt: null },
    select: {
      id: true,
      name: true,
      stripePriceMonthly: true,
      stripePriceAnnual: true,
    },
  });

  if (!plan) {
    return NextResponse.json({ message: 'Plan not found.' }, { status: 404 });
  }

  const priceId = interval === 'year' ? plan.stripePriceAnnual : plan.stripePriceMonthly;
  if (!priceId) {
    return NextResponse.json(
      { message: `No Stripe price configured for ${interval}ly billing.` },
      { status: 400 },
    );
  }

  // Ensure user has a Stripe customer
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: auth.userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: String(user.id) },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  // Validate coupon if provided
  const discounts: { coupon: string }[] = [];
  if (couponCode) {
    if (interval !== 'year') {
      return NextResponse.json(
        { message: 'Coupons are only valid for annual plans.' },
        { status: 400 },
      );
    }

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: couponCode,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!coupon) {
      return NextResponse.json({ message: 'Invalid coupon code.' }, { status: 400 });
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json({ message: 'Coupon has expired.' }, { status: 400 });
    }

    if (coupon.maxRedemptions && coupon.timesRedeemed >= coupon.maxRedemptions) {
      return NextResponse.json({ message: 'Coupon redemption limit reached.' }, { status: 400 });
    }

    discounts.push({ coupon: coupon.stripeId });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/app/student?subscribed=true`,
    cancel_url: `${appUrl}/pricing`,
    subscription_data: {
      metadata: {
        userId: String(user.id),
        planId: String(plan.id),
      },
    },
    ...(discounts.length > 0 ? { discounts } : {}),
  });

  return NextResponse.json({ ok: true, url: session.url });
}
