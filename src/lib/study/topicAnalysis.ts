import type { Question, UserAnswer, TopicBreakdownRow } from './types';

/** Classify topic performance. */
export function classifyTopic(
  percent: number,
): 'Strong' | 'Borderline' | 'Needs Study' {
  if (percent >= 80) return 'Strong';
  if (percent >= 60) return 'Borderline';
  return 'Needs Study';
}

/**
 * Calculate topic-level breakdown from questions and user answers.
 * Pure function — no side effects.
 */
export function calculateTopicBreakdown(
  questions: Question[],
  userAnswers: UserAnswer[],
): TopicBreakdownRow[] {
  const topicTitleByCode: Record<string, string> = {};
  const sectionTitleByCode: Record<string, string> = {};

  for (const q of questions) {
    if (q.tcTopicCode && q.tcTopicTitle)
      topicTitleByCode[q.tcTopicCode] = q.tcTopicTitle;
    if (q.tcSectionCode && q.tcSectionTitle)
      sectionTitleByCode[q.tcSectionCode] = q.tcSectionTitle;
  }

  // Group answers by tcTopicCode
  const answersByTopic: Record<
    string,
    { correct: number; total: number; sectionCode: string }
  > = {};

  for (const q of questions) {
    const topicCode = q.tcTopicCode || `SECTION:${q.sectionId}`;
    const sectionCode = q.tcSectionCode || q.sectionId;

    if (!answersByTopic[topicCode]) {
      answersByTopic[topicCode] = { correct: 0, total: 0, sectionCode };
    }
    answersByTopic[topicCode].total++;

    const answer = userAnswers.find((a) => a.questionId === q.id);
    if (answer?.isCorrect) {
      answersByTopic[topicCode].correct++;
    }
  }

  return Object.entries(answersByTopic).map(
    ([topicCode, { correct, total, sectionCode }]) => {
      const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
      return {
        topicCode,
        topicTitle: topicTitleByCode[topicCode] || topicCode,
        sectionCode,
        sectionTitle: sectionTitleByCode[sectionCode] || sectionCode,
        correct,
        total,
        percentage,
        classification: classifyTopic(percentage),
      };
    },
  );
}
