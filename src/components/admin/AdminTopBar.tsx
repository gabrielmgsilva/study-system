'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Languages, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  getAppDictionary,
  localizeAppHref,
  localizePathname,
  stripLocalePrefix,
} from '@/lib/i18n/app';
import type { LandingLocale } from '@/lib/i18n/landing';
import { ROUTES } from '@/lib/routes';

type AdminTopBarProps = {
  locale: LandingLocale;
  active: 'modules' | 'plans';
};

export default function AdminTopBar({ locale, active }: AdminTopBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const admin = getAppDictionary(locale).admin;
  const strippedPath = stripLocalePrefix(pathname || ROUTES.adminModules);
  const query = searchParams.toString();

  const tabs = [
    { id: 'modules', href: ROUTES.adminModules, label: admin.modulesTab },
    { id: 'plans', href: ROUTES.adminPlans, label: admin.plansTab },
  ] as const;

  return (
    <div className="space-y-4 rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            <ShieldCheck className="h-3 w-3 text-[#2d4bb3]" />
            <span>{admin.navTitle}</span>
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{admin.navTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">{admin.navDescription}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
            <Link href={localizeAppHref(ROUTES.appHome, locale)}>{admin.backToApp}</Link>
          </Button>

          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
            <span className="px-2 text-xs font-medium text-slate-500">
              <Languages className="h-3.5 w-3.5" />
            </span>
            {(['en', 'pt'] as const).map((nextLocale) => {
              const href = localizePathname(strippedPath, nextLocale, query ? `?${query}` : '');
              const isActiveLocale = nextLocale === locale;

              return (
                <Link
                  key={nextLocale}
                  href={href}
                  aria-label={`${admin.switchLanguage}: ${nextLocale.toUpperCase()}`}
                  className={[
                    'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                    isActiveLocale ? 'bg-[#2d4bb3] text-white' : 'text-slate-600 hover:bg-slate-200',
                  ].join(' ')}
                >
                  {nextLocale.toUpperCase()}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        {tabs.map((tab) => {
          const isActiveTab = active === tab.id || strippedPath === tab.href;

          return (
            <Link
              key={tab.id}
              href={localizeAppHref(tab.href, locale)}
              className={[
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                isActiveTab
                  ? 'border-[#2d4bb3] bg-[#eef3ff] text-[#2d4bb3]'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              ].join(' ')}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}