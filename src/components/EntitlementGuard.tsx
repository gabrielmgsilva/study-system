'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { ROUTES } from '@/lib/routes';
import {
  getStudentState,
  canAccessModuleFromState,
  normalizeModuleKey,
  type StudentState,
} from '@/lib/entitlementsClient';
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
  if (s === 'maintenance') return 'Under maintenance';
  if (s === 'coming_soon') return 'Coming soon';
  return 'Active';
}

function statusBody(s: ModuleStatus) {
  if (s === 'maintenance') {
    return 'This module is temporarily under maintenance. Please try again later.';
  }
  if (s === 'coming_soon') {
    return 'This module is not available yet. It will be released soon.';
  }
  return '';
}

export default function EntitlementGuard({
  moduleKey,
  title,
  children,
  backHref,
  backLabel,
}: EntitlementGuardProps) {
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

  // 1) Flags (coming soon / maintenance) continuam tendo prioridade
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

  // 2) ✅ Acesso (MODELO NOVO APENAS): licenseEntitlements -> canAccessModuleFromState
  const unlocked = useMemo(() => {
    if (!ready) return false;
    if (!keys.length) return true; // sem chave = não bloqueia
    return keys.some((k) => canAccessModuleFromState(student, k));
  }, [ready, student, keys]);

  if (!ready) {
    return (
      <div className="p-4 md:p-8">
        <Card className="rounded-[30px] border-white/15 bg-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">{title}</CardTitle>
          </CardHeader>
          <CardContent className="text-white/75 text-sm">Loading…</CardContent>
        </Card>
      </div>
    );
  }

  if (flagInfo && flagInfo.status !== 'active') {
    return (
      <div className="p-4 md:p-8">
        <Card className="rounded-[30px] border-white/15 bg-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">{title}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm text-white/75">
            <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
              {statusTitle(flagInfo.status)}
            </div>

            <p>{flagInfo.message ?? statusBody(flagInfo.status)}</p>

            {!!keys.length && (
              <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
                <div className="text-xs text-white/80 font-medium mb-1">Keys checked:</div>
                <ul className="text-xs text-white/70 list-disc pl-4 space-y-1">
                  {keys.map((k) => (
                    <li key={k}>{k}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                asChild
                className="border border-white/15 bg-black/70 text-white hover:bg-black/60"
              >
                <Link href={ROUTES.student}>Open Student Area</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="border-white/15 bg-white/10 text-white hover:bg-white/15"
              >
                <Link href={backHref ?? ROUTES.appHome}>{backLabel ?? 'Back'}</Link>
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
        <Card className="rounded-[30px] border-white/15 bg-white/10 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-white">{title}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 text-sm text-white/75">
            <p>This module is locked for your current plan.</p>

            {!!keys.length && (
              <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
                <div className="text-xs text-white/80 font-medium mb-1">Keys checked:</div>
                <ul className="text-xs text-white/70 list-disc pl-4 space-y-1">
                  {keys.map((k) => (
                    <li key={k}>{k}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                asChild
                className="border border-white/15 bg-black/70 text-white hover:bg-black/60"
              >
                <Link href={ROUTES.student}>Open Student Area</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="border-white/15 bg-white/10 text-white hover:bg-white/15"
              >
                <Link href={backHref ?? ROUTES.appHome}>{backLabel ?? 'Back'}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
