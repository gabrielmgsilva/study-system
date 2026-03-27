import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, BookOpen, User } from 'lucide-react';

import { getCurrentUserServer } from '@/lib/currentUserServer';
import { getAppDictionary, localizeAppHref } from '@/lib/i18n/app';
import { getServerAppLocale } from '@/lib/i18n/appServer';
import { ROUTES } from '@/lib/routes';

export default async function AppPage() {
  const locale = await getServerAppLocale();
  const dictionary = getAppDictionary(locale);
  const user = await getCurrentUserServer();

  if (!user) {
    redirect(localizeAppHref('/auth/login', locale));
  }

  if (!user.onboardingCompletedAt) {
    redirect(localizeAppHref(ROUTES.appOnboarding, locale));
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
          {dictionary.dashboard.eyebrow}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {dictionary.dashboard.welcomeBack} {user.name || user.username || dictionary.dashboard.defaultName}
        </h1>
        <p className="max-w-2xl text-sm text-slate-500">
          {dictionary.dashboard.description}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Link
          href={localizeAppHref(ROUTES.appHub, locale)}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_32px_rgba(15,23,42,0.06)] transition hover:border-slate-300 hover:bg-slate-50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#2d4bb3]">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="mt-5 space-y-2">
            <div className="text-xl font-semibold text-slate-900">{dictionary.dashboard.studyTitle}</div>
            <p className="text-sm text-slate-500">
              {dictionary.dashboard.studyDescription}
            </p>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#2d4bb3]">
            {dictionary.dashboard.studyCta}
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        <Link
          href={localizeAppHref(ROUTES.student, locale)}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_32px_rgba(15,23,42,0.06)] transition hover:border-slate-300 hover:bg-slate-50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <User className="h-5 w-5" />
          </div>
          <div className="mt-5 space-y-2">
            <div className="text-xl font-semibold text-slate-900">{dictionary.dashboard.profileTitle}</div>
            <p className="text-sm text-slate-500">
              {dictionary.dashboard.profileDescription}
            </p>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            {dictionary.dashboard.profileCta}
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
