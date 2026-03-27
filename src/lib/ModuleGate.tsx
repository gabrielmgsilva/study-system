// src/lib/ModuleGate.tsx
import React from 'react';
import Link from 'next/link';

import { getAppDictionary, localizeAppHref } from '@/lib/i18n/app';
import { getServerAppLocale } from '@/lib/i18n/appServer';
import type { LicenseId } from '@/lib/routes';
import { getEffectiveFlag } from '@/lib/moduleFlags';

type Props = {
  licenseId: LicenseId;
  moduleId?: any; // opcional (home pode não ter)
  title: string;
  backHref?: string;
  children: React.ReactNode;
};

export default function ModuleGate({
  licenseId,
  moduleId,
  title,
  backHref,
  children,
}: Props) {
  const localePromise = getServerAppLocale();
  const flag = getEffectiveFlag(licenseId as any, moduleId as any);

  if (flag.status === 'active') return <>{children}</>;

  return localePromise.then((locale) => {
    const dictionary = getAppDictionary(locale);

    return (
      <div className="mx-auto w-full max-w-4xl py-10">
        <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {dictionary.guards.keysChecked}
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h1>

          <div className="mt-4 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
            {flag.status === 'coming_soon'
              ? dictionary.guards.comingSoon
              : dictionary.guards.underMaintenance}
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
            {flag.message ||
              (flag.status === 'coming_soon'
                ? dictionary.guards.comingSoonBody
                : dictionary.guards.maintenanceBody)}
          </p>

          {backHref ? (
            <div className="mt-6">
              <Link
                href={localizeAppHref(backHref, locale)}
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {dictionary.guards.back}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    );
  });
}
