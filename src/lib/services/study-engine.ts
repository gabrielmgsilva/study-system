import 'server-only';

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// ── Public types ────────────────────────────────────────────────────────────

export interface SelectedQuestion {
  id: number;
  externalId: string;
  stem: string;
  difficulty: number | null;
  topicCode: string;
  topicName: string;
  subjectCode: string;
  options: { key: string; text: string }[];
  correctKey: string;
  explanation: string | null;
  references: { document: string | null; locator: string | null }[];
}

export interface SessionResult {
  score: number;
  correct: number;
  total: number;
  difficultyChange: 'up' | 'down' | 'stable';
  currentDifficulty: number;
  weakTopics: { topicCode: string; errorRate: number }[];
}

// ── Internal types ──────────────────────────────────────────────────────────

type QuestionRow = {
  id: number;
  externalId: string;
  stem: string;
  difficulty: number | null;
  topic: {
    code: string;
    name: string;
    subject: { code: string };
  };
  options: { optionKey: string; text: string; isCorrect: boolean }[];
  explanation: { correctExplanation: string | null } | null;
  references: { document: string | null; locator: string | null }[];
};

const DEFAULT_COUNTS: Record<string, number> = {
  flashcard: 10,
  practice: 15,
  test: 40,
  quick_review: 5,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function fisherYatesShuffle<T>(arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function mapQuestion(q: QuestionRow): SelectedQuestion {
  const shuffledOpts = fisherYatesShuffle(q.options);
  return {
    id: q.id,
    externalId: q.externalId,
    stem: q.stem,
    difficulty: q.difficulty,
    topicCode: q.topic.code,
    topicName: q.topic.name,
    subjectCode: q.topic.subject.code,
    options: shuffledOpts.map((o) => ({ key: o.optionKey, text: o.text })),
    correctKey: q.options.find((o) => o.isCorrect)?.optionKey ?? '',
    explanation: q.explanation?.correctExplanation ?? null,
    references: q.references.map((r) => ({
      document: r.document,
      locator: r.locator,
    })),
  };
}

/** Fetch published, non-deleted questions with full relations. */
async function fetchQuestions(
  extraWhere: Prisma.QuestionWhereInput,
): Promise<QuestionRow[]> {
  return prisma.question.findMany({
    where: {
      AND: [{ status: 'published', deletedAt: null }, extraWhere],
    },
    select: {
      id: true,
      externalId: true,
      stem: true,
      difficulty: true,
      topic: {
        select: {
          code: true,
          name: true,
          subject: { select: { code: true } },
        },
      },
      options: {
        where: { deletedAt: null },
        select: { optionKey: true, text: true, isCorrect: true },
        orderBy: { displayOrder: 'asc' },
      },
      explanation: {
        select: { correctExplanation: true },
      },
      references: {
        where: { deletedAt: null },
        select: { document: true, locator: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
  }) as Promise<QuestionRow[]>;
}

/** Fetch questions, expanding difficulty range if not enough results. */
async function fetchWithExpansion(
  baseWhere: Prisma.QuestionWhereInput,
  difficulty: number,
  initialRange: number,
  needed: number,
): Promise<QuestionRow[]> {
  // Try initial difficulty range
  let questions = await fetchQuestions({
    AND: [
      baseWhere,
      {
        difficulty: {
          gte: Math.max(1, difficulty - initialRange),
          lte: Math.min(5, difficulty + initialRange),
        },
      },
    ],
  });
  if (questions.length >= needed) return questions;

  // Expand to ±2
  if (initialRange < 2) {
    questions = await fetchQuestions({
      AND: [
        baseWhere,
        {
          difficulty: {
            gte: Math.max(1, difficulty - 2),
            lte: Math.min(5, difficulty + 2),
          },
        },
      ],
    });
    if (questions.length >= needed) return questions;
  }

  // No difficulty filter
  return fetchQuestions(baseWhere);
}

/** Collect shuffled candidates into the map, up to `maxTotal` entries. */
function collectUpTo(
  collected: Map<number, QuestionRow>,
  candidates: QuestionRow[],
  maxTotal: number,
): void {
  for (const q of fisherYatesShuffle(candidates)) {
    if (collected.size >= maxTotal) break;
    if (!collected.has(q.id)) collected.set(q.id, q);
  }
}

// ── Exclusion helpers ───────────────────────────────────────────────────────

async function getRecentlyCorrectExternalIds(
  userId: number,
  moduleKey: string,
): Promise<string[]> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const answers = await prisma.sessionAnswer.findMany({
    where: {
      isCorrect: true,
      answeredAt: { gte: cutoff },
      session: { userId, moduleKey, deletedAt: null },
    },
    select: { questionExternalId: true },
    distinct: ['questionExternalId'],
  });
  return answers.map((a) => a.questionExternalId);
}

async function getLastTestExternalIds(
  userId: number,
  moduleKey: string,
): Promise<string[]> {
  const lastTest = await prisma.testAttempt.findFirst({
    where: { userId, moduleKey, status: 'completed' },
    orderBy: { finishedAt: 'desc' },
    select: { questionIds: true },
  });
  if (!lastTest) return [];
  try {
    const ids = JSON.parse(lastTest.questionIds);
    return Array.isArray(ids) ? ids.map(String) : [];
  } catch {
    return [];
  }
}

// ── selectQuestions ─────────────────────────────────────────────────────────

export async function selectQuestions(
  userId: number,
  moduleKey: string,
  mode: 'flashcard' | 'practice' | 'test' | 'quick_review',
  count?: number,
): Promise<SelectedQuestion[]> {
  const total = count ?? DEFAULT_COUNTS[mode];

  if (mode === 'quick_review') {
    return selectQuickReview(userId, total);
  }

  // Parallel reads
  const [engine, weakTrackers, excludeIds] = await Promise.all([
    prisma.studyEngine
      .findUnique({ where: { userId_moduleKey: { userId, moduleKey } } })
      .then((e) => e ?? { currentDifficulty: 3 }),
    prisma.weakTopicTracker.findMany({
      where: { userId, moduleKey, priority: { gt: 0 } },
      orderBy: { priority: 'desc' },
      select: { topicCode: true },
    }),
    mode === 'flashcard'
      ? getRecentlyCorrectExternalIds(userId, moduleKey)
      : mode === 'test'
        ? getLastTestExternalIds(userId, moduleKey)
        : Promise.resolve([] as string[]),
  ]);

  const difficulty = engine.currentDifficulty;
  const weakTopicCodes = weakTrackers.map((t) => t.topicCode);

  // Base filter: questions in this module, excluding specific IDs
  const moduleWhere: Prisma.QuestionWhereInput = {
    topic: { subject: { module: { moduleKey } } },
    ...(excludeIds.length > 0
      ? { externalId: { notIn: excludeIds } }
      : {}),
  };

  const collected = new Map<number, QuestionRow>();

  if (mode === 'test') {
    await fillTestQuestions(
      collected,
      moduleWhere,
      moduleKey,
      difficulty,
      total,
    );
  } else {
    // Bucket percentages
    const weakPct = mode === 'flashcard' ? 0.6 : 0.4;
    const diffPct = mode === 'flashcard' ? 0.2 : 0.4;
    const weakTarget = Math.round(total * weakPct);
    const diffTarget = Math.round(total * diffPct);

    // 1. Weak topic questions
    if (weakTarget > 0 && weakTopicCodes.length > 0) {
      const weakQuestions = await fetchQuestions({
        AND: [moduleWhere, { topic: { code: { in: weakTopicCodes } } }],
      });
      collectUpTo(collected, weakQuestions, weakTarget);
    }

    // 2. Difficulty-matched questions (exact for flashcard, ±1 for practice)
    if (diffTarget > 0) {
      const diffRange = mode === 'flashcard' ? 0 : 1;
      const diffBase: Prisma.QuestionWhereInput = {
        AND: [moduleWhere, { id: { notIn: [...collected.keys()] } }],
      };
      const diffQuestions = await fetchWithExpansion(
        diffBase,
        difficulty,
        diffRange,
        diffTarget,
      );
      collectUpTo(collected, diffQuestions, collected.size + diffTarget);
    }

    // 3. Random fill
    const remaining = total - collected.size;
    if (remaining > 0) {
      const randomQuestions = await fetchQuestions({
        AND: [moduleWhere, { id: { notIn: [...collected.keys()] } }],
      });
      collectUpTo(collected, randomQuestions, total);
    }
  }

  return fisherYatesShuffle([...collected.values()]).map(mapQuestion);
}

// ── Quick review (cross-module) ─────────────────────────────────────────────

async function selectQuickReview(
  userId: number,
  count: number,
): Promise<SelectedQuestion[]> {
  const now = new Date();

  // Cross-module weak topics: priority DESC, nextReviewDate <= now
  const trackers = await prisma.weakTopicTracker.findMany({
    where: {
      userId,
      priority: { gt: 0 },
      nextReviewDate: { lte: now },
    },
    orderBy: { priority: 'desc' },
    select: { moduleKey: true, topicCode: true },
  });

  const collected = new Map<number, QuestionRow>();

  if (trackers.length > 0) {
    // Group topic codes by module
    const byModule = new Map<string, string[]>();
    for (const t of trackers) {
      const codes = byModule.get(t.moduleKey) ?? [];
      codes.push(t.topicCode);
      byModule.set(t.moduleKey, codes);
    }

    const orConditions = [...byModule.entries()].map(([mk, codes]) => ({
      topic: {
        code: { in: codes },
        subject: { module: { moduleKey: mk } },
      },
    }));

    const weakQuestions = await fetchQuestions({ OR: orConditions });
    collectUpTo(collected, weakQuestions, count);
  }

  // Fill remaining from any enrolled module
  if (collected.size < count) {
    const entitlements = await prisma.licenseEntitlement.findMany({
      where: { userId, isActive: true, deletedAt: null },
      select: { licenseId: true },
    });

    if (entitlements.length > 0) {
      const licenseIds = entitlements.map((e) => e.licenseId);
      const randomQuestions = await fetchQuestions({
        id: { notIn: [...collected.keys()] },
        topic: {
          subject: {
            module: { licenseId: { in: licenseIds } },
          },
        },
      });
      collectUpTo(collected, randomQuestions, count);
    }
  }

  return fisherYatesShuffle([...collected.values()]).map(mapQuestion);
}

// ── Test mode: proportional by subject weight ───────────────────────────────

async function fillTestQuestions(
  collected: Map<number, QuestionRow>,
  moduleWhere: Prisma.QuestionWhereInput,
  moduleKey: string,
  difficulty: number,
  total: number,
): Promise<void> {
  const subjects = await prisma.subject.findMany({
    where: {
      module: { moduleKey },
      isActive: true,
      deletedAt: null,
    },
    select: { id: true, code: true, weight: true },
  });

  if (subjects.length === 0) return;

  const totalWeight = subjects.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return;

  // Proportional allocation
  const allocations = subjects.map((s) => ({
    subjectId: s.id,
    target: Math.max(1, Math.round((s.weight / totalWeight) * total)),
  }));

  // Adjust so the sum equals total exactly
  allocations.sort((a, b) => b.target - a.target);
  let allocated = allocations.reduce((sum, a) => sum + a.target, 0);
  let idx = 0;
  while (allocated > total) {
    if (allocations[idx].target > 1) {
      allocations[idx].target--;
      allocated--;
    }
    idx = (idx + 1) % allocations.length;
  }
  while (allocated < total) {
    allocations[idx % allocations.length].target++;
    allocated++;
    idx++;
  }

  // Fetch per subject with difficulty expansion
  for (const alloc of allocations) {
    const subjectWhere: Prisma.QuestionWhereInput = {
      AND: [
        moduleWhere,
        {
          id: { notIn: [...collected.keys()] },
          topic: { subjectId: alloc.subjectId },
        },
      ],
    };
    const questions = await fetchWithExpansion(
      subjectWhere,
      difficulty,
      1, // ±1 initial range for test mode
      alloc.target,
    );
    collectUpTo(collected, questions, collected.size + alloc.target);
  }
}

// ── updateAfterSession ──────────────────────────────────────────────────────

export async function updateAfterSession(
  userId: number,
  moduleKey: string,
  sessionId: number,
): Promise<SessionResult> {
  // Pre-fetch data outside the write transaction
  const [answers, session] = await Promise.all([
    prisma.sessionAnswer.findMany({
      where: { sessionId },
      select: {
        questionExternalId: true,
        isCorrect: true,
        tcTopicCode: true,
      },
    }),
    prisma.studySession.findUniqueOrThrow({
      where: { id: sessionId },
      select: { licenseId: true },
    }),
  ]);

  if (answers.length === 0) {
    return {
      score: 0,
      correct: 0,
      total: 0,
      difficultyChange: 'stable',
      currentDifficulty: 3,
      weakTopics: [],
    };
  }

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const sessionScore = (correctCount / answers.length) * 100;

  return prisma.$transaction(
    async (tx) => {
      const now = new Date();

      // ── 1. StudyEngine: sliding-window difficulty adjustment ──────────
      const engine = await tx.studyEngine.upsert({
        where: { userId_moduleKey: { userId, moduleKey } },
        create: {
          userId,
          licenseId: session.licenseId,
          moduleKey,
        },
        update: {},
      });

      const recentScores: number[] = JSON.parse(engine.recentScores);
      recentScores.push(sessionScore);
      while (recentScores.length > engine.windowSize) {
        recentScores.shift();
      }

      const avg =
        recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

      let newDifficulty = engine.currentDifficulty;
      let trend: 'up' | 'down' | 'stable' = 'stable';

      if (avg >= engine.upperThreshold) {
        newDifficulty = Math.min(5, newDifficulty + 1);
        trend = 'up';
      } else if (avg <= engine.lowerThreshold) {
        newDifficulty = Math.max(1, newDifficulty - 1);
        trend = 'down';
      }

      const newTotalSessions = engine.totalSessions + 1;
      const newAvgScore =
        (engine.avgScore * engine.totalSessions + sessionScore) /
        newTotalSessions;

      await tx.studyEngine.update({
        where: { userId_moduleKey: { userId, moduleKey } },
        data: {
          recentScores: JSON.stringify(recentScores),
          currentDifficulty: newDifficulty,
          difficultyTrend: trend,
          totalSessions: newTotalSessions,
          avgScore: newAvgScore,
        },
      });

      // ── 2. WeakTopicTrackers ──────────────────────────────────────────
      const topicCodes = [
        ...new Set(
          answers
            .map((a) => a.tcTopicCode)
            .filter((tc): tc is string => tc != null),
        ),
      ];
      const updatedTrackers: { topicCode: string; errorRate: number }[] = [];

      for (const topicCode of topicCodes) {
        const topicAnswers = answers.filter(
          (a) => a.tcTopicCode === topicCode,
        );

        const tracker = await tx.weakTopicTracker.upsert({
          where: {
            userId_moduleKey_topicCode: { userId, moduleKey, topicCode },
          },
          create: { userId, moduleKey, topicCode },
          update: {},
        });

        let { errorCount, totalAttempts, consecutiveCorrect, lastErrorAt } =
          tracker;
        let nextReviewDate = tracker.nextReviewDate;

        for (const answer of topicAnswers) {
          totalAttempts++;
          if (!answer.isCorrect) {
            errorCount++;
            lastErrorAt = now;
            consecutiveCorrect = 0;
          } else {
            consecutiveCorrect++;
          }
        }

        const errorRate =
          totalAttempts > 0 ? errorCount / totalAttempts : 0;

        // Priority = errorRate × recencyWeight × frequencyWeight
        let recencyWeight = 0.4;
        if (lastErrorAt) {
          const daysSinceError =
            (now.getTime() - lastErrorAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceError < 7) recencyWeight = 1.0;
          else if (daysSinceError <= 30) recencyWeight = 0.7;
        }
        const frequencyWeight = Math.min(totalAttempts / 10, 1.0);
        let priority = errorRate * recencyWeight * frequencyWeight;

        // Mastered: low error rate with enough attempts
        if (errorRate < 0.2 && totalAttempts >= 10) {
          priority = 0;
        }

        // Spaced repetition for correct answers on active weak topics
        const lastAnswer = topicAnswers[topicAnswers.length - 1];
        if (lastAnswer.isCorrect && priority > 0) {
          const days = Math.min(
            Math.pow(2, consecutiveCorrect),
            30,
          );
          nextReviewDate = new Date(
            now.getTime() + days * 24 * 60 * 60 * 1000,
          );
        }

        await tx.weakTopicTracker.update({
          where: {
            userId_moduleKey_topicCode: { userId, moduleKey, topicCode },
          },
          data: {
            errorCount,
            totalAttempts,
            consecutiveCorrect,
            lastErrorAt,
            errorRate,
            priority,
            nextReviewDate,
          },
        });

        if (priority > 0) {
          updatedTrackers.push({ topicCode, errorRate });
        }
      }

      // ── 3. QuestionScores ─────────────────────────────────────────────
      for (const answer of answers) {
        const existing = await tx.questionScore.findUnique({
          where: {
            userId_questionExternalId: {
              userId,
              questionExternalId: answer.questionExternalId,
            },
          },
          select: { score: true },
        });

        const currentScore = existing?.score ?? 3;
        const newScore = answer.isCorrect
          ? Math.min(5, currentScore + 1)
          : Math.max(0, currentScore - 1);

        await tx.questionScore.upsert({
          where: {
            userId_questionExternalId: {
              userId,
              questionExternalId: answer.questionExternalId,
            },
          },
          create: {
            userId,
            moduleKey,
            questionExternalId: answer.questionExternalId,
            score: newScore,
            timesCorrect: answer.isCorrect ? 1 : 0,
            timesIncorrect: answer.isCorrect ? 0 : 1,
            lastAnsweredAt: now,
          },
          update: {
            score: newScore,
            ...(answer.isCorrect
              ? { timesCorrect: { increment: 1 } }
              : { timesIncorrect: { increment: 1 } }),
            lastAnsweredAt: now,
          },
        });
      }

      return {
        score: sessionScore,
        correct: correctCount,
        total: answers.length,
        difficultyChange: trend,
        currentDifficulty: newDifficulty,
        weakTopics: updatedTrackers.sort(
          (a, b) => b.errorRate - a.errorRate,
        ),
      };
    },
    { maxWait: 10000, timeout: 30000 },
  );
}
