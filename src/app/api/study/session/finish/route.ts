import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getCurrentSessionServer } from '@/lib/currentUserServer';

class StudyFinishError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function asNonNegativeInt(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.floor(num);
}

function asScore(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 1) return null;
  return num;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSessionServer();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const studySessionId = asNonNegativeInt(body?.sessionId);
    const questionsTotal = asNonNegativeInt(body?.questionsTotal);
    const questionsAnswered = asNonNegativeInt(body?.questionsAnswered);
    const questionsCorrect = asNonNegativeInt(body?.questionsCorrect);
    const timeSpentMs = asNonNegativeInt(body?.timeSpentMs);
    const score = asScore(body?.score);

    if (
      !studySessionId ||
      questionsTotal === null ||
      questionsAnswered === null ||
      questionsCorrect === null ||
      timeSpentMs === null ||
      score === null
    ) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const studySession = await tx.studySession.findFirst({
        where: {
          id: studySessionId,
          userId: session.userId,
          deletedAt: null,
        },
      });

      if (!studySession) {
        throw new StudyFinishError(404, 'Study session not found.');
      }

      if (studySession.mode === 'flashcard') {
        throw new StudyFinishError(400, 'Flashcard sessions do not persist final results.');
      }

      const questionsIncorrect = Math.max(questionsAnswered - questionsCorrect, 0);
      const finishedAt = new Date();

      const updatedSession = await tx.studySession.update({
        where: { id: studySession.id },
        data: {
          finishedAt,
          questionsAnswered,
          questionsCorrect,
          score,
          timeSpentMs,
          details:
            JSON.stringify({
              ...(body?.details && typeof body.details === 'object' ? body.details : {}),
              questionsTotal,
            }),
        },
        select: {
          id: true,
          mode: true,
          licenseId: true,
          moduleKey: true,
        },
      });

      await tx.studyProgress.upsert({
        where: {
          userId_moduleKey_mode: {
            userId: session.userId,
            moduleKey: studySession.moduleKey,
            mode: studySession.mode,
          },
        },
        update: {
          questionsTotal: { increment: questionsTotal },
          questionsCorrect: { increment: questionsCorrect },
          questionsIncorrect: { increment: questionsIncorrect },
          totalTimeSpentMs: { increment: timeSpentMs },
          lastStudiedAt: finishedAt,
        },
        create: {
          userId: session.userId,
          licenseId: studySession.licenseId,
          moduleKey: studySession.moduleKey,
          mode: studySession.mode,
          questionsTotal,
          questionsCorrect,
          questionsIncorrect,
          totalTimeSpentMs: timeSpentMs,
          lastStudiedAt: finishedAt,
        },
      });

      return { ok: true, sessionId: updatedSession.id, mode: updatedSession.mode };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof StudyFinishError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    console.error('[STUDY_SESSION_FINISH]', error);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}