'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Plane,
  Radio,
  Hammer,
  Wind,
  Lock,
  Unlock,
  User,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

import TickerTips from '@/components/TickerTips';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  CardContent,
} from '@/components/ui/card';

import {
  canAccessModuleFromState,
  getStudentState,
  hasModuleFromState,
  type StudentState,
} from '@/lib/entitlementsClient';
import { ROUTES, type LicenseId } from '@/lib/routes';

type Item = {
  licenseId: LicenseId;
  name: string;
  desc: string;
  href: string;
  statusKeys: string[];
  badgeText?: string;
};

export default function StudyChooserPage() {
  const [ready, setReady] = useState(false);
  const [student, setStudent] = useState<StudentState | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const tips = useMemo(
    () => [
      'Bring pencil, eraser and a basic calculator to the exam.',
      'Read the full question first, then read ALL options.',
      'Eliminate the most incorrect answers before choosing.',
      'Study official Transport Canada references for deep understanding.',
      'Use flashcards for memory + practice mode for speed.',
    ],
    []
  );

  const items: Item[] = useMemo(
    () => [
      {
        licenseId: 'regs',
        name: 'REGS (Global)',
        desc: 'Unlock once → CARs + Standards (shared across licences).',
        href: ROUTES.regs,
        statusKeys: ['regs.core'],
        badgeText: 'Global',
      },
      {
        licenseId: 'm',
        name: 'M — Airplane & Helicopter',
        desc: 'Standard Practices, Airframe, Powerplant and Logbook',
        href: ROUTES.m,
        statusKeys: [
          'm.standard-practices',
          'm.airframe',
          'm.powerplant',
          'm.logbook',
        ],
      },
      {
        licenseId: 'e',
        name: 'E — Avionics',
        desc: 'Standard Practices, Rating (Avionics) and Logbook',
        href: ROUTES.e,
        statusKeys: [
          'e.standard-practices',
          'e.rating-avionics',
          'e.logbook',
        ],
      },
      {
        licenseId: 's',
        name: 'S — Structures',
        desc: 'Standard Practices, Rating (Structures) and Logbook',
        href: ROUTES.s,
        statusKeys: [
          's.standard-practices',
          's.rating-structures',
          's.logbook',
        ],
      },
      {
        licenseId: 'balloons',
        name: 'Balloons',
        desc: 'BREGS and Logbook',
        href: ROUTES.balloons,
        statusKeys: ['balloons.bregs', 'balloons.logbook'],
      },
    ],
    []
  );

  async function refreshStudent() {
    try {
      setError(null);
      setRefreshing(true);
      const s = await getStudentState({ force: true });
      setStudent(s);
      setReady(true);
    } catch {
      setError('Failed to refresh student state');
      setReady(true);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const s = await getStudentState();
        if (!alive) return;
        setStudent(s);
        setReady(true);
      } catch {
        if (!alive) return;
        setError('Failed to load student state');
        setReady(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Credits system is deprecated in the licence-first model.

  const calcStatus = (keys: string[]) => {
    if (!ready) return { unlocked: 0, total: keys.length };
    const unlocked = keys.filter(
      (k) => canAccessModuleFromState(student, k) || hasModuleFromState(student, k)
    ).length;
    return { unlocked, total: keys.length };
  };

  const iconFor = (licenseId: LicenseId) => {
    if (licenseId === 'regs') return ShieldCheck;
    if (licenseId === 'm') return Plane;
    if (licenseId === 'e') return Radio;
    if (licenseId === 's') return Hammer;
    return Wind;
  };

  return (
    <div className="space-y-6">
      {/* Top actions + status */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/80">
          {ready ? (
            <>
              Plans are per licence. Manage access in <span className="text-white">Student Area</span>.
              {error ? <span className="ml-3 text-red-200">{error}</span> : null}
            </>
          ) : (
            'Loading…'
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={refreshStudent}
            variant="outline"
            size="sm"
            className="border-white/15 bg-white/10 text-white hover:bg-white/15"
            disabled={!ready || refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-white/15 bg-white/10 text-white hover:bg-white/15"
          >
            <Link href={ROUTES.student} className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Student Area
            </Link>
          </Button>
        </div>
      </div>

      {/* Ticker */}
      <div className="rounded-[22px] border border-white/15 bg-black/35 backdrop-blur-md p-2 shadow-sm">
        <TickerTips tips={tips} />
      </div>

      {/* Licence cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((it) => {
          const { unlocked, total } = calcStatus(it.statusKeys);
          const allUnlocked = ready && unlocked === total;

          const Icon = iconFor(it.licenseId);

          return (
            <Link key={it.href} href={it.href} className="block">
              <Card
                className="
                  relative h-full cursor-pointer overflow-hidden rounded-[30px]
                  border-white/15 bg-black/35 backdrop-blur-md
                  transition-all hover:bg-black/45 hover:shadow-md
                "
              >
                {/* Stronger readability overlay inside each card */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/55 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(700px_320px_at_20%_10%,rgba(255,255,255,0.07),transparent_60%)] pointer-events-none" />

                <div className="relative">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between gap-2 text-sm text-white">
                      <span className="flex items-center gap-2">
                        <span className="h-8 w-8 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-white" />
                        </span>
                        <span className="leading-tight">{it.name}</span>
                      </span>

                      {!ready ? (
                        <Badge
                          className="border-white/20 bg-black/40 text-white"
                          variant="outline"
                        >
                          …
                        </Badge>
                      ) : allUnlocked ? (
                        <Badge
                          className="gap-1 bg-white/15 text-white border border-white/15"
                          variant="secondary"
                        >
                          <Unlock className="h-3 w-3" />
                          Unlocked
                        </Badge>
                      ) : (
                        <Badge
                          className="gap-1 border-white/20 bg-black/40 text-white"
                          variant="outline"
                        >
                          <Lock className="h-3 w-3" />
                          {unlocked}/{total}
                        </Badge>
                      )}
                    </CardTitle>

                    <CardDescription className="text-xs text-white/85">
                      {it.desc}
                    </CardDescription>
                  </CardHeader>

                  {it.badgeText ? (
                    <div className="px-6 -mt-1">
                      <Badge
                        className="border-white/20 bg-black/45 text-white"
                        variant="outline"
                      >
                        {it.badgeText}
                      </Badge>
                    </div>
                  ) : null}

                  <CardFooter className="pt-0">
                    {/* Button is visual; Link already wraps the card */}
                    <div className="w-full rounded-xl border border-white/15 bg-white/10 text-white text-sm py-2 text-center">
                      Open
                    </div>
                  </CardFooter>

                  <CardContent className="pt-0 text-[12px] text-white/80 space-y-2">
                    <p>
                      Some questions are inspired by real exam style. For best
                      results, always study the official Transport Canada
                      materials for deeper understanding.
                    </p>
                    <p>
                      Strategy: read the full question, read all options,
                      eliminate the most incorrect answers, then choose the best
                      remaining option.
                    </p>
                  </CardContent>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
