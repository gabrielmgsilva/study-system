'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import {
  getAppDictionary,
  getAppLocaleFromPathname,
  localizeAppHref,
} from '@/lib/i18n/app';
import { ROUTES } from '@/lib/routes';
import {
  clearStudentCache,
  getLicenseExperience,
  getStudentState,
  type StudentState,
} from '@/lib/entitlementsClient';

import { AlertTriangle, ArrowRight, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type StudentDictionary = ReturnType<typeof getAppDictionary>['student'];

type LicenseId = 'regs' | 'm' | 'e' | 's' | 'balloons';

const LICENSES: {
  id: LicenseId;
  title: string;
  subtitle: string;
  href: string;
}[] = [
  {
    id: 'regs',
    title: 'REGS (Global)',
    subtitle: 'Unlock once → CARs + Standards (shared across licences).',
    href: ROUTES.regs, // ✅ TC-like route key
  },
  {
    id: 'm',
    title: 'M — Airplane & Helicopter',
    subtitle: 'Standard Practices, Airframe, Powerplant and Logbook.',
    href: ROUTES.mHub, // ✅ TC-like route key
  },
  {
    id: 'e',
    title: 'E — Avionics',
    subtitle: 'Standard Practices, Rating (Avionics) and Logbook.',
    href: ROUTES.eHub, // ✅ TC-like route key
  },
  {
    id: 's',
    title: 'S — Structures',
    subtitle: 'Standard Practices, Rating (Structures) and Logbook.',
    href: ROUTES.sHub, // ✅ TC-like route key
  },
  {
    id: 'balloons',
    title: 'Balloons',
    subtitle: 'BREGS and Logbook.',
    href: ROUTES.balloonsHub, // ✅ TC-like route key
  },
];

function PlanPill({ label }: { label: string }) {
  return <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">{label}</Badge>;
}

function formatLimit(
  limit: number | null | undefined,
  unit: 'day' | 'week' | 'month' | undefined,
  dictionary: StudentDictionary,
) {
  if (limit === null || limit === undefined || !unit) {
    return dictionary.unlimited;
  }

  if (limit === 0) {
    return dictionary.notAvailable;
  }

  const suffixMap = {
    day: limit === 1 ? dictionary.day : dictionary.days,
    week: limit === 1 ? dictionary.week : dictionary.weeks,
    month: limit === 1 ? dictionary.month : dictionary.months,
  } as const;
  const suffix = suffixMap[unit];
  return `${limit}/${suffix}`;
}

function formatCertificationLimit(limit: number, dictionary: StudentDictionary) {
  if (limit < 0) return dictionary.unlimited;
  if (limit === 0) return dictionary.none;
  return String(limit);
}

function formatAccessStatus(status: 'blocked' | 'limited' | 'unlimited', dictionary: StudentDictionary) {
  if (status === 'blocked') return dictionary.blocked;
  if (status === 'limited') return dictionary.limited;
  return dictionary.unlimited;
}

function isGuidedLicenseId(value: string | null): value is LicenseId {
  return value === 'regs' || value === 'm' || value === 'e' || value === 's' || value === 'balloons';
}

function EnrollLicense({
  licenseId,
  canEnroll,
  helperText,
  disabledReason,
  onDone,
}: {
  licenseId: LicenseId;
  canEnroll: boolean;
  helperText: string;
  disabledReason: string;
  onDone: () => void;
}) {
  const pathname = usePathname();
  const locale = getAppLocaleFromPathname(pathname);
  const dictionary = getAppDictionary(locale);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/entitlements/enroll-license', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ licenseId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || dictionary.student.failedToEnrollLicense);
      }

      clearStudentCache();
      onDone();
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 text-xs text-slate-500">
        {canEnroll ? helperText : disabledReason}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1" />

        <Button
          size="sm"
          className="border border-[#2d4bb3] bg-[#2d4bb3] text-white hover:bg-[#243d99]"
          onClick={submit}
          disabled={loading || !canEnroll}
        >
          {loading ? dictionary.student.saving : dictionary.shell.addCertification}
        </Button>
      </div>

      {!!err && <div className="mt-2 text-xs text-red-600">{err}</div>}
    </div>
  );
}

function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/me/billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? 'Loading...' : 'Manage Billing'}
    </Button>
  );
}

export default function StudentPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = getAppLocaleFromPathname(pathname);
  const dictionary = getAppDictionary(locale);
  const [ready, setReady] = useState(false);
  const [student, setStudent] = useState<StudentState | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const studentDictionary = dictionary.student;

  async function refresh(force = false) {
    setRefreshing(true);
    try {
      const s = await getStudentState({ force });
      setStudent(s);
    } finally {
      setRefreshing(false);
      setReady(true);
    }
  }

  useEffect(() => {
    refresh(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ownedCount = useMemo(() => {
    return student?.enrollmentSummary.count ?? 0;
  }, [student]);

  const maxLicenses = student?.enrollmentSummary.max ?? 0;
  const planSlug = student?.plan?.slug ?? null;
  const guidedIntent = searchParams.get('intent');
  const guidedLicenseId = isGuidedLicenseId(searchParams.get('license')) ? searchParams.get('license') : null;
  const isLogbookOnlyPlan = planSlug === 'logbook-pro';

  // Free / trial state
  const subStatus = student?.subscription?.status ?? null;
  const subExpiresAt = student?.subscription?.expiresAt ?? null;
  const isFreeTier = !student?.plan || subStatus === 'free';
  const isTrialing = subStatus === 'trialing' && student?.subscription?.active === true;
  const trialExpired = (student?.subscription as any)?.trialExpired === true;

  const trialDaysLeft = useMemo(() => {
    if (!isTrialing || !subExpiresAt) return null;
    const ms = new Date(subExpiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }, [isTrialing, subExpiresAt]);

  const guidanceCard = useMemo(() => {
    if (guidedIntent === 'choose-plan') {
      return {
        title: studentDictionary.planRequiredTitle,
        body: studentDictionary.planRequiredBody,
      };
    }

    if (isLogbookOnlyPlan) {
      return {
        title: studentDictionary.logbookPlanTitle,
        body: studentDictionary.logbookPlanBody,
      };
    }

    return null;
  }, [guidedIntent, isLogbookOnlyPlan, studentDictionary]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm text-slate-500">{dictionary.student.area}</div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {dictionary.student.title}
            </h1>
            <p className="text-sm text-slate-500">
              {dictionary.student.description}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="outline"
              className="w-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 sm:w-auto"
              onClick={() => refresh(true)}
              disabled={refreshing}
            >
              {refreshing ? studentDictionary.refreshing : studentDictionary.refresh}
            </Button>

            <Button
              asChild
              className="w-full border border-[#2d4bb3] bg-[#2d4bb3] text-white hover:bg-[#243d99] sm:w-auto"
            >
              <Link href={localizeAppHref(ROUTES.appHub, locale)}>{studentDictionary.openHub}</Link>
            </Button>
          </div>
        </div>

        {/* Trial / Free tier banner */}
        {ready && isTrialing && trialDaysLeft !== null && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#c9d4f4] bg-[#eef3ff] px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-[#2d4bb3]">
              <Zap className="h-4 w-4 shrink-0" />
              <span>
                <span className="font-semibold">{trialDaysLeft}</span>{' '}
                {studentDictionary.trialBannerDays}
              </span>
            </div>
            <Button
              asChild
              size="sm"
              className="shrink-0 bg-[#2d4bb3] text-white hover:bg-[#243d99] text-xs"
            >
              <Link href={ROUTES.pricing}>
                {dictionary.account.upgradeNow} <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}

        {ready && (trialExpired || isFreeTier) && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                {trialExpired
                  ? studentDictionary.trialExpiredBanner
                  : studentDictionary.freeTierBanner}
              </span>
            </div>
            <Button
              asChild
              size="sm"
              className="shrink-0 bg-amber-600 text-white hover:bg-amber-700 text-xs"
            >
              <Link href={ROUTES.pricing}>
                {dictionary.account.upgradeNow} <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}

        <Card className="rounded-[30px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <CardContent className="space-y-3 p-4 text-sm text-slate-500">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{studentDictionary.currentPlanLabel}</div>
                <div className="mt-1 text-sm font-medium text-slate-900">
                  {student?.plan?.name ?? (isFreeTier ? studentDictionary.freeTierLabel : studentDictionary.noPlanSelected)}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{studentDictionary.certificationsLabel}</div>
                <div className="mt-1 text-sm font-medium text-slate-900">
                  {ownedCount} / {formatCertificationLimit(maxLicenses, studentDictionary)}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-xs leading-5 text-slate-400 sm:text-sm">
              <span>{studentDictionary.regsExclusionNote}</span>
            {isLogbookOnlyPlan ? (
                <span>{studentDictionary.logbookOnlySummary}</span>
            ) : null}
            {ready ? null : (
                <span>{studentDictionary.loading}</span>
            )}
            </div>
          </CardContent>
        </Card>

        {/* Subscription card — shown only for active paid plans */}
        {ready && student?.subscription?.status === 'active' && student.subscription.expiresAt ? (
          <Card className="rounded-[30px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Subscription</div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                      Active
                    </span>
                    <span className="text-xs text-slate-500">
                      Renews {new Date(student.subscription.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <ManageBillingButton />
              </div>
            </CardContent>
          </Card>
        ) : null}

        {guidanceCard ? (
          <Card className="rounded-[30px] border-[#c9d4f4] bg-[#f5f8ff] shadow-[0_16px_40px_rgba(45,75,179,0.08)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-900">{guidanceCard.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-slate-600">{guidanceCard.body}</CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4">
          {LICENSES.map((lic) => {
            const exp = getLicenseExperience(student, lic.id);
            const owned = !!exp;
            // Free tier: Regs is already auto-enrolled at registration; block other tracks
            const hasPaidPlan = Boolean(student?.plan) && !isFreeTier;
            const canEnroll = lic.id === 'regs'
              ? hasPaidPlan   // Regs enroll only for paid plans (auto-enrolled on register)
              : hasPaidPlan && (maxLicenses < 0 || ownedCount < maxLicenses);
            const helperText = lic.id === 'regs'
              ? studentDictionary.enrollRegsHelper
              : isLogbookOnlyPlan
                ? studentDictionary.enrollLogbookHelper
                : studentDictionary.enrollDefaultHelper;
            const disabledReason = isFreeTier
              ? studentDictionary.planNeededForEnrollment
              : studentDictionary.certificationLimitReached;

            // Safety: never let an undefined href crash the page
            const safeHref = lic.href || ROUTES.appHub;
            const isGuidedTarget = guidedLicenseId === lic.id;

            return (
              <Card
                key={lic.id}
                className={[
                  'rounded-[30px] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]',
                  isGuidedTarget ? 'border-[#c9d4f4] ring-2 ring-[#dfe7ff]' : 'border-slate-200',
                ].join(' ')}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        {lic.title}
                        {owned ? (
                          <PlanPill label={exp.plan.name} />
                        ) : (
                          <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-500">
                            {dictionary.student.notOwned}
                          </Badge>
                        )}
                      </CardTitle>

                      <div className="mt-1 text-sm text-slate-500">
                        {lic.subtitle}
                      </div>

                      {owned && (
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
                          <span>
                            {dictionary.study.flashcards}:{' '}
                            <span className="text-slate-600">
                              {formatAccessStatus(exp.flashcards, studentDictionary)} ({formatLimit(exp.caps?.flashcards.limit, exp.caps?.flashcards.unit, studentDictionary)})
                            </span>
                          </span>
                          <span>
                            {studentDictionary.practice}:{' '}
                            <span className="text-slate-600">{formatAccessStatus(exp.practice, studentDictionary)} ({formatLimit(exp.caps?.practice.limit, exp.caps?.practice.unit, studentDictionary)})</span>
                          </span>
                          <span>
                            {studentDictionary.test}:{' '}
                            <span className="text-slate-600">{formatAccessStatus(exp.test, studentDictionary)} ({formatLimit(exp.caps?.test.limit, exp.caps?.test.unit, studentDictionary)})</span>
                          </span>
                          <span>
                            {studentDictionary.logbook}:{' '}
                            <span className="text-slate-600">
                              {exp.logbook ? studentDictionary.yes : studentDictionary.no}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>

                    {owned ? (
                      <Button
                        asChild
                        size="sm"
                        className="border border-[#2d4bb3] bg-[#2d4bb3] text-white hover:bg-[#243d99]"
                      >
                        <Link href={localizeAppHref(safeHref, locale)}>{dictionary.student.open}</Link>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="border border-slate-200 bg-slate-100 text-slate-400"
                        disabled
                      >
                        {dictionary.student.locked}
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {!owned ? (
                    <EnrollLicense
                      licenseId={lic.id}
                      canEnroll={canEnroll}
                      helperText={helperText}
                      disabledReason={disabledReason}
                      onDone={() => refresh(true)}
                    />
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        onClick={() => refresh(true)}
                        disabled={refreshing}
                      >
                        {dictionary.student.refreshStatus}
                      </Button>

                      <Button
                        asChild
                        className="border border-[#2d4bb3] bg-[#2d4bb3] text-white hover:bg-[#243d99]"
                      >
                        <Link href={localizeAppHref(safeHref, locale)}>{dictionary.student.goToLicense}</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
    </div>
  );
}
