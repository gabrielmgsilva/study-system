import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  getScoreStorageKey,
  getTestHistoryStorageKey,
  loadTestHistory,
  saveTestHistory,
  loadQuestionScores,
  saveQuestionScores,
} from '../storage';
import type { TestHistoryEntry } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((_: number) => null),
  };
})();

Object.defineProperty(globalThis, 'window', {
  value: { localStorage: localStorageMock },
  writable: true,
});

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe('storage keys', () => {
  it('getScoreStorageKey', () => {
    expect(getScoreStorageKey('airframe')).toBe('airframe_questionScores_v2');
  });

  it('getTestHistoryStorageKey', () => {
    expect(getTestHistoryStorageKey('airframe')).toBe(
      'airframe_testHistory_v1',
    );
  });
});

describe('loadTestHistory / saveTestHistory', () => {
  it('returns empty array when nothing stored', () => {
    expect(loadTestHistory('airframe')).toEqual([]);
  });

  it('round-trips entries', () => {
    const entry: TestHistoryEntry = {
      ts: 1000,
      total: 50,
      correct: 40,
      answered: 48,
      incorrect: 8,
      unanswered: 2,
      percentage: 80,
      passMark: 70,
      pass: true,
      focusTopics: ['T1'],
    };
    saveTestHistory('mod1', [entry]);
    const loaded = loadTestHistory('mod1');
    expect(loaded).toEqual([entry]);
  });
});

describe('loadQuestionScores / saveQuestionScores', () => {
  it('returns empty object when nothing stored', () => {
    expect(loadQuestionScores('mod1')).toEqual({});
  });

  it('round-trips scores', () => {
    const scores = { q1: 5, q2: 0, q3: 3 };
    saveQuestionScores('mod1', scores);
    expect(loadQuestionScores('mod1')).toEqual(scores);
  });
});
