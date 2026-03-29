import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getCurrentSessionServer } from '@/lib/currentUserServer';
import { getSubscriptionStatus } from '@/lib/subscriptionGuard';
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

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSessionServer();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription validity before any study access
    const sub = await getSubscriptionStatus(session.userId);
    if (!sub.active) {
      return NextResponse.json(
        { ok: false, error: 'subscription_expired', message: 'Your subscription has expired. Please subscribe to continue studying.' },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const licenseId = normalizeLicenseId(String(body?.licenseId ?? ''));
    const mode = body?.mode;
    const requestedQuestionsTotal = normalizeRequestedQuestionsTotal(body?.requestedQuestionsTotal);
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

      if (
        snapshot.caps.maxQuestionsPerSession !== null &&
        allowedQuestionsTotal > snapshot.caps.maxQuestionsPerSession
      ) {
        allowedQuestionsTotal = snapshot.caps.maxQuestionsPerSession;
      }

      if (mode === 'flashcard') {
        const remaining = snapshot.usage.flashcardsRemaining;
        if (remaining !== null && remaining <= 0) {
          throw new StudyStartError(403, 'Flashcards limit reached for today.');
        }
      }

      if (mode === 'practice') {
        const remaining = snapshot.usage.practiceRemaining;
        if (remaining !== null && remaining <= 0) {
          throw new StudyStartError(403, 'Practice limit reached for today.');
        }
      }

      if (mode === 'test') {
        const remaining = snapshot.usage.testsRemaining;
        if (remaining !== null && remaining <= 0) {
          throw new StudyStartError(403, 'Test limit reached for this week.');
        }
      }

      const studySession = await tx.studySession.create({
        data: {
          userId: session.userId,
          licenseId,
          moduleKey,
          mode,
          questionsAnswered: 0,
          details: JSON.stringify({
            requestedQuestionsTotal,
            allowedQuestionsTotal,
          }),
        },
        select: { id: true },
      });

      const usage = {
        flashcardsUsed: snapshot.usage.flashcardsUsed + (mode === 'flashcard' ? 1 : 0),
        practiceUsed: snapshot.usage.practiceUsed + (mode === 'practice' ? 1 : 0),
        testsUsed: snapshot.usage.testsUsed + (mode === 'test' ? 1 : 0),
      };

      return {
        ok: true,
        sessionId: studySession.id,
        allowedQuestionsTotal,
        licenseEntitlement: {
          ...snapshot,
          usage: {
            flashcardsUsed: usage.flashcardsUsed,
            flashcardsRemaining:
              snapshot.caps.flashcards.limit === null
                ? null
                : Math.max(snapshot.caps.flashcards.limit - usage.flashcardsUsed, 0),
            practiceUsed: usage.practiceUsed,
            practiceRemaining:
              snapshot.caps.practice.limit === null
                ? null
                : Math.max(snapshot.caps.practice.limit - usage.practiceUsed, 0),
            testsUsed: usage.testsUsed,
            testsRemaining:
              snapshot.caps.test.limit === null
                ? null
                : Math.max(snapshot.caps.test.limit - usage.testsUsed, 0),
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