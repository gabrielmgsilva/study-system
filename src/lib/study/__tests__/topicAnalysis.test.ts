import { describe, it, expect } from 'vitest';

import { classifyTopic, calculateTopicBreakdown } from '../topicAnalysis';
import type { Question, UserAnswer } from '../types';

describe('classifyTopic', () => {
  it('returns Strong for ≥80%', () => {
    expect(classifyTopic(80)).toBe('Strong');
    expect(classifyTopic(100)).toBe('Strong');
  });

  it('returns Borderline for 60-79%', () => {
    expect(classifyTopic(60)).toBe('Borderline');
    expect(classifyTopic(79)).toBe('Borderline');
  });

  it('returns Needs Study for <60%', () => {
    expect(classifyTopic(59)).toBe('Needs Study');
    expect(classifyTopic(0)).toBe('Needs Study');
  });
});

describe('calculateTopicBreakdown', () => {
  const questions: Question[] = [
    {
      id: 'q1',
      sectionId: 's1',
      stem: 'Q1',
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'A',
      tcSectionCode: 'SEC1',
      tcSectionTitle: 'Section 1',
      tcTopicCode: 'T1',
      tcTopicTitle: 'Topic 1',
    },
    {
      id: 'q2',
      sectionId: 's1',
      stem: 'Q2',
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'B',
      tcSectionCode: 'SEC1',
      tcSectionTitle: 'Section 1',
      tcTopicCode: 'T1',
      tcTopicTitle: 'Topic 1',
    },
    {
      id: 'q3',
      sectionId: 's1',
      stem: 'Q3',
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'C',
      tcSectionCode: 'SEC1',
      tcSectionTitle: 'Section 1',
      tcTopicCode: 'T2',
      tcTopicTitle: 'Topic 2',
    },
  ];

  it('calculates correct percentages per topic', () => {
    const answers: UserAnswer[] = [
      { questionId: 'q1', selectedAnswer: 'A', isCorrect: true },
      { questionId: 'q2', selectedAnswer: 'A', isCorrect: false },
      { questionId: 'q3', selectedAnswer: 'C', isCorrect: true },
    ];

    const rows = calculateTopicBreakdown(questions, answers);

    const t1 = rows.find((r) => r.topicCode === 'T1');
    expect(t1).toBeDefined();
    expect(t1!.correct).toBe(1);
    expect(t1!.total).toBe(2);
    expect(t1!.percentage).toBe(50);
    expect(t1!.classification).toBe('Needs Study');

    const t2 = rows.find((r) => r.topicCode === 'T2');
    expect(t2).toBeDefined();
    expect(t2!.correct).toBe(1);
    expect(t2!.total).toBe(1);
    expect(t2!.percentage).toBe(100);
    expect(t2!.classification).toBe('Strong');
  });

  it('treats unanswered questions as incorrect', () => {
    const answers: UserAnswer[] = [];
    const rows = calculateTopicBreakdown(questions, answers);

    for (const row of rows) {
      expect(row.correct).toBe(0);
      expect(row.classification).toBe('Needs Study');
    }
  });
});
