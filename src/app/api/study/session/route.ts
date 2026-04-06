import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSessionServer } from '@/lib/currentUserServer';
import { prisma } from '@/lib/prisma';
import { selectQuestions } from '@/lib/services/study-engine';
import { updateAfterSession } from '@/lib/services/study-engine';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSessionServer();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { moduleKey, mode, licenseId, isQuickReview } = body ?? {};

    if (!moduleKey || !licenseId) {
      return NextResponse.json({ ok: false, error: 'Missing moduleKey or licenseId' }, { status: 400 });
    }

    const validModes = ['flashcard', 'practice', 'test'] as const;
    const studyMode = validModes.includes(mode) ? mode : 'practice';

    const questionMode = isQuickReview ? 'quick_review' : studyMode;
    const questions = await selectQuestions(session.userId, moduleKey, questionMode);

    const studySession = await prisma.studySession.create({
      data: {
        userId: session.userId,
        licenseId,
        moduleKey,
        mode: studyMode,
        questionsAnswered: 0,
        isQuickReview: !!isQuickReview,
      },
      select: { id: true },
    });

    return NextResponse.json({
      ok: true,
      sessionId: studySession.id,
      questions: questions.map((q) => ({
        id: q.id,
        externalId: q.externalId,
        stem: q.stem,
        difficulty: q.difficulty,
        topicCode: q.topicCode,
        topicName: q.topicName,
        subjectCode: q.subjectCode,
        options: q.options,
        correctKey: q.correctKey,
        explanation: q.explanation,
        references: q.references,
      })),
    });
  } catch (error) {
    console.error('[STUDY_SESSION_CREATE]', error);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentSessionServer();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { sessionId, timeSpentMs } = body ?? {};

    if (!sessionId) {
      return NextResponse.json({ ok: false, error: 'Missing sessionId' }, { status: 400 });
    }

    const studySession = await prisma.studySession.findFirst({
      where: { id: sessionId, userId: session.userId, deletedAt: null },
      select: { id: true, moduleKey: true, finishedAt: true },
    });

    if (!studySession) {
      return NextResponse.json({ ok: false, error: 'Session not found' }, { status: 404 });
    }

    if (studySession.finishedAt) {
      return NextResponse.json({ ok: false, error: 'Session already finished' }, { status: 400 });
    }

    await prisma.studySession.update({
      where: { id: sessionId },
      data: {
        finishedAt: new Date(),
        timeSpentMs: typeof timeSpentMs === 'number' ? timeSpentMs : 0,
      },
    });

    const result = await updateAfterSession(
      session.userId,
      studySession.moduleKey,
      sessionId,
    );

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('[STUDY_SESSION_FINISH]', error);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
