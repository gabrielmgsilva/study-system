import type { QuestionScoreMap, TestHistoryEntry } from './types';

// --------------------------------------------------------
// Storage keys
// --------------------------------------------------------

export function getScoreStorageKey(moduleId: string): string {
  return `${moduleId}_questionScores_v2`;
}

export function getTestHistoryStorageKey(moduleId: string): string {
  return `${moduleId}_testHistory_v1`;
}

// --------------------------------------------------------
// Test history
// --------------------------------------------------------

export function loadTestHistory(moduleId: string): TestHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(getTestHistoryStorageKey(moduleId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TestHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveTestHistory(
  moduleId: string,
  entries: TestHistoryEntry[],
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      getTestHistoryStorageKey(moduleId),
      JSON.stringify(entries),
    );
  } catch {
    // ignore
  }
}

// --------------------------------------------------------
// Question scores
// --------------------------------------------------------

export function loadQuestionScores(moduleId: string): QuestionScoreMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(getScoreStorageKey(moduleId));
    if (!raw) return {};
    return JSON.parse(raw) as QuestionScoreMap;
  } catch {
    return {};
  }
}

export function saveQuestionScores(
  moduleId: string,
  map: QuestionScoreMap,
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      getScoreStorageKey(moduleId),
      JSON.stringify(map),
    );
  } catch {
    // ignore
  }
}
