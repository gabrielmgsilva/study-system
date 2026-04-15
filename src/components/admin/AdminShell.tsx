'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Bell, FileText, Languages, LayoutDashboard, LogOut, Menu, Settings2, Tag, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { LandingLocale } from '@/lib/i18n/landing';
import { getAdminConsoleCopy, type AdminSectionId } from '@/lib/adminConsole';
import { getAppDictionary, localizeAppHref, localizePathname, stripLocalePrefix } from '@/lib/i18n/app';
import { logoutAndRedirect } from '@/lib/clientLogout';
import { ROUTES } from '@/lib/routes';

type AdminShellProps = {
  locale: LandingLocale;
  user: {
    name: string | null;
    email: string;
  };
  children: React.ReactNode;
};

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

type ActiveSection = AdminSectionId | 'dashboard';

function resolveActiveSection(pathname: string): ActiveSection {
  if (pathname.startsWith(ROUTES.adminUsers)) return 'users';
  if (pathname.startsWith(ROUTES.adminPlans)) return 'plans';
  if (pathname.startsWith(ROUTES.adminContent)) return 'content';
  if (pathname.startsWith(ROUTES.adminCoupons)) return 'coupons';
  return 'dashboard';
}

function SectionIcon({ id }: { id: AdminSectionId }) {
  if (id === 'plans') return <Settings2 className="h-4 w-4" />;
  if (id === 'content') return <FileText className="h-4 w-4" />;
  if (id === 'coupons') return <Tag className="h-4 w-4" />;
  return <Users className="h-4 w-4" />;
}

export default function AdminShell({ locale, user, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const copy = getAdminConsoleCopy(locale);
  const dictionary = getAppDictionary(locale);
  const strippedPath = stripLocalePrefix(pathname || ROUTES.adminHome);
  const activeSection: ActiveSection = resolveActiveSection(strippedPath);
  const isDashboard = activeSection === 'dashboard';
  const query = searchParams.toString();
  const displayName = user.name?.trim() || user.email;
  const initials = initialsFromName(displayName || 'AD');
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);

    await logoutAndRedirect(locale, router);
    setLoggingOut(false);
  }

  const nav = (
    <div className="flex h-full flex-col bg-white text-slate-900">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2f55d4] text-white shadow-[0_10px_24px_rgba(47,85,212,0.22)]">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[15px] font-semibold text-slate-900">AeroStudy Pro</div>
            <div className="text-[11px] text-slate-500">Admin Portal</div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-3 py-5">
        <div className="space-y-1.5">
          <Link
            href={localizeAppHref(ROUTES.adminHome, locale)}
            className={[
              'flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-[13px] font-medium transition',
              isDashboard
                ? 'bg-[#2f55d4] text-white shadow-[0_10px_24px_rgba(47,85,212,0.22)]'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            ].join(' ')}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>

          {copy.sections.map((section) => {
            const isActive = activeSection === section.id;
            const label =
              section.id === 'users'
                ? 'User Management'
                : section.id === 'plans'
                  ? 'Plan Management'
                  : section.id === 'coupons'
                    ? 'Coupon Management'
                    : 'Content Management';

            return (
              <Link
                key={section.id}
                href={localizeAppHref(section.href, locale)}
                className={[
                  'flex items-center gap-2.5 rounded-xl px-4 py-3 text-[13px] font-medium transition',
                  isActive
                    ? 'bg-[#2f55d4] text-white shadow-[0_10px_24px_rgba(47,85,212,0.22)]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                ].join(' ')}
              >
                <SectionIcon id={section.id} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-200 lg:block">{nav}</aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-4 px-5 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:hidden"
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[320px] border-r bg-white p-0 sm:max-w-none">
                    <SheetHeader className="sr-only">
                      <SheetTitle>{copy.shellTitle}</SheetTitle>
                      <SheetDescription>{copy.shellDescription}</SheetDescription>
                    </SheetHeader>
                    {nav}
                  </SheetContent>
                </Sheet>

                <div className="text-sm font-medium text-slate-500">{copy.shellTitle}</div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-semibold text-white">
                    3
                  </span>
                </button>
                <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
                  <span className="px-2 text-xs font-medium text-slate-500">
                    <Languages className="h-3.5 w-3.5" />
                  </span>
                  <span className="rounded-full bg-[#2d4bb3] px-3 py-1 text-xs font-semibold text-white">
                    EN
                  </span>
                </div>

                <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffb56b,#2f55d4)] text-xs font-semibold text-white">
                    {initials || 'AD'}
                  </div>
                  <div className="hidden leading-tight sm:block">
                    <div className="text-[13px] font-semibold text-slate-900">{displayName}</div>
                    <div className="text-[11px] text-slate-500">Super Admin</div>
                  </div>
                  <button
                    type="button"
                    className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={loggingOut ? dictionary.shell.signingOut : dictionary.shell.logout}
                    title={loggingOut ? dictionary.shell.signingOut : dictionary.shell.logout}
                    onClick={() => {
                      void handleLogout();
                    }}
                    disabled={loggingOut}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="px-5 py-5 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
