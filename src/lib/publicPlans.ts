import type { LimitUnit } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export type PublicPlan = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  price: string | null;
  priceAnnual: string | null;
  maxLicenses: number;
  flashcardsLimit: number;
  flashcardsUnit: LimitUnit;
  practiceLimit: number;
  practiceUnit: LimitUnit;
  testsLimit: number;
  testsUnit: LimitUnit;
  maxQuestionsPerSession: number | null;
  logbookAccess: boolean;
  trialDays: number;
  hasMonthlyPrice: boolean;
  hasAnnualPrice: boolean;
};

export async function getPublicPlans(): Promise<PublicPlan[]> {
  const plans = await prisma.plan.findMany({
    where: {
      deletedAt: null,
      isActive: true,
    },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      price: true,
      priceAnnual: true,
      maxLicenses: true,
      flashcardsLimit: true,
      flashcardsUnit: true,
      practiceLimit: true,
      practiceUnit: true,
      testsLimit: true,
      testsUnit: true,
      maxQuestionsPerSession: true,
      logbookAccess: true,
      trialDays: true,
      stripePriceMonthly: true,
      stripePriceAnnual: true,
    },
  });

  return plans.map((plan) => ({
    ...plan,
    price: plan.price?.toString() ?? null,
    priceAnnual: plan.priceAnnual?.toString() ?? null,
    hasMonthlyPrice: !!plan.stripePriceMonthly,
    hasAnnualPrice: !!plan.stripePriceAnnual,
    stripePriceMonthly: undefined,
    stripePriceAnnual: undefined,
  }));
}