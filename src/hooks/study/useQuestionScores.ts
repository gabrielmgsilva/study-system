'use client';

import { useCallback, useEffect, useState } from 'react';
import type { QuestionScoreMap } from '@/lib/study/types';
import {
  loadQuestionScores,
  saveQuestionScores,
} from '@/lib/study/storage';
import {
  getQuestionScore as _getQuestionScore,
  applyAnswerToScore,
} from '@/lib/study/scoring';

interface UseQuestionScoresReturn {
  questionScores: QuestionScoreMap;
  getScore: (questionId: string) => number;
  recordAnswer: (questionId: string, isCorrect: boolean) => void;
}

export function useQuestionScores(moduleId: string): UseQuestionScoresReturn {
  const [questionScores, setQuestionScores] = useState<QuestionScoreMap>({});

  useEffect(() => {
    setQuestionScores(loadQuestionScores(moduleId));
  }, [moduleId]);

  useEffect(() => {
    saveQuestionScores(moduleId, questionScores);
  }, [moduleId, questionScores]);

  const getScore = useCallback(
    (questionId: string) => _getQuestionScore(questionScores, questionId),
    [questionScores],
  );

  const recordAnswer = useCallback(
    (questionId: string, isCorrect: boolean) => {
      setQuestionScores((prev) => applyAnswerToScore(prev, questionId, isCorrect));
    },
    [],
  );

  return { questionScores, getScore, recordAnswer };
}
