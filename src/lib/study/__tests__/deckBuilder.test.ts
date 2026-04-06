import { describe, it, expect } from 'vitest';

import { buildDeckForSections } from '../deckBuilder';
import type { DeckSection, OptionKey } from '../types';

function makeSection(id: string, questionCount: number): DeckSection {
  return {
    id,
    title: `Section ${id}`,
    questions: Array.from({ length: questionCount }, (_, i) => ({
      id: `${id}-q${i}`,
      stem: `Question ${i} of ${id}`,
      options: [
        { id: 'A' as OptionKey, text: `${id}-A${i}` },
        { id: 'B' as OptionKey, text: `${id}-B${i}` },
        { id: 'C' as OptionKey, text: `${id}-C${i}` },
        { id: 'D' as OptionKey, text: `${id}-D${i}` },
      ],
      correctOptionId: 'B' as OptionKey,
    })),
  };
}

describe('buildDeckForSections', () => {
  const sections = [makeSection('s1', 3), makeSection('s2', 2)];
  const allIds = ['s1', 's2'];

  it('builds deck from selected sections', () => {
    const deck = buildDeckForSections(sections, allIds, ['s1']);
    expect(deck).toHaveLength(3);
    expect(deck.every((q) => q.sectionId === 's1')).toBe(true);
  });

  it('uses all sections when none selected', () => {
    const deck = buildDeckForSections(sections, allIds, []);
    expect(deck).toHaveLength(5);
  });

  it('shuffles options (correctAnswer still points to correct text)', () => {
    const deck = buildDeckForSections(sections, allIds, ['s1']);
    for (const q of deck) {
      // Original correct was 'B' → text starts with '{sectionId}-B{idx}'
      const correctText = q.options[q.correctAnswer];
      expect(correctText).toMatch(/^s1-B/);
    }
  });

  it('filters out questions with missing id/stem', () => {
    const badSection: DeckSection = {
      id: 'bad',
      title: 'Bad',
      questions: [
        { id: '', stem: 'No id', options: [], correctOptionId: 'A' },
        { id: 'ok', stem: '', options: [], correctOptionId: 'A' },
        {
          id: 'good',
          stem: 'Good Q',
          options: [
            { id: 'A' as OptionKey, text: 'a' },
            { id: 'B' as OptionKey, text: 'b' },
            { id: 'C' as OptionKey, text: 'c' },
            { id: 'D' as OptionKey, text: 'd' },
          ],
          correctOptionId: 'A',
        },
      ],
    };
    const deck = buildDeckForSections([badSection], ['bad'], ['bad']);
    expect(deck).toHaveLength(1);
    expect(deck[0].id).toBe('good');
  });
});
