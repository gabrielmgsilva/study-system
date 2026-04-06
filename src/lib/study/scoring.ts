import type { QuestionId, QuestionScoreMap } from './types';

/** Get the score for a question (default 3 for unseen). */
export function getQuestionScore(
  map: QuestionScoreMap,
  questionId: QuestionId,
): number {
  return map[questionId] ?? 3;
}

/** Update score: +1 on correct (max 5), -1 on wrong (min 0). */
export function applyAnswerToScore(
  map: QuestionScoreMap,
  questionId: QuestionId,
  isCorrect: boolean,
): QuestionScoreMap {
  const current = map[questionId] ?? 3;
  const next = isCorrect ? Math.min(5, current + 1) : Math.max(0, current - 1);
  return { ...map, [questionId]: next };
}
