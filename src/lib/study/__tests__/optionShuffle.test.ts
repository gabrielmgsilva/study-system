import { describe, it, expect } from 'vitest';

import {
  shuffleArray,
  normalizeOptionsToRecord,
  shuffleQuestionOptions,
} from '../optionShuffle';
import type { Question, OptionKey } from '../types';

describe('shuffleArray', () => {
  it('preserves all elements', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result).toHaveLength(input.length);
    expect(result.sort()).toEqual(input.sort());
  });

  it('does not mutate the original array', () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    shuffleArray(input);
    expect(input).toEqual(copy);
  });

  it('returns empty array for empty input', () => {
    expect(shuffleArray([])).toEqual([]);
  });
});

describe('normalizeOptionsToRecord', () => {
  it('converts array to record', () => {
    const opts = [
      { id: 'A' as OptionKey, text: 'Alpha' },
      { id: 'B' as OptionKey, text: 'Bravo' },
      { id: 'C' as OptionKey, text: 'Charlie' },
      { id: 'D' as OptionKey, text: 'Delta' },
    ];
    const result = normalizeOptionsToRecord(opts);
    expect(result).toEqual({
      A: 'Alpha',
      B: 'Bravo',
      C: 'Charlie',
      D: 'Delta',
    });
  });

  it('fills missing keys with empty strings', () => {
    const opts = [{ id: 'A' as OptionKey, text: 'Only A' }];
    const result = normalizeOptionsToRecord(opts);
    expect(result.A).toBe('Only A');
    expect(result.B).toBe('');
    expect(result.C).toBe('');
    expect(result.D).toBe('');
  });
});

describe('shuffleQuestionOptions', () => {
  const makeQuestion = (): Question => ({
    id: 'q1',
    sectionId: 's1',
    stem: 'Test question?',
    options: { A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta' },
    correctAnswer: 'B',
  });

  it('preserves all option texts', () => {
    const q = makeQuestion();
    const shuffled = shuffleQuestionOptions(q);
    const texts = Object.values(shuffled.options).sort();
    expect(texts).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta']);
  });

  it('correctAnswer points to the original correct text', () => {
    const q = makeQuestion();
    const shuffled = shuffleQuestionOptions(q);
    // Original correct answer was 'B' → text 'Bravo'
    expect(shuffled.options[shuffled.correctAnswer]).toBe('Bravo');
  });

  it('does not mutate the original question', () => {
    const q = makeQuestion();
    shuffleQuestionOptions(q);
    expect(q.correctAnswer).toBe('B');
    expect(q.options.A).toBe('Alpha');
  });
});
