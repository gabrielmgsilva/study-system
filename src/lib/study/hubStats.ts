import { prisma } from '@/lib/prisma';

export interface ModuleHubStats {
  progressPercent: number;
  flashcards: {
    mastered: string;
    total: string;
    lastSession: string;
    completion: string;
  };
  practice: {
    lastScore: string;
    questionsAnswered: string;
    accuracy: string;
  };
  test: {
    averageScore: string;
    testsCompleted: string;
    bestScore: string;
    avgTime: string;
    readiness: string;
  };
  detailedTracking: {
    easyCards: number;
    mediumCards: number;
    hardCards: number;
    practiceCorrect: number;
    practiceTotal: number;
    avgTimeMin: string;
  };
}

function formatLastSession(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Last session: just now';
  if (diffHours < 24) return `Last session: ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Last session: yesterday';
  if (diffDays < 7) return `Last session: ${diffDays} days ago`;
  return `Last session: ${date.toLocaleDateString()}`;
}

export async function getModuleHubStats(
  userId: number,
  moduleKey: string,
): Promise<ModuleHubStats> {
  const [progressRows, testSessions, latestPracticeSession, questionScores] =
    await Promise.all([
      prisma.studyProgress.findMany({
        where: { userId, moduleKey, deletedAt: null },
      }),
      prisma.studySession.findMany({
        where: {
          userId,
          moduleKey,
          mode: 'test',
          finishedAt: { not: null },
          deletedAt: null,
        },
        orderBy: { finishedAt: 'desc' },
        take: 30,
        select: { score: true, timeSpentMs: true, finishedAt: true },
      }),
      prisma.studySession.findFirst({
        where: {
          userId,
          moduleKey,
          mode: 'practice',
          finishedAt: { not: null },
          deletedAt: null,
        },
        orderBy: { finishedAt: 'desc' },
        select: { score: true },
      }),
      prisma.questionScore.findMany({
        where: { userId, moduleKey },
        select: { score: true },
      }),
    ]);

  const flashcardProgress = progressRows.find((r) => r.mode === 'flashcard');
  const practiceProgress = progressRows.find((r) => r.mode === 'practice');

  // Mastery breakdown: 4-5 = easy (mastered), 2-3 = medium, 0-1 = hard
  const easyCards = questionScores.filter((q) => q.score >= 4).length;
  const mediumCards = questionScores.filter((q) => q.score >= 2 && q.score < 4).length;
  const hardCards = questionScores.filter((q) => q.score < 2).length;
  const totalScored = questionScores.length;

  // Practice stats
  const practiceTotal = practiceProgress?.questionsTotal ?? 0;
  const practiceCorrect = practiceProgress?.questionsCorrect ?? 0;
  const practiceAccuracy =
    practiceTotal > 0 ? Math.round((practiceCorrect / practiceTotal) * 100) : 0;
  const lastPracticeScore =
    latestPracticeSession?.score != null
      ? `${Math.round(latestPracticeSession.score * 100)}%`
      : '–';

  // Test stats
  const testsCompleted = testSessions.length;
  const testScores = testSessions.map((s) => s.score ?? 0);
  const avgScore =
    testScores.length > 0
      ? Math.round((testScores.reduce((a, b) => a + b, 0) / testScores.length) * 100)
      : 0;
  const bestScore =
    testScores.length > 0 ? Math.round(Math.max(...testScores) * 100) : 0;
  const avgTimeMs =
    testSessions.length > 0
      ? testSessions.reduce((sum, s) => sum + s.timeSpentMs, 0) / testSessions.length
      : 0;
  const avgTimeMin = avgTimeMs > 0 ? `${Math.round(avgTimeMs / 60000)} min` : '–';

  // Last session label (flashcard takes priority, fall back to practice)
  const lastStudiedAt =
    flashcardProgress?.lastStudiedAt ?? practiceProgress?.lastStudiedAt ?? null;
  const lastSessionLabel = lastStudiedAt ? formatLastSession(lastStudiedAt) : '–';

  // Progress percent based on practice accuracy, or test best score as fallback
  const progressPercent = practiceAccuracy || bestScore;

  // Flashcard completion label
  const completionLabel =
    totalScored > 0
      ? `${easyCards}/${totalScored} mastered`
      : '–';

  return {
    progressPercent,
    flashcards: {
      mastered: String(easyCards),
      total: totalScored > 0 ? String(totalScored) : '–',
      lastSession: lastSessionLabel,
      completion: completionLabel,
    },
    practice: {
      lastScore: lastPracticeScore,
      questionsAnswered: practiceTotal > 0 ? String(practiceTotal) : '–',
      accuracy: practiceTotal > 0 ? `${practiceAccuracy}%` : '–',
    },
    test: {
      averageScore: avgScore > 0 ? `${avgScore}%` : '–',
      testsCompleted: String(testsCompleted),
      bestScore: bestScore > 0 ? `${bestScore}%` : '–',
      avgTime: avgTimeMin,
      readiness: bestScore > 0 ? `${bestScore}%` : '–',
    },
    detailedTracking: {
      easyCards,
      mediumCards,
      hardCards,
      practiceCorrect,
      practiceTotal,
      avgTimeMin,
    },
  };
}
