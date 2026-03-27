import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getCurrentSessionServer } from '@/lib/currentUserServer';
import {
  getSingleLicenseEntitlementSnapshot,
  normalizeLicenseId,
  normalizeStudyModuleKey,
} from '@/lib/studyAccess';

class StudyStartError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function isStudyMode(value: unknown): value is 'flashcard' | 'practice' | 'test' {
  return value === 'flashcard' || value === 'practice' || value === 'test';
}

function normalizeRequestedQuestionsTotal(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

function normalizeExamCost(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSessionServer();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const licenseId = normalizeLicenseId(String(body?.licenseId ?? ''));
    const mode = body?.mode;
    const requestedQuestionsTotal = normalizeRequestedQuestionsTotal(body?.requestedQuestionsTotal);
    const examCost = normalizeExamCost(body?.examCost);
    const moduleKey = normalizeStudyModuleKey(String(body?.moduleKey ?? ''), licenseId);

    if (!licenseId || !isStudyMode(mode) || !moduleKey || requestedQuestionsTotal <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Invalid study session payload' },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const snapshot = await getSingleLicenseEntitlementSnapshot(tx, session.userId, licenseId);
      if (!snapshot) {
        throw new StudyStartError(403, 'This license is not available for your account.');
      }

      let allowedQuestionsTotal = requestedQuestionsTotal;

      if (mode === 'flashcard') {
        const remaining = snapshot.usage.flashcardsRemaining;
        if (remaining !== null && remaining <= 0) {
          throw new StudyStartError(403, 'Flashcards limit reached for today.');
        }
        allowedQuestionsTotal = remaining === null
          ? requestedQuestionsTotal
          : Math.max(1, Math.min(requestedQuestionsTotal, remaining));
      }

      if (mode === 'practice') {
        const remaining = snapshot.usage.practiceRemaining;
        if (remaining !== null && remaining <= 0) {
          throw new StudyStartError(403, 'Practice limit reached for today.');
        }
      }

      let credits = 0;
      const account = await tx.creditAccount.findFirst({
        where: { userId: session.userId, deletedAt: null },
        select: { balance: true },
      });
      credits = account?.balance ?? 0;

      if (mode === 'test') {
        const remaining = snapshot.usage.testsRemaining;
        if (remaining !== null && remaining <= 0) {
          throw new StudyStartError(403, 'Test limit reached for this week.');
        }

        if (examCost > 0) {
          if (credits < examCost) {
            throw new StudyStartError(402, `You do not have enough exam credits. Required: ${examCost}.`);
          }

          await tx.creditAccount.update({
            where: { userId: session.userId },
            data: { balance: { decrement: examCost } },
          });

          await tx.creditLedger.create({
            data: {
              userId: session.userId,
              delta: -examCost,
              reason: `Start test ${moduleKey}`,
            },
          });

          credits -= examCost;
        }
      }

      const studySession = await tx.studySession.create({
        data: {
          userId: session.userId,
          licenseId,
          moduleKey,
          mode,
          questionsTotal: allowedQuestionsTotal,
          details: JSON.stringify({
            requestedQuestionsTotal,
            allowedQuestionsTotal,
            examCost,
          }),
        },
        select: { id: true },
      });

      const usage = {
        flashcardsToday:
          snapshot.usage.flashcardsToday + (mode === 'flashcard' ? allowedQuestionsTotal : 0),
        practiceToday: snapshot.usage.practiceToday + (mode === 'practice' ? 1 : 0),
        testsThisWeek: snapshot.usage.testsThisWeek + (mode === 'test' ? 1 : 0),
      };

      return {
        ok: true,
        sessionId: studySession.id,
        allowedQuestionsTotal,
        credits,
        licenseEntitlement: {
          ...snapshot,
          usage: {
            flashcardsToday: usage.flashcardsToday,
            flashcardsRemaining:
              snapshot.caps.flashcardsPerDay === null
                ? null
                : Math.max(snapshot.caps.flashcardsPerDay - usage.flashcardsToday, 0),
            practiceToday: usage.practiceToday,
            practiceRemaining:
              snapshot.caps.practicePerDay === null
                ? null
                : Math.max(snapshot.caps.practicePerDay - usage.practiceToday, 0),
            testsThisWeek: usage.testsThisWeek,
            testsRemaining:
              snapshot.caps.testsPerWeek === null
                ? null
                : Math.max(snapshot.caps.testsPerWeek - usage.testsThisWeek, 0),
          },
        },
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof StudyStartError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    console.error('[STUDY_SESSION_START]', error);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}