'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

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
  const label = tier.toUpperCase();
  const cls =
    tier === 'basic'
      ? 'border-white/20 bg-white/10 text-white/90'
      : tier === 'standard'
        ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
        : 'border-amber-400/30 bg-amber-400/10 text-amber-200';

  return <Badge className={`rounded-full border ${cls}`}>{label}</Badge>;
}

function ChoosePlan({
  licenseId,
  onDone,
}: {
  licenseId: LicenseId;
  onDone: () => void;
}) {
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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 text-xs text-white/70">
        Choose plan (dev / no billing yet)
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
                  ? 'border-white/15 bg-white/15 text-white hover:bg-white/20'
                  : 'border-white/15 bg-white/5 text-white/90 hover:bg-white/10'
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
          className="border border-white/15 bg-black/70 text-white hover:bg-black/60"
          onClick={submit}
          disabled={loading}
        >
          {loading ? 'Saving…' : 'Confirm'}
        </Button>
      </div>

      {!!err && <div className="mt-2 text-xs text-red-300">{err}</div>}
    </div>
  );
}

export default function StudentPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 py-8">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm text-white/70">Student Area</div>
            <h1 className="text-2xl font-semibold text-white">
              Your licences & plans
            </h1>
            <p className="text-sm text-white/65">
              AME ONE sells access per licence (Transport Canada mindset). Pick a
              plan per licence.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              onClick={() => refresh(true)}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </Button>

            <Button
              asChild
              className="border border-white/15 bg-black/70 text-white hover:bg-black/60"
            >
              <Link href={ROUTES.appHub}>Open Hub</Link>
            </Button>
          </div>
        </div>

        <Card className="rounded-[30px] border-white/15 bg-white/10 backdrop-blur-md">
          <CardContent className="p-4 text-sm text-white/70">
            Owned licences:{' '}
            <span className="text-white">{ownedCount}</span> / {LICENSES.length}
            {ready ? null : (
              <span className="ml-2 text-white/50">Loading…</span>
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
                className="rounded-[30px] border-white/15 bg-white/10 backdrop-blur-md"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-white">
                        {lic.title}
                        {owned ? (
                          <PlanPill tier={tier} />
                        ) : (
                          <Badge className="rounded-full border border-white/20 bg-white/5 text-white/80">
                            Not owned
                          </Badge>
                        )}
                      </CardTitle>

                      <div className="mt-1 text-sm text-white/65">
                        {lic.subtitle}
                      </div>

                      {owned && (
                        <div className="mt-1 text-xs text-white/55">
                          Flashcards:{' '}
                          <span className="text-white/70">
                            {exp.flashcards}
                          </span>{' '}
                          • Practice:{' '}
                          <span className="text-white/70">{exp.practice}</span>{' '}
                          • Test:{' '}
                          <span className="text-white/70">{exp.test}</span> •
                          Logbook:{' '}
                          <span className="text-white/70">
                            {exp.logbook ? 'yes' : 'no'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ✅ Important: if not owned, do NOT render <Link> */}
                    {owned ? (
                      <Button
                        asChild
                        size="sm"
                        className="border border-white/15 bg-black/70 text-white hover:bg-black/60"
                      >
                        <Link href={safeHref}>Open</Link>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="border border-white/15 bg-black/40 text-white/60"
                        disabled
                      >
                        Locked
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
                        className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                        onClick={() => refresh(true)}
                        disabled={refreshing}
                      >
                        Refresh status
                      </Button>

                      <Button
                        asChild
                        className="border border-white/15 bg-black/70 text-white hover:bg-black/60"
                      >
                        <Link href={safeHref}>Go to licence</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
