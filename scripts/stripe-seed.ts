/**
 * Stripe Seed Script
 *
 * Creates Stripe Products and Prices for each active plan,
 * then updates the database with the generated IDs.
 *
 * Usage:
 *   npx tsx scripts/stripe-seed.ts
 *
 * Prerequisites:
 *   - STRIPE_SECRET_KEY set in .env (sk_test_... for development)
 *   - DATABASE_URL set in .env
 *   - Plans already seeded in the database (via migrations)
 *
 * Safe to re-run: skips plans that already have Stripe IDs populated.
 */

import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set in .env');
  return new Stripe(key);
}

/** Annual price = monthly × 12 × (1 - discount). Override per slug if needed. */
const ANNUAL_DISCOUNT: Record<string, number> = {
  'student': 0.25,    // 25% off
  'pro': 0.23,        // 23% off
};

const DEFAULT_ANNUAL_DISCOUNT = 0.20;

async function main() {
  const stripe = getStripe();

  const plans = await prisma.plan.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { displayOrder: 'asc' },
  });

  if (plans.length === 0) {
    console.log('No active plans found in the database. Run migrations first.');
    return;
  }

  console.log(`Found ${plans.length} active plan(s).\n`);

  for (const plan of plans) {
    const monthlyPrice = plan.price ? Number(plan.price) : null;

    if (!monthlyPrice || monthlyPrice <= 0) {
      console.log(`⏭  ${plan.slug} — no price set, skipping.`);
      continue;
    }

    // Skip if already has Stripe IDs
    if (plan.stripeProductId && plan.stripePriceMonthly && plan.stripePriceAnnual) {
      console.log(`✅ ${plan.slug} — already has Stripe IDs, skipping.`);
      continue;
    }

    // Create or reuse product
    let productId = plan.stripeProductId;
    if (!productId) {
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description ?? undefined,
        metadata: {
          planId: String(plan.id),
          slug: plan.slug,
        },
      });
      productId = product.id;
      console.log(`  📦 Created product: ${productId}`);
    }

    // Create monthly price if missing
    let monthlyPriceId = plan.stripePriceMonthly;
    if (!monthlyPriceId) {
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: Math.round(monthlyPrice * 100), // cents
        currency: 'cad',
        recurring: { interval: 'month' },
        metadata: { slug: plan.slug, interval: 'month' },
      });
      monthlyPriceId = price.id;
      console.log(`  💳 Created monthly price: ${monthlyPriceId} ($${monthlyPrice}/mo)`);
    }

    // Create annual price if missing
    let annualPriceId = plan.stripePriceAnnual;
    if (!annualPriceId) {
      const discount = ANNUAL_DISCOUNT[plan.slug] ?? DEFAULT_ANNUAL_DISCOUNT;
      const annualTotal = Math.round(monthlyPrice * 12 * (1 - discount) * 100); // cents
      const price = await stripe.prices.create({
        product: productId,
        unit_amount: annualTotal,
        currency: 'cad',
        recurring: { interval: 'year' },
        metadata: { slug: plan.slug, interval: 'year' },
      });
      annualPriceId = price.id;
      const perMonth = (annualTotal / 100 / 12).toFixed(2);
      console.log(`  💳 Created annual price: ${annualPriceId} ($${perMonth}/mo, ${Math.round(discount * 100)}% off)`);
    }

    // Update database
    await prisma.plan.update({
      where: { id: plan.id },
      data: {
        stripeProductId: productId,
        stripePriceMonthly: monthlyPriceId,
        stripePriceAnnual: annualPriceId,
      },
    });

    console.log(`✅ ${plan.slug} — done.\n`);
  }

  console.log('Stripe seed complete.');
}

main()
  .catch((err) => {
    console.error('Stripe seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
