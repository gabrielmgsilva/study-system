import { describe, it, expect } from 'vitest';

import {
  safeTopicKey,
  roundRobinPick,
  buildTestExamQuestions,
} from '../examBuilder';
import type { DeckSection, Question, OptionKey } from '../types';

function makeQuestion(
  id: string,
  sectionId: string,
  tcTopicCode?: string,
): Question {
  return {
    id,
    sectionId,
    stem: `Q ${id}`,
    options: { A: 'a', B: 'b', C: 'c', D: 'd' },
    correctAnswer: 'A',
    tcTopicCode,
  };
}

function makeSection(
  id: string,
  weight: number,
  questionCount: number,
): DeckSection {
  return {
    id,
    title: `Section ${id}`,
    weight,
    questions: Array.from({ length: questionCount }, (_, i) => ({
      id: `${id}-q${i}`,
      stem: `Q ${i}`,
      options: [
        { id: 'A' as OptionKey, text: 'a' },
        { id: 'B' as OptionKey, text: 'b' },
        { id: 'C' as OptionKey, text: 'c' },
        { id: 'D' as OptionKey, text: 'd' },
      ],
      correctOptionId: 'A' as OptionKey,
    })),
  };
}

describe('safeTopicKey', () => {
  it('uses tcTopicCode when available', () => {
    const q = makeQuestion('q1', 's1', 'T1.2');
    expect(safeTopicKey(q)).toBe('T1.2');
  });

  it('falls back to SECTION:{sectionId}', () => {
    const q = makeQuestion('q1', 's1');
    expect(safeTopicKey(q)).toBe('SECTION:s1');
  });
});

describe('roundRobinPick', () => {
  it('picks evenly across pools', () => {
    const pools = {
      A: [1, 2, 3],
      B: [10, 20, 30],
    };
    const picked = roundRobinPick(pools, 4);
    expect(picked).toHaveLength(4);
    // Should contain items from both pools
    const fromA = picked.filter((x) => x < 10);
    const fromB = picked.filter((x) => x >= 10);
    expect(fromA.length).toBe(2);
    expect(fromB.length).toBe(2);
  });

  it('handles count larger than available', () => {
    const pools = { A: [1, 2], B: [3] };
    const picked = roundRobinPick(pools, 10);
    expect(picked).toHaveLength(3);
  });

  it('returns empty for empty pools', () => {
    expect(roundRobinPick({}, 5)).toEqual([]);
  });

  it('returns empty for count 0', () => {
    expect(roundRobinPick({ A: [1, 2] }, 0)).toEqual([]);
  });
});

describe('buildTestExamQuestions', () => {
  it('respects totalQuestions cap', () => {
    const sections = [makeSection('s1', 1, 100)];
    const allQs = sections[0].questions.map((q, i) =>
      makeQuestion(`s1-q${i}`, 's1'),
    );

    const exam = buildTestExamQuestions(allQs, sections, ['s1'], ['s1'], 50);
    expect(exam).toHaveLength(50);
  });

  it('caps at available questions when fewer than requested', () => {
    const sections = [makeSection('s1', 1, 10)];
    const allQs = sections[0].questions.map((q, i) =>
      makeQuestion(`s1-q${i}`, 's1'),
    );

    const exam = buildTestExamQuestions(allQs, sections, ['s1'], ['s1'], 50);
    expect(exam).toHaveLength(10);
  });

  it('returns empty for no questions', () => {
    const exam = buildTestExamQuestions([], [], [], [], 50);
    expect(exam).toEqual([]);
  });

  it('includes questions from multiple sections', () => {
    const sections = [
      makeSection('s1', 1, 20),
      makeSection('s2', 1, 20),
    ];
    const allQs = [
      ...sections[0].questions.map((_, i) => makeQuestion(`s1-q${i}`, 's1')),
      ...sections[1].questions.map((_, i) => makeQuestion(`s2-q${i}`, 's2')),
    ];

    const exam = buildTestExamQuestions(
      allQs,
      sections,
      ['s1', 's2'],
      ['s1', 's2'],
      20,
    );
    expect(exam).toHaveLength(20);

    const fromS1 = exam.filter((q) => q.sectionId === 's1');
    const fromS2 = exam.filter((q) => q.sectionId === 's2');
    // With equal weights, should be roughly 10/10
    expect(fromS1.length).toBeGreaterThan(0);
    expect(fromS2.length).toBeGreaterThan(0);
  });
});
