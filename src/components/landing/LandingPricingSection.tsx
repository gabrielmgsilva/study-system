'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { LandingDictionary } from '@/lib/i18n/landing';
import type { PublicPlan } from '@/lib/publicPlans';
import {
  getPublicPlanDisplayDescription,
  isFeaturedPublicPlan,
  type PublicPlanSectionId,
} from '@/lib/publicPlanPresentation';
import { ROUTES } from '@/lib/routes';
import type { LandingLocale } from '@/lib/i18n/landing';

type PlanSection = {
  id: PublicPlanSectionId;
  eyebrow: string;
  title: string;
  description: string;
  plans: PublicPlan[];
};

type Props = {
  locale: LandingLocale;
  dictionary: LandingDictionary;
  planSections: PlanSection[];
  totalPlans: number;
  soraClassName: string;
};

function formatPrice(price: number, customPrice: string) {
  if (!Number.isFinite(price)) return customPrice;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
  }).format(price);
}

function formatUsageLimit(
  limit: number,
  unit: PublicPlan['flashcardsUnit'],
  unlimitedLabel: string,
  notIncludedLabel: string,
  perLabel: string,
) {
  if (limit < 0) return unlimitedLabel;
  if (limit === 0) return notIncludedLabel;
  const period = limit === 1 ? unit : `${unit}s`;
  return `${limit} ${perLabel} ${period}`;
}

function formatCertificationLimit(
  maxLicenses: number,
  unlimitedLabel: string,
  noneLabel: string,
  singularLabel: string,
  pluralLabel: string,
) {
  if (maxLicenses < 0) return `${unlimitedLabel} ${pluralLabel}`;
  if (maxLicenses === 0) return noneLabel;
  return `${maxLicenses} ${maxLicenses === 1 ? singularLabel : pluralLabel}`;
}

type PlanFeature = { label: string; included: boolean };

function buildPlanFeatures(plan: PublicPlan, dictionary: LandingDictionary): PlanFeature[] {
  return [
    { label: `${dictionary.pricing.flashcardsLabel}: ${formatUsageLimit(plan.flashcardsLimit, plan.flashcardsUnit, dictionary.pricing.unlimited, dictionary.pricing.notIncluded, dictionary.pricing.perLabel)}`, included: plan.flashcardsLimit !== 0 },
    { label: `${dictionary.pricing.practiceLabel}: ${formatUsageLimit(plan.practiceLimit, plan.practiceUnit, dictionary.pricing.unlimited, dictionary.pricing.notIncluded, dictionary.pricing.perLabel)}`, included: plan.practiceLimit !== 0 },
    { label: `${dictionary.pricing.testsLabel}: ${formatUsageLimit(plan.testsLimit, plan.testsUnit, dictionary.pricing.unlimited, dictionary.pricing.notIncluded, dictionary.pricing.perLabel)}`, included: plan.testsLimit !== 0 },
    {
      label: plan.maxQuestionsPerSession
        ? `${dictionary.pricing.sessionCapLabel}: ${plan.maxQuestionsPerSession}`
        : `${dictionary.pricing.sessionCapLabel}: ${dictionary.pricing.sessionUnlimited}`,
      included: true,
    },
  ];
}

function sectionGridClass(count: number) {
  if (count >= 3) return 'lg:grid-cols-3';
  if (count === 2) return 'md:grid-cols-2';
  return 'grid-cols-1';
}

function getDisplayPrice(
  plan: PublicPlan,
  interval: 'month' | 'year',
  customPrice: string,
): string {
  if (!plan.price) return customPrice;
  const monthly = Number(plan.price);
  if (!Number.isFinite(monthly)) return customPrice;

  if (interval === 'year') {
    const annual = plan.priceAnnual ? Number(plan.priceAnnual) : null;
    if (annual != null && Number.isFinite(annual)) {
      return formatPrice(annual, customPrice);
    }
    return formatPrice(monthly * 12, customPrice);
  }

  return formatPrice(monthly, customPrice);
}

export default function LandingPricingSection({
  locale,
  dictionary,
  planSections,
  totalPlans,
  soraClassName,
}: Props) {
  const [interval, setInterval] = useState<'month' | 'year'>('month');

  return (
    <section id="pricing" className="scroll-mt-24 bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-500">{dictionary.pricing.eyebrow}</p>
          <h2 className={`${soraClassName} mt-3 text-3xl font-semibold tracking-tight text-[#102a54] sm:text-4xl`}>
            {dictionary.pricing.title}
          </h2>
          <p className="mt-3 text-sm text-slate-500 sm:text-base">{dictionary.pricing.description}</p>

          {/* Billing interval toggle */}
          <div className="mx-auto mt-6 flex w-fit items-center gap-3 rounded-full border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setInterval('month')}
              className={[
                'rounded-full px-5 py-2 text-sm font-medium transition',
                interval === 'month'
                  ? 'bg-[#102a54] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900',
              ].join(' ')}
            >
              {dictionary.pricing.monthlyLabel}
            </button>
            <button
              type="button"
              onClick={() => setInterval('year')}
              className={[
                'relative rounded-full px-5 py-2 text-sm font-medium transition',
                interval === 'year'
                  ? 'bg-[#102a54] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900',
              ].join(' ')}
            >
              {dictionary.pricing.annualLabel}
              <span className="ml-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                {dictionary.pricing.annualSavePercent}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-10 space-y-10 lg:mt-14">
          {totalPlans === 0 ? (
            <article className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_18px_42px_rgba(15,43,87,0.10)] sm:p-8 lg:col-span-3">
              <h3 className={`${soraClassName} text-2xl font-semibold text-[#102a54]`}>
                {dictionary.pricing.noPlansTitle}
              </h3>
              <p className="mt-3 max-w-2xl text-sm text-slate-500">{dictionary.pricing.noPlansDescription}</p>
            </article>
          ) : (
            planSections.map((section) =>
              section.plans.length > 0 ? (
                <div key={section.id} className="space-y-5">
                  <div className="flex flex-col gap-3 text-left md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{section.eyebrow}</p>
                      <h3 className={`${soraClassName} mt-2 text-2xl font-semibold text-[#102a54] sm:text-3xl`}>{section.title}</h3>
                      <p className="mt-2 max-w-3xl text-sm text-slate-500">{section.description}</p>
                    </div>
                    <div className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                      {section.plans.length}{' '}
                      {section.plans.length === 1
                        ? dictionary.pricing.activePlanSingular
                        : dictionary.pricing.activePlanPlural}
                    </div>
                  </div>

                  <div className={`grid gap-5 ${sectionGridClass(section.plans.length)} lg:items-end lg:gap-6`}>
                    {section.plans.map((plan) => {
                      const highlighted = isFeaturedPublicPlan(plan);
                      const features = buildPlanFeatures(plan, dictionary);
                      const displayPrice = getDisplayPrice(plan, interval, dictionary.pricing.customPrice);
                      const periodLabel = interval === 'year'
                        ? dictionary.pricing.perYear
                        : dictionary.pricing.perMonth;

                      return (
                        <article
                          key={plan.id}
                          className={[
                            'relative rounded-[22px] border p-6 shadow-[0_18px_42px_rgba(15,43,87,0.10)] sm:p-8',
                            highlighted
                              ? 'scale-100 border-[#102a54] bg-[#102a54] text-white shadow-[0_22px_55px_rgba(16,42,84,0.28)] lg:scale-[1.04]'
                              : 'border-slate-200 bg-white text-slate-900',
                          ].join(' ')}
                        >
                          {highlighted ? (
                            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff6d3a] px-4 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-[0_12px_26px_rgba(255,109,58,0.35)]">
                              {dictionary.pricing.popular}
                            </div>
                          ) : null}

                          <div className="text-center">
                            <h3 className={`${soraClassName} text-2xl font-semibold`}>{plan.name}</h3>
                            <p className={highlighted ? 'mt-2 text-sm text-slate-300' : 'mt-2 text-sm text-slate-500'}>
                              {getPublicPlanDisplayDescription(plan, dictionary.pricing.logbookOnlyDescription) || dictionary.pricing.description}
                            </p>
                            <div className="mt-6 flex flex-col items-center gap-1">
                              <div className="flex items-baseline gap-1">
                                <span className={`${soraClassName} text-4xl font-semibold sm:text-5xl`}>
                                  {displayPrice}
                                </span>
                                {plan.price ? (
                                  <span className={highlighted ? 'text-sm text-slate-300' : 'text-sm text-slate-500'}>
                                    {periodLabel}
                                  </span>
                                ) : null}
                              </div>
                              <div className={highlighted ? 'text-sm text-slate-300' : 'text-sm text-slate-500'}>
                                {formatCertificationLimit(
                                  plan.maxLicenses,
                                  dictionary.pricing.unlimited,
                                  dictionary.pricing.noCertificationTracks,
                                  dictionary.pricing.certificationTrack,
                                  dictionary.pricing.certificationTracks,
                                )}
                              </div>
                            </div>
                          </div>

                          <ul className="mt-8 space-y-4 text-sm">
                            {features.map((feature) => (
                              <li key={feature.label} className={`flex items-start gap-3 ${!feature.included ? (highlighted ? 'text-slate-400' : 'text-slate-400') : ''}`}>
                                {feature.included ? (
                                  <Check className={`mt-0.5 h-4 w-4 shrink-0 ${highlighted ? 'text-cyan-300' : 'text-[#39c66d]'}`} />
                                ) : (
                                  <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                                )}
                                <span className={!feature.included ? 'line-through' : ''}>{feature.label}</span>
                              </li>
                            ))}
                            <li className={`flex items-start gap-3 ${!plan.logbookAccess ? (highlighted ? 'text-slate-400' : 'text-slate-400') : ''}`}>
                              {plan.logbookAccess ? (
                                <Check className={`mt-0.5 h-4 w-4 shrink-0 ${highlighted ? 'text-cyan-300' : 'text-[#39c66d]'}`} />
                              ) : (
                                <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                              )}
                              <span className={!plan.logbookAccess ? 'line-through' : ''}>{plan.logbookAccess ? dictionary.pricing.logbookIncluded : dictionary.pricing.logbookUnavailable}</span>
                            </li>
                          </ul>

                          <Button
                            asChild
                            className={[
                              'mt-8 w-full rounded-md py-6 text-sm font-semibold',
                              highlighted
                                ? 'bg-[#ff6d3a] text-white hover:bg-[#f2612e]'
                                : 'bg-slate-100 text-[#102a54] hover:bg-slate-200',
                            ].join(' ')}
                          >
                            <Link href={ROUTES.localizedRegister(locale)}>{dictionary.pricing.planCta}</Link>
                          </Button>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : null,
            )
          )}
        </div>
      </div>
    </section>
  );
}
