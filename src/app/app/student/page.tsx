'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  hasLicenseFromState,
  type StudentState,
} from '@/lib/entitlementsClient';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type LicenseId = 'regs' | 'm' | 'e' | 's' | 'balloons';
type PlanTier = 'basic' | 'standard' | 'premium';

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

function PlanPill({ tier }: { tier: PlanTier }) {
  const pathname = usePathname();
  const locale = getAppLocaleFromPathname(pathname);
  const dictionary = getAppDictionary(locale);
  const label = tier.toUpperCase();
  const cls =
    tier === 'basic'
      ? 'border-slate-200 bg-slate-50 text-slate-700'
      : tier === 'standard'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-amber-200 bg-amber-50 text-amber-700';

  const translatedLabel =
    tier === 'basic'
      ? dictionary.student.basic.toUpperCase()
      : tier === 'standard'
        ? dictionary.student.standard.toUpperCase()
        : dictionary.student.premium.toUpperCase();

  return <Badge className={`rounded-full border ${cls}`}>{translatedLabel || label}</Badge>;
}

function ChoosePlan({
  licenseId,
  onDone,
}: {
  licenseId: LicenseId;
  onDone: () => void;
}) {
  const pathname = usePathname();
  const locale = getAppLocaleFromPathname(pathname);
  const dictionary = getAppDictionary(locale);
  const [tier, setTier] = useState<PlanTier>('basic');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/entitlements/set-plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ licenseId, plan: tier }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to set plan');
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
        {dictionary.student.choosePlan}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          {(['basic', 'standard', 'premium'] as PlanTier[]).map((t) => (
            <Button
              key={t}
              type="button"
              size="sm"
              variant={tier === t ? 'secondary' : 'outline'}
              className={
                tier === t
                  ? 'border-[#c9d4f4] bg-[#eef3ff] text-[#2d4bb3] hover:bg-[#e4ecff]'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }
              onClick={() => setTier(t)}
              disabled={loading}
            >
              {t.toUpperCase()}
            </Button>
          ))}
        </div>

        <div className="flex-1" />

        <Button
          size="sm"
          className="border border-[#2d4bb3] bg-[#2d4bb3] text-white hover:bg-[#243d99]"
          onClick={submit}
          disabled={loading}
        >
          {loading ? dictionary.student.saving : dictionary.student.confirm}
        </Button>
      </div>

      {!!err && <div className="mt-2 text-xs text-red-600">{err}</div>}
    </div>
  );
}

export default function StudentPage() {
  const pathname = usePathname();
  const locale = getAppLocaleFromPathname(pathname);
  const dictionary = getAppDictionary(locale);
  const [ready, setReady] = useState(false);
  const [student, setStudent] = useState<StudentState | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
    if (!student) return 0;
    return LICENSES.filter((l) => hasLicenseFromState(student, l.id)).length;
  }, [student]);

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

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={() => refresh(true)}
              disabled={refreshing}
            >
              {refreshing ? dictionary.student.refreshing : dictionary.student.refresh}
            </Button>

            <Button
              asChild
              className="border border-[#2d4bb3] bg-[#2d4bb3] text-white hover:bg-[#243d99]"
            >
              <Link href={localizeAppHref(ROUTES.appHub, locale)}>{dictionary.student.openHub}</Link>
            </Button>
          </div>
        </div>

        <Card className="rounded-[30px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <CardContent className="p-4 text-sm text-slate-500">
            {dictionary.student.ownedLicenses}:{' '}
            <span className="text-slate-900">{ownedCount}</span> / {LICENSES.length}
            {ready ? null : (
              <span className="ml-2 text-slate-400">{dictionary.student.loading}</span>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          {LICENSES.map((lic) => {
            const exp = getLicenseExperience(student, lic.id);
            const owned = !!exp;
            const tier = (exp?.plan || 'basic') as PlanTier;

            // Safety: never let an undefined href crash the page
            const safeHref = lic.href || ROUTES.appHub;

            return (
              <Card
                key={lic.id}
                className="rounded-[30px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        {lic.title}
                        {owned ? (
                          <PlanPill tier={tier} />
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
                        <div className="mt-1 text-xs text-slate-400">
                          {dictionary.study.flashcards}:{' '}
                          <span className="text-slate-600">
                            {exp.flashcards}
                          </span>{' '}
                          • {dictionary.student.practice}:{' '}
                          <span className="text-slate-600">{exp.practice}</span>{' '}
                          • {dictionary.student.test}:{' '}
                          <span className="text-slate-600">{exp.test}</span> •
                          {dictionary.student.logbook}:{' '}
                          <span className="text-slate-600">
                            {exp.logbook ? dictionary.student.yes : dictionary.student.no}
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
                    <ChoosePlan licenseId={lic.id} onDone={() => refresh(true)} />
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
