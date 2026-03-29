'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ROUTES } from '@/lib/routes';
import {
  getStudentState,
  canAccessModuleFromState,
  normalizeModuleKey,
  type StudentState,
} from '@/lib/entitlementsClient';
import {
  getAppDictionary,
  getAppLocaleFromPathname,
  localizeAppHref,
} from '@/lib/i18n/app';
import { getEffectiveFlag, type ModuleStatus } from '@/lib/moduleFlags';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type EntitlementGuardProps = {
  moduleKey?: string | string[];
  title: string;
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
};

function uniq(arr: string[]) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function normalizeKeys(input?: string | string[]) {
  const keys = Array.isArray(input) ? input : input ? [input] : [];
  // ✅ usa o normalizador do modelo novo
  return uniq(keys.map(normalizeModuleKey).filter(Boolean));
}

type ParsedKey = {
  raw: string;
  licenseId?: string;
  moduleId?: string;
};

function parseModuleKey(k: string): ParsedKey {
  const raw = normalizeModuleKey(k);
  if (!raw) return { raw };

  const parts = raw.split('.');
  if (parts.length < 2) return { raw };

  const licenseId = parts[0];
  const moduleId = parts.slice(1).join('.');

  // REGS: produto global — para flags, tratamos como licença apenas
  if (raw === 'regs.core') return { raw, licenseId, moduleId: undefined };

  return { raw, licenseId, moduleId };
}

function rankStatus(s: ModuleStatus) {
  if (s === 'maintenance') return 3;
  if (s === 'coming_soon') return 2;
  return 1; // active
}

function statusTitle(s: ModuleStatus) {
  if (s === 'maintenance') return 'maintenance';
  if (s === 'coming_soon') return 'comingSoon';
  return 'Active';
}

export default function EntitlementGuard({
  moduleKey,
  title,
  children,
  backHref,
  backLabel,
}: EntitlementGuardProps) {
  const pathname = usePathname();
  const locale = getAppLocaleFromPathname(pathname);
  const dictionary = getAppDictionary(locale);
  const [ready, setReady] = useState(false);
  const [student, setStudent] = useState<StudentState | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const s = await getStudentState({ force: true });
        if (!alive) return;
        setStudent(s);
      } finally {
        if (!alive) return;
        setReady(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const keys = useMemo(() => normalizeKeys(moduleKey), [moduleKey]);

  // 1) Subscription check — block if expired
  const subscriptionExpired = useMemo(() => {
    if (!ready || !student) return false;
    if (!student.subscription) return false;
    return !student.subscription.active;
  }, [ready, student]);

  // 2) Flags (coming soon / maintenance) continuam tendo prioridade
  const flagInfo = useMemo(() => {
    if (!keys.length) return null;

    const parsed = keys.map(parseModuleKey).filter((p) => !!p.licenseId);
    if (!parsed.length) return null;

    let best: { status: ModuleStatus; message?: string; raw: string } | null = null;

    for (const p of parsed) {
      const lic = p.licenseId as any;
      const mod = (p.moduleId as any) ?? undefined;

      const f = getEffectiveFlag(lic, mod);
      const current = { status: f.status, message: f.message, raw: p.raw };

      if (!best) best = current;
      else if (rankStatus(current.status) > rankStatus(best.status)) best = current;
    }

    return best;
  }, [keys]);

  // 3) ✅ Acesso (MODELO NOVO APENAS): licenseEntitlements -> canAccessModuleFromState
  const unlocked = useMemo(() => {
    if (!ready) return false;
    if (!keys.length) return true; // sem chave = não bloqueia
    return keys.some((k) => canAccessModuleFromState(student, k));
  }, [ready, student, keys]);

  if (!ready) {
    return (
      <div className="p-4 md:p-8">
        <Card className="rounded-[30px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <CardTitle className="text-slate-900">{title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">{dictionary.guards.loading}</CardContent>
        </Card>
      </div>
    );
  }

  if (subscriptionExpired) {
    return (
      <div className="p-4 md:p-8">
        <Card className="rounded-[30px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <CardTitle className="text-slate-900">{title}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm text-slate-500">
            <div className="inline-flex w-fit items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700">
              Subscription Required
            </div>

            <p>Your subscription has expired. Please subscribe or renew your plan to continue studying.</p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                asChild
                className="border border-[#2d4bb3] bg-[#2d4bb3] text-white hover:bg-[#243d99]"
              >
                <Link href={localizeAppHref(ROUTES.student, locale)}>Manage Subscription</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                <Link href="/pricing">View Plans</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (flagInfo && flagInfo.status !== 'active') {
    return (
      <div className="p-4 md:p-8">
        <Card className="rounded-[30px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <CardTitle className="text-slate-900">{title}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm text-slate-500">
            <div className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
              {statusTitle(flagInfo.status) === 'maintenance'
                ? dictionary.guards.underMaintenance
                : dictionary.guards.comingSoon}
            </div>

            <p>
              {flagInfo.message ??
                (flagInfo.status === 'maintenance'
                  ? dictionary.guards.maintenanceBody
                  : dictionary.guards.comingSoonBody)}
            </p>

            {!!keys.length && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-1 text-xs font-medium text-slate-700">{dictionary.guards.keysChecked}</div>
                <ul className="list-disc space-y-1 pl-4 text-xs text-slate-500">
                  {keys.map((k) => (
                    <li key={k}>{k}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                asChild
                className="border border-[#2d4bb3] bg-[#2d4bb3] text-white hover:bg-[#243d99]"
              >
                <Link href={localizeAppHref(ROUTES.student, locale)}>{dictionary.guards.openStudentArea}</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                <Link href={localizeAppHref(backHref ?? ROUTES.appHome, locale)}>
                  {backLabel ?? dictionary.guards.back}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="p-4 md:p-8">
        <Card className="rounded-[30px] border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <CardHeader>
            <CardTitle className="text-slate-900">{title}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm text-slate-500">
            <p>{dictionary.guards.lockedForPlan}</p>

            {!!keys.length && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-1 text-xs font-medium text-slate-700">{dictionary.guards.keysChecked}</div>
                <ul className="list-disc space-y-1 pl-4 text-xs text-slate-500">
                  {keys.map((k) => (
                    <li key={k}>{k}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                asChild
                className="border border-[#2d4bb3] bg-[#2d4bb3] text-white hover:bg-[#243d99]"
              >
                <Link href={localizeAppHref(ROUTES.student, locale)}>{dictionary.guards.openStudentArea}</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                <Link href={localizeAppHref(backHref ?? ROUTES.appHome, locale)}>
                  {backLabel ?? dictionary.guards.back}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
