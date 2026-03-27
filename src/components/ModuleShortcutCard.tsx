'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import {
  getAppDictionary,
  getAppLocaleFromPathname,
  localizeAppHref,
} from '@/lib/i18n/app';
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
  const pathname = usePathname();
  const locale = getAppLocaleFromPathname(pathname);
  const dictionary = getAppDictionary(locale);
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
  const ctaHref = canOpen ? localizeAppHref(href, locale) : localizeAppHref(ROUTES.student, locale);
  const ctaLabel = !ready
    ? dictionary.shortcut.loading
    : canOpen
      ? dictionary.shortcut.open
      : disabled
        ? dictionary.shortcut.comingSoon
        : dictionary.shortcut.manageAccess;

  // Lock badge label (simple heuristic)
  const lockLabel = isLogbook ? dictionary.shortcut.requiresPremium : dictionary.shortcut.locked;

  return (
    <Card className="h-full rounded-[26px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <div className="flex h-full flex-col">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {icon ? (
                <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-[#eef3ff] text-[#2d4bb3]">
                  {icon}
                </div>
              ) : null}

              <div className="space-y-1">
                <CardTitle className="text-base text-slate-900">{title}</CardTitle>
                {description ? (
                  <CardDescription className="text-sm text-slate-500">
                    {description}
                  </CardDescription>
                ) : null}
              </div>
            </div>

            {badgeText ? (
              <Badge
                variant="secondary"
                className="shrink-0 border border-slate-200 bg-slate-50 text-slate-600"
              >
                {badgeText}
              </Badge>
            ) : null}
          </div>

          {/* Lock status */}
          {!ready ? (
            <Badge
              variant="outline"
              className="w-fit border-slate-200 bg-slate-50 text-slate-500"
            >
              …
            </Badge>
          ) : unlocked ? null : disabled ? (
            <Badge
              variant="outline"
              className="w-fit border-slate-200 bg-slate-50 text-slate-500"
            >
              {dictionary.shortcut.comingSoon}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="w-fit gap-1 border-amber-200 bg-amber-50 text-amber-700"
            >
              <Lock className="h-3 w-3" />
              {lockLabel}
            </Badge>
          )}
        </CardHeader>

        <CardFooter className="mt-auto">
          <Button
            asChild
            className="w-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
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
