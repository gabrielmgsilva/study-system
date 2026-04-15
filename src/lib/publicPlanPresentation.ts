import type { PublicPlan } from '@/lib/publicPlans';

export type PublicPlanSectionId = 'regs' | 'licenses' | 'logbook';

export function getPublicPlanSectionId(
  plan: Pick<PublicPlan, 'slug' | 'maxLicenses' | 'logbookAccess'>,
): PublicPlanSectionId {
  if (plan.slug === 'logbook-pro') return 'logbook';
  if (
    plan.slug.startsWith('regs-') ||
    (plan.maxLicenses === 0 && !plan.logbookAccess)
  ) {
    return 'regs';
  }
  return 'licenses';
}

export function getPublicPlanDisplayDescription(
  plan: Pick<PublicPlan, 'slug' | 'description'>,
  logbookOnlyDescription = '1 certification track for logbook access only. Flashcards, practice, and tests are not included.',
) {
  if (plan.slug === 'logbook-pro') {
    return logbookOnlyDescription;
  }
  return plan.description;
}

export function isFeaturedPublicPlan(plan: Pick<PublicPlan, 'slug'>) {
  return plan.slug === 'pro';
}
