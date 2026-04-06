import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSessionServer } from '@/lib/currentUserServer';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSessionServer();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      sessionId,
      questionExternalId,
      selectedAnswer,
      isCorrect,
      tcSectionCode,
      tcTopicCode,
    } = body ?? {};

    if (!sessionId || !questionExternalId || typeof selectedAnswer !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Verify ownership
    const studySession = await prisma.studySession.findFirst({
      where: { id: sessionId, userId: session.userId, deletedAt: null },
      select: { id: true },
    });

    if (!studySession) {
      return NextResponse.json(
        { ok: false, error: 'Session not found' },
        { status: 404 },
      );
    }

    await prisma.sessionAnswer.upsert({
      where: {
        sessionId_questionExternalId: {
          sessionId,
          questionExternalId: String(questionExternalId),
        },
      },
      update: {
        selectedAnswer: String(selectedAnswer),
        isCorrect: !!isCorrect,
        tcSectionCode: tcSectionCode ? String(tcSectionCode) : null,
        tcTopicCode: tcTopicCode ? String(tcTopicCode) : null,
        answeredAt: new Date(),
      },
      create: {
        sessionId,
        questionExternalId: String(questionExternalId),
        selectedAnswer: String(selectedAnswer),
        isCorrect: !!isCorrect,
        tcSectionCode: tcSectionCode ? String(tcSectionCode) : null,
        tcTopicCode: tcTopicCode ? String(tcTopicCode) : null,
      },
    });

    // Increment answered count
    await prisma.studySession.update({
      where: { id: sessionId },
      data: { questionsAnswered: { increment: 1 } },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[SESSION_ANSWER]', error);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
