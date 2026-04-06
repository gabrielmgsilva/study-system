import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { ROUTES } from '@/lib/routes';
import { getAppDictionary } from '@/lib/i18n/app';
import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import type { DeckSection } from '@/lib/study/types';
import type { LicenseUsageCaps, LicenseUsageSummary } from '@/lib/entitlementsClient';
import { formatUsageSummary } from '@/lib/study/usageFormat';
import { GlassCard, outlineBtn, primaryBtn } from './shared';

type Dictionary = ReturnType<typeof getAppDictionary>;

export interface StudyHomeScreenProps {
  moduleTitle: string;
  moduleDescription: string;
  sections: DeckSection[];
  sectionIds: string[];
  selectedSections: string[];
  totalQuestionsSelected: number;
  deckLabel: string;
  backHref?: string;
  isStartingSession: boolean;
  caps: LicenseUsageCaps | null;
  usage: LicenseUsageSummary | null;
  dictionary: Dictionary;
  isModeExhausted: (mode: 'flashcard' | 'practice' | 'test') => boolean;
  getModeBlockedMessage: (mode: 'flashcard' | 'practice' | 'test') => string;
  onToggleSection: (sectionId: string) => void;
  onSelectAllSections: () => void;
  onStartQuiz: (mode: 'flashcard' | 'practice' | 'test') => void;
}

export function StudyHomeScreen({
  moduleTitle,
  moduleDescription,
  sections,
  selectedSections,
  totalQuestionsSelected,
  deckLabel,
  backHref,
  isStartingSession,
  caps,
  usage,
  dictionary,
  isModeExhausted,
  getModeBlockedMessage,
  onToggleSection,
  onSelectAllSections,
  onStartQuiz,
}: StudyHomeScreenProps) {
  const d = dictionary.study;
  const dg = dictionary.guards;

  return (
    <div className="space-y-6 text-slate-900">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              {moduleTitle}
            </h1>
            <p className="text-sm text-slate-600">{moduleDescription}</p>
          </div>
        </div>

        <GlassCard>
          <CardHeader>
            <CardTitle className="text-slate-900">Sections</CardTitle>
            <CardDescription className="text-slate-600">
              Select one or more sections to build the study deck.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {sections.length === 0 ? (
              <p className="text-sm text-slate-600">
                No sections configured for this module yet.
              </p>
            ) : (
              <>
                <div className="flex justify-between items-center gap-4">
                  <p className="text-xs text-slate-500">
                    Click to toggle each section. You can combine multiple
                    sections in one session.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSelectAllSections}
                    className={outlineBtn}
                  >
                    Select all
                  </Button>
                </div>

                <ul className="space-y-2">
                  {sections.map((section) => {
                    const isActive = selectedSections.includes(section.id);
                    const count = section.questions?.length ?? 0;
                    const subtitle =
                      section.subtitle ||
                      `${count} question${count === 1 ? '' : 's'}`;

                    return (
                      <li key={section.id}>
                        <button
                          type="button"
                          onClick={() => onToggleSection(section.id)}
                          className={[
                            'w-full flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition',
                            isActive
                              ? 'border-[#c9d4f4] bg-[#eef3ff] text-slate-900'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                          ].join(' ')}
                        >
                          <div>
                            <div className="text-sm font-semibold">
                              {section.shortTitle || section.title}
                            </div>

                            <div
                              className={
                                isActive
                                  ? 'text-xs text-slate-600 whitespace-pre-line'
                                  : 'text-xs text-slate-500 whitespace-pre-line'
                              }
                            >
                              {subtitle}
                            </div>

                            {section.topics && section.topics.length > 0 ? (
                              <ul
                                className={
                                  isActive
                                    ? 'mt-2 space-y-1 text-xs text-slate-600'
                                    : 'mt-2 space-y-1 text-xs text-slate-500'
                                }
                              >
                                {section.topics.slice(0, 4).map((t, idx) => (
                                  <li key={idx}>• {t}</li>
                                ))}

                                {section.topics.length > 4 ? (
                                  <li>• +{section.topics.length - 4} more…</li>
                                ) : null}
                              </ul>
                            ) : null}
                          </div>

                          <span
                            className={[
                              'text-xs px-2 py-1 rounded-full border',
                              isActive
                                ? 'border-[#c9d4f4] bg-white text-[#2d4bb3]'
                                : 'border-slate-200 bg-slate-50 text-slate-600',
                            ].join(' ')}
                          >
                            {count} questions
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <p className="text-xs text-slate-600">
                  Selected sections:{' '}
                  <span className="font-semibold text-slate-900">
                    {selectedSections.length}
                  </span>{' '}
                  · Total questions in deck:{' '}
                  <span className="font-semibold text-slate-900">
                    {totalQuestionsSelected}
                  </span>
                </p>
              </>
            )}
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="text-slate-900">{d.studyModesTitle}</CardTitle>
            <CardDescription className="text-slate-600">
              {d.studyModesDescription}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {caps && usage ? (
              <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 md:grid-cols-3">
                <div>
                  <p className="font-semibold text-slate-900">{d.flashcards}</p>
                  <p>{formatUsageSummary(caps.flashcards.limit, usage.flashcardsUsed, caps.flashcards.unit, d)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{d.practice}</p>
                  <p>{formatUsageSummary(caps.practice.limit, usage.practiceUsed, caps.practice.unit, d)}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{d.test}</p>
                  <p>{formatUsageSummary(caps.test.limit, usage.testsUsed, caps.test.unit, d)}</p>
                </div>
              </div>
            ) : null}

            {(['flashcard', 'practice', 'test'] as const).map((mode) => {
              const modeLabel =
                mode === 'flashcard'
                  ? d.flashcardModeTitle
                  : mode === 'practice'
                  ? d.practiceModeTitle
                  : d.testModeTitle;
              const modeDesc =
                mode === 'flashcard'
                  ? d.flashcardModeDescription
                  : mode === 'practice'
                  ? d.practiceModeDescription
                  : d.testModeDescription;
              const exhausted = isModeExhausted(mode);

              return (
                <div
                  key={mode}
                  className={[
                    'space-y-3 rounded-2xl px-4 py-3',
                    exhausted
                      ? 'border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50'
                      : 'border border-slate-200 bg-slate-50',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{modeLabel}</p>
                        <span
                          className={[
                            'rounded-full px-2 py-1 text-[11px] font-semibold',
                            exhausted
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-800',
                          ].join(' ')}
                        >
                          {exhausted ? d.blockedLabel : d.availableLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{modeDesc}</p>
                    </div>
                    <Button
                      disabled={totalQuestionsSelected === 0 || isStartingSession || exhausted}
                      onClick={() => void onStartQuiz(mode)}
                      className={primaryBtn}
                    >
                      {isStartingSession ? d.starting : exhausted ? d.limitReached : d.start}
                    </Button>
                  </div>
                  {exhausted ? (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      {getModeBlockedMessage(mode)}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </GlassCard>

        <div className="flex justify-between items-center gap-3 text-xs text-slate-600">
          <Button asChild variant="outline" size="sm" className={outlineBtn}>
            <Link href={backHref ?? ROUTES.appHub} className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {dg.back}
            </Link>
          </Button>
          <span className="truncate">{deckLabel}</span>
        </div>
      </div>
    </div>
  );
}
