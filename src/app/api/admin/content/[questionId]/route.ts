import { NextRequest, NextResponse } from 'next/server';

import { updateQuestionFromParsed } from '@/lib/adminQuestionMutations';
import { parseQuestionPayload } from '@/lib/adminQuestionPayload';
import { prisma } from '@/lib/prisma';
import { isAuthError, requireAdmin } from '@/lib/guards';

function parseQuestionId(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> },
) {
  void req;

  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { questionId: questionIdParam } = await params;
  const questionId = parseQuestionId(questionIdParam);
  if (!questionId) {
    return NextResponse.json({ ok: false, error: 'Invalid question id' }, { status: 400 });
  }

  const question = await prisma.question.findFirst({
    where: { id: questionId, deletedAt: null },
    include: {
      topic: {
        include: {
          subject: {
            include: {
              module: {
                include: {
                  license: true,
                },
              },
            },
          },
        },
      },
      options: {
        where: { deletedAt: null },
        orderBy: { displayOrder: 'asc' },
        include: {
          explanation: true,
        },
      },
      explanation: true,
      references: {
        where: { deletedAt: null },
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  if (!question) {
    return NextResponse.json({ ok: false, error: 'Question not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item: question });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> },
) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { questionId: questionIdParam } = await params;
  const questionId = parseQuestionId(questionIdParam);
  if (!questionId) {
    return NextResponse.json({ ok: false, error: 'Invalid question id' }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = parseQuestionPayload(body);
  if ('error' in parsed) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const existing = await prisma.question.findFirst({
    where: { id: questionId, deletedAt: null },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ ok: false, error: 'Question not found' }, { status: 404 });
  }

  const topic = await prisma.topic.findFirst({
    where: { id: parsed.data.topicId, deletedAt: null },
    select: { id: true },
  });

  if (!topic) {
    return NextResponse.json({ ok: false, error: 'Topic not found' }, { status: 404 });
  }

  const duplicate = await prisma.question.findFirst({
    where: {
      deletedAt: null,
      id: { not: questionId },
      externalId: parsed.data.externalId,
      locale: parsed.data.locale,
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json({ ok: false, error: 'A question already exists for this external id and locale.' }, { status: 409 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    await updateQuestionFromParsed(tx, questionId, parsed.data, auth.userId);

    return tx.question.findFirst({
      where: { id: questionId },
      include: {
        topic: {
          include: {
            subject: {
              include: {
                module: {
                  include: {
                    license: true,
                  },
                },
              },
            },
          },
        },
        options: {
          where: { deletedAt: null },
          orderBy: { displayOrder: 'asc' },
          include: {
            explanation: true,
          },
        },
        explanation: true,
        references: {
          where: { deletedAt: null },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  });

  return NextResponse.json({ ok: true, item: updated });
}
