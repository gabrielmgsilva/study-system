import 'server-only';

import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

/**
 * Ensure the user has a Stripe customer ID, creating one if needed.
 */
async function ensureStripeCustomer(userId: number) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });

  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId: String(user.id) },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Create a Stripe Checkout session for a subscription plan.
 */
export async function createCheckoutSession(
  userId: number,
  planId: number,
  interval: 'month' | 'year',
) {
  const plan = await prisma.plan.findFirst({
    where: { id: planId, isActive: true, deletedAt: null },
    select: {
      id: true,
      name: true,
      stripePriceMonthly: true,
      stripePriceAnnual: true,
    },
  });

  if (!plan) throw new Error('Plan not found.');

  const priceId =
    interval === 'year' ? plan.stripePriceAnnual : plan.stripePriceMonthly;
  if (!priceId) {
    throw new Error(
      `No Stripe price configured for ${interval === 'year' ? 'annual' : 'monthly'} billing.`,
    );
  }

  const customerId = await ensureStripeCustomer(userId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/plans/success`,
    cancel_url: `${appUrl}/plans`,
    subscription_data: {
      metadata: {
        userId: String(userId),
        planId: String(plan.id),
      },
    },
  });

  return session;
}

/**
 * Create a Stripe Billing Portal session so users can manage their
 * subscription (upgrade, cancel, update payment method, etc.).
 */
export async function createPortalSession(customerId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/profile/plan`,
  });

  return session;
}
