import type { DeckSection, Question, OptionKey } from './types';
import { normalizeOptionsToRecord, shuffleQuestionOptions } from './optionShuffle';

/**
 * Build a flat array of Questions from selected sections.
 * Each question is validated, normalized, and has its options shuffled.
 */
export function buildDeckForSections(
  sections: DeckSection[],
  allSectionIds: string[],
  selectedSectionIds: string[],
): Question[] {
  const activeIds =
    selectedSectionIds.length > 0 ? selectedSectionIds : allSectionIds;

  const result: Question[] = [];

  for (const sid of activeIds) {
    const section = sections.find((s) => s.id === sid);
    if (!section) continue;

    for (const q of section.questions || []) {
      if (!q || !q.id || !q.stem || !Array.isArray(q.options)) continue;

      const baseCorrect = (q.correctOptionId ?? 'A') as OptionKey;

      const baseQuestion: Question = {
        id: String(q.id),
        sectionId: sid,
        stem: q.stem,
        options: normalizeOptionsToRecord(q.options),
        correctAnswer: baseCorrect,

        tcSectionCode: q.tcSectionCode,
        tcSectionTitle: q.tcSectionTitle,
        tcTopicCode: q.tcTopicCode,
        tcTopicTitle: q.tcTopicTitle,
        topicPath: q.topicPath,

        references: q.references,
        explanation: q.explanation,

        difficulty: q.difficulty,
        tags: q.tags,
      };

      result.push(shuffleQuestionOptions(baseQuestion));
    }
  }

  return result;
}
