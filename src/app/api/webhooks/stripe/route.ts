import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ message: 'Missing stripe-signature header.' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ message: 'Webhook secret not configured.' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ message: 'Invalid signature.' }, { status: 400 });
  }

  // Idempotency check
  const existing = await prisma.subscriptionEvent.findUnique({
    where: { stripeEventId: event.id },
  });
  if (existing) {
    return NextResponse.json({ ok: true, message: 'Already processed.' });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event);
      break;
  }

  return NextResponse.json({ ok: true });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function findUserByCustomerId(customerId: string) {
  return prisma.user.findFirst({
    where: { stripeCustomerId: customerId, deletedAt: null },
    select: { id: true },
  });
}

async function logEvent(userId: number, event: Stripe.Event) {
  await prisma.subscriptionEvent.create({
    data: {
      userId,
      stripeEventId: event.id,
      eventType: event.type,
      payload: event.data.object as object,
      processedAt: new Date(),
    },
  });
}

// ---------------------------------------------------------------------------
// Event Handlers
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.mode !== 'subscription') return;

  // Retrieve the full subscription object
  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id;

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Metadata was placed on subscription_data during checkout creation
  const userId = Number(subscription.metadata?.userId);
  const planId = Number(subscription.metadata?.planId);

  if (!userId || !planId) return;

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true },
  });
  if (!user) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      planId,
      subscriptionStatus: subscription.status,
      subscriptionExpiresAt: new Date(subscription.current_period_end * 1000),
    },
  });

  await logEvent(userId, event);
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  const user = await findUserByCustomerId(customerId);
  if (!user) return;

  // Sync plan if product changed
  const priceItem = subscription.items.data[0];
  const productId = typeof priceItem?.price?.product === 'string'
    ? priceItem.price.product
    : priceItem?.price?.product?.id;

  const updateData: {
    subscriptionStatus: string;
    subscriptionExpiresAt: Date;
    planId?: number;
  } = {
    subscriptionStatus: subscription.status,
    subscriptionExpiresAt: new Date(subscription.current_period_end * 1000),
  };

  if (productId) {
    const matchedPlan = await prisma.plan.findFirst({
      where: { stripeProductId: productId, deletedAt: null },
      select: { id: true },
    });
    if (matchedPlan) {
      updateData.planId = matchedPlan.id;
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  await logEvent(user.id, event);
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  const user = await findUserByCustomerId(customerId);
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'canceled',
      subscriptionExpiresAt: null,
    },
  });

  await logEvent(user.id, event);
}

async function handleInvoicePaid(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription?.id;

  if (!subscriptionId) return;

  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) return;

  const user = await findUserByCustomerId(customerId);
  if (!user) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: subscription.status,
      subscriptionExpiresAt: new Date(subscription.current_period_end * 1000),
    },
  });

  await logEvent(user.id, event);
}

async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) return;

  const user = await findUserByCustomerId(customerId);
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionStatus: 'past_due' },
  });

  await logEvent(user.id, event);
}
