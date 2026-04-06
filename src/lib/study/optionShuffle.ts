import type { OptionKey, Question } from './types';

/** Fisher-Yates shuffle — returns a new array. */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Convert `{ id, text }[]` options to `Record<OptionKey, string>`. */
export function normalizeOptionsToRecord(
  opts: { id: OptionKey; text: string }[],
): Record<OptionKey, string> {
  const record: Record<OptionKey, string> = { A: '', B: '', C: '', D: '' };
  for (const o of opts) {
    if (o && o.id && typeof o.text === 'string') record[o.id] = o.text;
  }
  return record;
}

/** Shuffle a question's ABCD options and remap `correctAnswer`. */
export function shuffleQuestionOptions(question: Question): Question {
  const entries = Object.entries(question.options) as [OptionKey, string][];
  const shuffled = shuffleArray(entries);

  const newOptions: Record<OptionKey, string> = { A: '', B: '', C: '', D: '' };
  const newKeys: OptionKey[] = ['A', 'B', 'C', 'D'];

  let newCorrect: OptionKey = 'A';

  shuffled.forEach(([oldKey, text], idx) => {
    const newKey = newKeys[idx];
    newOptions[newKey] = text;
    if (oldKey === question.correctAnswer) {
      newCorrect = newKey;
    }
  });

  return {
    ...question,
    options: newOptions,
    correctAnswer: newCorrect,
  };
}
