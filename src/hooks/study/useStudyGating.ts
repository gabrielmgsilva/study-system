'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getStudentState,
  type StudentState,
} from '@/lib/entitlementsClient';
import type { LicenseUsageCaps, LicenseUsageSummary } from '@/lib/entitlementsClient';
import { planCaps } from '@/lib/planEntitlements';
import { formatResetLabel } from '@/lib/study/usageFormat';
import { getAppDictionary } from '@/lib/i18n/app';

type StudyDictionary = ReturnType<typeof getAppDictionary>['study'];

function fallbackCaps(plan?: StudentState['plan'] | null): LicenseUsageCaps | null {
  if (!plan) return null;
  const caps = planCaps({
    ...plan,
    description: null,
    flashcardsLimit: -1,
    flashcardsUnit: 'day',
    practiceLimit: -1,
    practiceUnit: 'day',
    testsLimit: -1,
    testsUnit: 'week',
    maxQuestionsPerSession: null,
    logbookAccess: false,
  });
  return {
    flashcards: caps.flashcards,
    practice: caps.practice,
    test: caps.test,
    maxQuestionsPerSession: caps.maxQuestionsPerSession,
  };
}

export interface ModeAvailability {
  remaining: number | null;
  limit: number | null;
  unit: 'day' | 'week' | 'month';
  used: number;
}

export interface UseStudyGatingReturn {
  student: StudentState | null;
  caps: LicenseUsageCaps | null;
  usage: LicenseUsageSummary | null;
  modeAvailability: Record<'flashcard' | 'practice' | 'test', ModeAvailability>;
  isModeExhausted: (mode: 'flashcard' | 'practice' | 'test') => boolean;
  getModeBlockedMessage: (mode: 'flashcard' | 'practice' | 'test') => string;
  syncStudentState: () => Promise<StudentState | null>;
}

export function useStudyGating(
  licenseId: string | undefined,
  dictionary: StudyDictionary,
): UseStudyGatingReturn {
  const [student, setStudent] = useState<StudentState | null>(null);

  useEffect(() => {
    if (!licenseId) return;
    let alive = true;
    (async () => {
      const s = await getStudentState({ force: false });
      if (!alive) return;
      setStudent(s);
    })();
    return () => { alive = false; };
  }, [licenseId]);

  const licenseExperience = student?.licenseEntitlements?.[licenseId ?? ''] ?? null;
  const plan = licenseExperience?.plan;
  const caps = licenseExperience?.caps ?? fallbackCaps(plan);
  const usage: LicenseUsageSummary | null = licenseExperience?.usage ?? null;

  const modeAvailability = useMemo(() => ({
    flashcard: {
      remaining: usage?.flashcardsRemaining ?? null,
      limit: caps?.flashcards.limit ?? null,
      unit: (caps?.flashcards.unit ?? 'day') as 'day' | 'week' | 'month',
      used: usage?.flashcardsUsed ?? 0,
    },
    practice: {
      remaining: usage?.practiceRemaining ?? null,
      limit: caps?.practice.limit ?? null,
      unit: (caps?.practice.unit ?? 'day') as 'day' | 'week' | 'month',
      used: usage?.practiceUsed ?? 0,
    },
    test: {
      remaining: usage?.testsRemaining ?? null,
      limit: caps?.test.limit ?? null,
      unit: (caps?.test.unit ?? 'week') as 'day' | 'week' | 'month',
      used: usage?.testsUsed ?? 0,
    },
  }), [caps, usage]);

  const isModeExhausted = useCallback(
    (modeToCheck: 'flashcard' | 'practice' | 'test') => {
      const modeState = modeAvailability[modeToCheck];
      return modeState.remaining !== null && modeState.remaining <= 0;
    },
    [modeAvailability],
  );

  const getModeBlockedMessage = useCallback(
    (modeToCheck: 'flashcard' | 'practice' | 'test') => {
      const modeState = modeAvailability[modeToCheck];
      if (modeState.limit !== null && modeState.limit <= 0) {
        return dictionary.notIncludedInPlan;
      }
      return `${dictionary.limitReached}. ${formatResetLabel(modeState.unit, dictionary)}`;
    },
    [dictionary, modeAvailability],
  );

  const syncStudentState = useCallback(async () => {
    const next = await getStudentState({ force: true });
    setStudent(next);
    return next;
  }, []);

  return {
    student,
    caps,
    usage,
    modeAvailability,
    isModeExhausted,
    getModeBlockedMessage,
    syncStudentState,
  };
}
