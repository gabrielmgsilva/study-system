import { describe, it, expect } from 'vitest';

import { getQuestionScore, applyAnswerToScore } from '../scoring';

describe('getQuestionScore', () => {
  it('returns 3 for unseen questions', () => {
    expect(getQuestionScore({}, 'q1')).toBe(3);
  });

  it('returns stored value', () => {
    expect(getQuestionScore({ q1: 5 }, 'q1')).toBe(5);
  });
});

describe('applyAnswerToScore', () => {
  it('increments on correct (from default 3 → 4)', () => {
    const result = applyAnswerToScore({}, 'q1', true);
    expect(result.q1).toBe(4);
  });

  it('decrements on wrong (from default 3 → 2)', () => {
    const result = applyAnswerToScore({}, 'q1', false);
    expect(result.q1).toBe(2);
  });

  it('caps at 5 on correct', () => {
    const result = applyAnswerToScore({ q1: 5 }, 'q1', true);
    expect(result.q1).toBe(5);
  });

  it('floors at 0 on wrong', () => {
    const result = applyAnswerToScore({ q1: 0 }, 'q1', false);
    expect(result.q1).toBe(0);
  });

  it('does not mutate original map', () => {
    const original = { q1: 3 };
    const result = applyAnswerToScore(original, 'q1', true);
    expect(original.q1).toBe(3);
    expect(result.q1).toBe(4);
  });
});
