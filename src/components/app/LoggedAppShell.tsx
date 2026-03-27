'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Bell,
  BookOpen,
  ChevronDown,
  Home,
  LogOut,
  Plane,
  Radio,
  ScrollText,
  User,
  Wind,
  Wrench,
} from 'lucide-react';

import {
  canAccessModuleFromState,
  getStudentState,
  hasLicenseFromState,
  type StudentState,
} from '@/lib/entitlementsClient';
import {
  getAppDictionary,
  localizeAppHref,
  localizePathname,
  stripLocalePrefix,
} from '@/lib/i18n/app';
import type { LandingLocale } from '@/lib/i18n/landing';
import { ROUTES } from '@/lib/routes';
import {
  getDefaultStudyModule,
  getStudyNavigation,
  studyNavigation,
  type StudyNavLicenseId,
} from '@/lib/studyNavigation';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type LoggedAppShellProps = {
  locale: LandingLocale;
  user: {
    name: string | null;
    email: string;
    username: string | null;
    primaryLicenseId: string | null;
  };
  children: React.ReactNode;
};

const topNavItems = [
  { key: 'dashboard', href: ROUTES.appHome, match: /^\/app$/ },
  {
    key: 'studyModule',
    href: ROUTES.appHub,
    match: /^\/app\/(hub|m|e|s|balloons|regs)(\/.*)?$/,
  },
  {
    key: 'profile',
    href: ROUTES.student,
    match: /^\/app\/(student|account)(\/.*)?$/,
  },
] as const;

function getUserLabel(user: LoggedAppShellProps['user']) {
  return user.name?.trim() || user.username?.trim() || user.email;
}

function getUserInitials(user: LoggedAppShellProps['user']) {
  const source = getUserLabel(user);
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('');
}

function iconForLicense(licenseId: StudyNavLicenseId) {
  if (licenseId === 'm') return Plane;
  if (licenseId === 'e') return Radio;
  if (licenseId === 's') return Wrench;
  if (licenseId === 'balloons') return Wind;
  return ScrollText;
}

function resolveActiveStudyPath(pathname: string, search: URLSearchParams) {
  const license = search.get('license');
  const module = search.get('module');

  if (pathname === ROUTES.appHub && license && module) {
    return { licenseId: license, moduleId: module };
  }

  const candidates = [
    { prefix: '/app/m/', licenseId: 'm' },
    { prefix: '/app/e/', licenseId: 'e' },
    { prefix: '/app/s/', licenseId: 's' },
    { prefix: '/app/balloons/', licenseId: 'balloons' },
    { prefix: '/app/regs/', licenseId: 'regs' },
  ] as const;

  for (const item of candidates) {
    if (pathname.startsWith(item.prefix)) {
      const moduleId = pathname.slice(item.prefix.length).split('/')[0];
      return { licenseId: item.licenseId, moduleId };
    }
  }

  return null;
}

const localeOptions: LandingLocale[] = ['en', 'pt'];

export default function LoggedAppShell({ locale, user, children }: LoggedAppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dictionary = getAppDictionary(locale);
  const cleanPathname = stripLocalePrefix(pathname);
  const localizedStudyNavigation = useMemo(() => getStudyNavigation(locale), [locale]);
  const searchSuffix = searchParams.toString();

  const [student, setStudent] = useState<StudentState | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const state = await getStudentState();
        if (!alive) return;
        setStudent(state);
      } finally {
        if (alive) setLoadingStudent(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);

    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});

    setLoggingOut(false);
    router.push(localizeAppHref('/', locale));
    router.refresh();
  }

  const chromeHidden =
    cleanPathname === ROUTES.appOnboarding || cleanPathname.includes('/logbook');

  const activeTopNav = useMemo(() => {
    return topNavItems.find((item) => item.match.test(cleanPathname))?.key ?? null;
  }, [cleanPathname]);

  const activeStudyPath = useMemo(
    () => resolveActiveStudyPath(cleanPathname, searchParams),
    [cleanPathname, searchParams],
  );

  const fallbackStudy = useMemo(
    () => getDefaultStudyModule(user.primaryLicenseId, locale),
    [locale, user.primaryLicenseId],
  );

  const visibleLicenses = useMemo(() => {
    if (loadingStudent) return [];

    return localizedStudyNavigation
      .filter((license) => {
        if (!student) return false;
        if (!hasLicenseFromState(student, license.licenseId)) return false;

        return license.modules.some((module) =>
          canAccessModuleFromState(student, `${license.licenseId}.${module.id}`),
        );
      })
      .map((license) => ({
        ...license,
        modules: license.modules.filter((module) =>
          student
            ? canAccessModuleFromState(student, `${license.licenseId}.${module.id}`)
            : false,
        ),
      }));
  }, [loadingStudent, localizedStudyNavigation, student]);

  if (chromeHidden) {
    return <div className="min-h-screen bg-[#f4f7fb]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="flex min-h-[72px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-10">
            <Link href={localizeAppHref(ROUTES.appHome, locale)} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2d4bb3] shadow-[0_10px_24px_rgba(45,75,179,0.22)]">
                <img
                  src="/home/logo.svg"
                  alt="AME ONE"
                  className="h-5 w-5 object-contain"
                />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-slate-900">AME ONE</div>
                <div className="text-[11px] text-slate-500">{dictionary.shell.brandSubtitle}</div>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 lg:flex">
              {topNavItems.map((item) => {
                const isActive = item.key === activeTopNav;
                const Icon =
                  item.key === 'dashboard'
                    ? Home
                    : item.key === 'studyModule'
                      ? BookOpen
                      : User;
                const label =
                  item.key === 'dashboard'
                    ? dictionary.shell.dashboard
                    : item.key === 'studyModule'
                      ? dictionary.shell.studyModule
                      : dictionary.shell.profile;

                return (
                  <Link
                    key={item.key}
                    href={localizeAppHref(item.href, locale)}
                    className={[
                      'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                      isActive
                        ? 'bg-[#2d4bb3] text-white shadow-[0_12px_24px_rgba(45,75,179,0.18)]'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm lg:flex">
              {localeOptions.map((option) => {
                const isActive = option === locale;

                return (
                  <Link
                    key={option}
                    href={localizePathname(pathname, option, searchSuffix ? `?${searchSuffix}` : '')}
                    className={[
                      'rounded-full px-2.5 py-1.5 text-xs font-semibold transition',
                      isActive
                        ? 'bg-[#102a54] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-[#102a54]',
                    ].join(' ')}
                  >
                    {option.toUpperCase()}
                  </Link>
                );
              })}
            </div>

            <button
              type="button"
              className="relative hidden h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 md:inline-flex"
              aria-label={dictionary.shell.notifications}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ff8a1f]" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 transition hover:bg-slate-50"
                >
                  <Avatar className="h-9 w-9 border border-slate-200">
                    <AvatarFallback className="bg-[#eef3ff] text-sm font-semibold text-[#2d4bb3]">
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left md:block">
                    <div className="text-sm font-semibold text-slate-900">
                      {getUserLabel(user)}
                    </div>
                    <div className="text-[11px] text-slate-500">{dictionary.shell.studentRole}</div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-slate-200 bg-white">
                <div className="px-2 py-2">
                  <div className="text-sm font-semibold text-slate-900">
                    {getUserLabel(user)}
                  </div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
                <DropdownMenuSeparator className="bg-slate-200" />
                <DropdownMenuItem asChild className="text-slate-700 focus:bg-slate-100 focus:text-slate-900">
                  <Link href={localizeAppHref(ROUTES.student, locale)}>
                    <User className="h-4 w-4" />
                    {dictionary.shell.profile}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:bg-red-50 focus:text-red-700"
                  onSelect={(event) => {
                    event.preventDefault();
                    void handleLogout();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  {loggingOut ? dictionary.shell.signingOut : dictionary.shell.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-72px)] lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-white px-4 py-6 lg:border-b-0 lg:border-r lg:px-5">
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {dictionary.shell.certifications}
              </div>
            </div>

            {loadingStudent ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                {dictionary.shell.loadingModules}
              </div>
            ) : visibleLicenses.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                {dictionary.shell.noCertifications}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleLicenses.map((license) => {
                  const LicenseIcon = iconForLicense(license.licenseId);
                  const isActiveLicense =
                    activeStudyPath?.licenseId === license.licenseId ||
                    (!activeStudyPath && fallbackStudy.license.licenseId === license.licenseId);

                  return (
                    <div
                      key={license.licenseId}
                      className={[
                        'rounded-2xl border px-3 py-3',
                        isActiveLicense
                          ? 'border-[#d8e0fb] bg-[#f6f8ff]'
                          : 'border-slate-200 bg-white',
                      ].join(' ')}
                    >
                      <div className="flex items-center gap-2 px-1">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                          <LicenseIcon className="h-4 w-4 text-[#2d4bb3]" />
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {license.label}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1.5 pl-9">
                        {license.modules.map((module) => {
                          const isActiveModule =
                            activeStudyPath?.licenseId === license.licenseId &&
                            activeStudyPath?.moduleId === module.id;

                          return (
                            <Link
                              key={module.id}
                              href={localizeAppHref(module.sidebarHref, locale)}
                              className={[
                                'block rounded-lg px-3 py-2 text-sm transition',
                                isActiveModule
                                  ? 'bg-[#2d4bb3] font-medium text-white shadow-[0_10px_18px_rgba(45,75,179,0.16)]'
                                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                              ].join(' ')}
                            >
                              {module.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <main className="min-w-0 bg-[#f7f8fc] px-4 py-6 md:px-6 md:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}