'use client';

import { useCallback, useRef, useState } from 'react';

interface BeginSessionResult {
  sessionId?: number;
  allowedQuestionsTotal: number;
}

interface CompleteSessionPayload {
  questionsTotal: number;
  questionsAnswered: number;
  questionsCorrect: number;
  score: number;
  timeSpentMs: number;
  details: Record<string, unknown>;
}

export interface UseStudySessionReturn {
  isStartingSession: boolean;
  activeStudySessionId: number | null;
  activeSessionStartedAt: number | null;
  savedResultRef: React.RefObject<boolean>;
  autoFinishRef: React.RefObject<boolean>;
  beginSession: (
    mode: 'flashcard' | 'practice' | 'test',
    requestedQuestionsTotal: number,
  ) => Promise<BeginSessionResult>;
  completeSession: (payload: CompleteSessionPayload) => Promise<void>;
  activateSession: (sessionId: number | null) => void;
  resetSessionState: () => void;
}

export function useStudySession(
  licenseId: string | undefined,
  moduleId: string,
  moduleKey: string | undefined,
  syncStudentState: () => Promise<unknown>,
): UseStudySessionReturn {
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [activeStudySessionId, setActiveStudySessionId] = useState<number | null>(null);
  const [activeSessionStartedAt, setActiveSessionStartedAt] = useState<number | null>(null);

  const savedResultRef = useRef(false);
  const autoFinishRef = useRef(false);
  const persistedStudySessionRef = useRef<number | null>(null);

  const beginSession = useCallback(
    async (
      mode: 'flashcard' | 'practice' | 'test',
      requestedQuestionsTotal: number,
    ): Promise<BeginSessionResult> => {
      if (!licenseId) {
        return { allowedQuestionsTotal: requestedQuestionsTotal };
      }

      const res = await fetch('/api/study/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseId,
          moduleKey: moduleKey ?? `${licenseId}.${moduleId}`,
          mode,
          requestedQuestionsTotal,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        if (data?.error === 'subscription_expired') {
          throw new Error(
            'Your subscription has expired. Please subscribe or renew your plan to continue studying.',
          );
        }
        throw new Error(data?.error || 'Unable to start the study session.');
      }

      await syncStudentState();
      return data as BeginSessionResult;
    },
    [licenseId, moduleId, moduleKey, syncStudentState],
  );

  const completeSession = useCallback(
    async (payload: CompleteSessionPayload) => {
      if (
        !activeStudySessionId ||
        persistedStudySessionRef.current === activeStudySessionId
      ) {
        return;
      }

      const res = await fetch('/api/study/session/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeStudySessionId,
          ...payload,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Unable to save study session results.');
      }

      persistedStudySessionRef.current = activeStudySessionId;
      await syncStudentState();
    },
    [activeStudySessionId, syncStudentState],
  );

  const activateSession = useCallback((sessionId: number | null) => {
    setActiveStudySessionId(sessionId);
    setActiveSessionStartedAt(sessionId !== null ? Date.now() : null);
  }, []);

  const resetSessionState = useCallback(() => {
    setIsStartingSession(false);
    setActiveStudySessionId(null);
    setActiveSessionStartedAt(null);
    savedResultRef.current = false;
    autoFinishRef.current = false;
    persistedStudySessionRef.current = null;
  }, []);

  return {
    isStartingSession,
    activeStudySessionId,
    activeSessionStartedAt,
    savedResultRef,
    autoFinishRef,
    beginSession,
    completeSession,
    activateSession,
    resetSessionState,
  };
}
