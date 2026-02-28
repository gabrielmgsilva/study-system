'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import * as Ent from '@/lib/entitlementsClient';
import { ROUTES } from '@/lib/routes';

type Props = {
  title: string;
  description?: string;
  href: string;

  /**
   * Key used for entitlement check, e.g:
   * "m.airframe", "e.rating-avionics", "regs.core", etc.
   */
  moduleKey: string;

  /**
   * Optional: show a tiny badge in the corner
   */
  badgeText?: string;

  /**
   * Optional: disable card even if unlocked (e.g. coming soon)
   */
  disabled?: boolean;

  /**
   * Optional icon for hub cards
   */
  icon?: React.ReactNode;
};

export default function ModuleShortcutCard({
  title,
  description,
  href,
  moduleKey,
  badgeText,
  disabled,
  icon,
}: Props) {
  const [ready, setReady] = useState(false);
  const [student, setStudent] = useState<Ent.StudentState | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      const s = await Ent.getStudentState();
      if (!alive) return;
      setStudent(s);
      setReady(true);
    })();

    return () => {
      alive = false;
    };
  }, []);

  // If your entitlementsClient already has a "plan-aware" checker, use it.
  // Otherwise, fallback to legacy hasModuleFromState.
  const unlocked = useMemo(() => {
    if (!ready) return false;

    const anyEnt = Ent as any;

    // Prefer plan-aware checker if present
    if (typeof anyEnt.canAccessModuleFromState === 'function') {
      try {
        return !!anyEnt.canAccessModuleFromState(student, moduleKey);
      } catch {
        // ignore and fallback
      }
    }

    // Legacy fallback
    return Ent.hasModuleFromState(student, moduleKey);
  }, [ready, student, moduleKey]);

  const isLogbook = useMemo(() => {
    const k = (moduleKey || '').toLowerCase();
    return k.includes('logbook');
  }, [moduleKey]);

  const canOpen = !!unlocked && !disabled;

  // Decide CTA target + label
  const ctaHref = canOpen ? href : ROUTES.student;
  const ctaLabel = !ready
    ? 'Loading…'
    : canOpen
      ? 'Open'
      : disabled
        ? 'Coming soon'
        : 'Manage access';

  // Lock badge label (simple heuristic)
  const lockLabel = isLogbook ? 'Requires Premium' : 'Locked';

  return (
    <Card className="relative h-full overflow-hidden rounded-[30px] border-white/15 bg-white/10 backdrop-blur-md">
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/25 pointer-events-none" />

      <div className="relative h-full flex flex-col">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {icon ? (
                <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-black/30 text-white">
                  {icon}
                </div>
              ) : null}

              <div className="space-y-1">
                <CardTitle className="text-base text-white">{title}</CardTitle>
                {description ? (
                  <CardDescription className="text-sm text-white/75">
                    {description}
                  </CardDescription>
                ) : null}
              </div>
            </div>

            {badgeText ? (
              <Badge
                variant="secondary"
                className="shrink-0 bg-white/15 text-white border border-white/15"
              >
                {badgeText}
              </Badge>
            ) : null}
          </div>

          {/* Lock status */}
          {!ready ? (
            <Badge
              variant="outline"
              className="w-fit border-white/20 bg-black/30 text-white"
            >
              …
            </Badge>
          ) : unlocked ? null : disabled ? (
            <Badge
              variant="outline"
              className="w-fit border-white/20 bg-black/30 text-white"
            >
              Coming soon
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="w-fit gap-1 border-white/20 bg-black/30 text-white"
            >
              <Lock className="h-3 w-3" />
              {lockLabel}
            </Badge>
          )}
        </CardHeader>

        <CardFooter className="mt-auto">
          <Button
            asChild
            className="w-full bg-white/15 text-white hover:bg-white/20 border border-white/15"
            disabled={!ready ? true : disabled ? true : false}
            variant="outline"
          >
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
