import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  CirclePlay,
  Clock3,
  FileText,
  Layers3,
  PencilLine,
} from 'lucide-react';

import { getCurrentUserServer } from '@/lib/currentUserServer';
import { getAppDictionary, localizeAppHref } from '@/lib/i18n/app';
import { getServerAppLocale } from '@/lib/i18n/appServer';
import {
  getDefaultStudyModule,
  getStudyLicense,
  getStudyModule,
} from '@/lib/studyNavigation';

type StudyModulePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default async function StudyModulePage({
  searchParams,
}: StudyModulePageProps) {
  const locale = await getServerAppLocale();
  const dictionary = getAppDictionary(locale);
  const params = await searchParams;
  const user = await getCurrentUserServer();

  const selectedLicenseId = normalizeParam(params.license);
  const selectedModuleId = normalizeParam(params.module);

  const selectedLicense = getStudyLicense(selectedLicenseId, locale);
  const selectedModule = selectedLicense
    ? getStudyModule(selectedLicense.licenseId, selectedModuleId, locale)
    : null;

  const fallback = getDefaultStudyModule(user?.primaryLicenseId, locale);
  const activeLicense = selectedLicense && selectedModule ? selectedLicense : fallback.license;
  const activeModule = selectedModule ?? fallback.module;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-400">{activeModule.breadcrumb}</div>
          <div>
            <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">
              {activeModule.title}
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              {activeModule.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              {dictionary.study.progress}
            </div>
            <div className="text-[2rem] font-semibold leading-none text-[#2d4bb3]">
              {activeModule.progressPercent}%
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              {dictionary.study.difficulty}
            </div>
            <div className="text-sm font-semibold text-[#ff8a1f]">{activeModule.difficulty}</div>
          </div>
        </div>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[#2d4bb3]"
          style={{ width: `${activeModule.progressPercent}%` }}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#2d4bb3]">
              <Layers3 className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
              {activeModule.flashcards.status}
            </span>
          </div>

          <div className="mt-5">
            <h2 className="text-lg font-semibold text-slate-900">{dictionary.study.flashcards}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {dictionary.study.spacedRepetition}
            </p>
          </div>

          <div className="mt-5 flex items-end justify-between text-sm">
            <span className="text-slate-500">{dictionary.study.cardsMastered}</span>
            <span className="font-semibold text-slate-900">
              {activeModule.flashcards.mastered}/{activeModule.flashcards.total}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[#2d4bb3]"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(
                    (Number(activeModule.flashcards.mastered) /
                      Number(activeModule.flashcards.total)) *
                      100,
                  ),
                )}%`,
              }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>{activeModule.flashcards.lastSession}</span>
            <span>{activeModule.flashcards.completion}</span>
          </div>

          <Link
            href={localizeAppHref(activeModule.studyHref, locale)}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2d4bb3] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(45,75,179,0.2)] transition hover:bg-[#243d99]"
          >
            <CirclePlay className="h-4 w-4" />
            {dictionary.study.continueStudying}
          </Link>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <PencilLine className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-[#eef3ff] px-2 py-1 text-[10px] font-semibold text-[#2d4bb3]">
              {activeModule.practice.status}
            </span>
          </div>

          <div className="mt-5">
            <h2 className="text-lg font-semibold text-slate-900">{dictionary.study.practice}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {dictionary.study.interactiveQa}
            </p>
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">{dictionary.study.lastPracticeScore}</dt>
              <dd className="font-semibold text-emerald-600">{activeModule.practice.lastScore}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">{dictionary.study.questionsAnswered}</dt>
              <dd className="font-semibold text-slate-900">
                {activeModule.practice.questionsAnswered}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">{dictionary.study.avgAccuracy}</dt>
              <dd className="font-semibold text-slate-900">{activeModule.practice.accuracy}</dd>
            </div>
          </dl>
          <div className="mt-4 text-[11px] text-slate-400">
            {dictionary.study.streak}: {activeModule.practice.streak}
          </div>

          <Link
            href={localizeAppHref(activeModule.studyHref, locale)}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#16a34a] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(22,163,74,0.18)] transition hover:bg-[#15803d]"
          >
            <CirclePlay className="h-4 w-4" />
            {dictionary.study.startPractice}
          </Link>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[#f97316]">
              <Clock3 className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-semibold text-[#f97316]">
              {activeModule.test.status}
            </span>
          </div>

          <div className="mt-5">
            <h2 className="text-lg font-semibold text-slate-900">{dictionary.study.test}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {dictionary.study.timedAssessment}
            </p>
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">{dictionary.study.mockTestAverage}</dt>
              <dd className="font-semibold text-[#f97316]">{activeModule.test.averageScore}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">{dictionary.study.testsCompleted}</dt>
              <dd className="font-semibold text-slate-900">{activeModule.test.testsCompleted}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">{dictionary.study.bestScore}</dt>
              <dd className="font-semibold text-slate-900">{activeModule.test.bestScore}</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
            <span>{dictionary.study.time}: {activeModule.test.time}</span>
            <span>{activeModule.test.readiness} {dictionary.study.readiness.toLowerCase()}</span>
          </div>

          <Link
            href={localizeAppHref(activeModule.studyHref, locale)}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#f97316] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(249,115,22,0.2)] transition hover:bg-[#ea580c]"
          >
            <CirclePlay className="h-4 w-4" />
            {dictionary.study.startTest}
          </Link>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_32px_rgba(15,23,42,0.06)]">
        <h3 className="text-lg font-semibold text-slate-900">{dictionary.study.detailedTracking}</h3>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eef3ff] text-[#2d4bb3]">
              <Layers3 className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <div className="font-semibold text-slate-900">{dictionary.study.flashcardMastery}</div>
              <div className="grid grid-cols-[auto_auto] gap-x-5 gap-y-1 text-sm">
                <span className="text-emerald-600">{dictionary.study.easy}</span>
                <span className="text-slate-900">18 cards</span>
                <span className="text-amber-500">{dictionary.study.medium}</span>
                <span className="text-slate-900">6 cards</span>
                <span className="text-red-500">{dictionary.study.hard}</span>
                <span className="text-slate-900">26 cards</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <PencilLine className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <div className="font-semibold text-slate-900">{dictionary.study.practicePerformance}</div>
              <div className="grid grid-cols-[auto_auto] gap-x-5 gap-y-1 text-sm">
                <span className="text-slate-500">{dictionary.study.correct}</span>
                <span className="text-emerald-600">104/127</span>
                <span className="text-slate-500">{dictionary.study.avgAccuracy}</span>
                <span className="text-slate-900">{activeModule.practice.accuracy}</span>
                <span className="text-slate-500">{dictionary.study.avgTime}</span>
                <span className="text-slate-900">1.2 min</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[#f97316]">
              <Clock3 className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <div className="font-semibold text-slate-900">{dictionary.study.testReadiness}</div>
              <div className="grid grid-cols-[auto_auto] gap-x-5 gap-y-1 text-sm">
                <span className="text-slate-500">{dictionary.study.bestScore}</span>
                <span className="text-slate-900">{activeModule.test.bestScore}</span>
                <span className="text-slate-500">{dictionary.study.average}</span>
                <span className="text-slate-900">{activeModule.test.averageScore}</span>
                <span className="text-slate-500">{dictionary.study.readiness}</span>
                <span className="font-semibold text-emerald-600">
                  {activeModule.test.readiness}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#d8e0fb] bg-[linear-gradient(90deg,rgba(238,243,255,0.95),rgba(255,248,245,0.9))] p-6 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2d4bb3] text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{dictionary.study.studyRecommendations}</h3>
            <p className="text-sm text-slate-500">
              {dictionary.study.recommendationsTuned} {activeLicense.label} / {activeModule.shortLabel}.
            </p>
          </div>
        </div>

        <ul className="mt-5 space-y-3 text-sm text-slate-600">
          {activeModule.recommendations.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5">
          <Link
            href={localizeAppHref(activeModule.studyHref, locale)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2d4bb3] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243d99]"
          >
            <BookOpen className="h-4 w-4" />
            {dictionary.study.viewFullModule}
          </Link>
        </div>
      </section>
    </div>
  );
}
