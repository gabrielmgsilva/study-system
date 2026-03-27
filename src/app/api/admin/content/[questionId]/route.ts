import type { ContentLocale, QuestionStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { isAuthError, requireAdmin } from '@/lib/guards';

const CONTENT_LOCALES = ['en', 'pt'] as const satisfies readonly ContentLocale[];
const QUESTION_STATUSES = ['draft', 'review', 'published', 'archived'] as const satisfies readonly QuestionStatus[];
const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

function parseQuestionId(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseLocale(value: string): ContentLocale | null {
  return CONTENT_LOCALES.includes(value as ContentLocale) ? (value as ContentLocale) : null;
}

function parseStatus(value: string): QuestionStatus | null {
  return QUESTION_STATUSES.includes(value as QuestionStatus) ? (value as QuestionStatus) : null;
}

function parseNullableInt(value: unknown) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 30);
  }

  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function normalizeReference(value: unknown) {
  if (!value || typeof value !== 'object') return null;

  const next = {
    document: String((value as Record<string, unknown>).document ?? '').trim() || null,
    area: String((value as Record<string, unknown>).area ?? '').trim() || null,
    topicRef: String((value as Record<string, unknown>).topicRef ?? '').trim() || null,
    locator: String((value as Record<string, unknown>).locator ?? '').trim() || null,
    note: String((value as Record<string, unknown>).note ?? '').trim() || null,
  };

  return Object.values(next).some(Boolean) ? next : null;
}

function parseQuestionPayload(body: Record<string, unknown>) {
  const externalId = String(body.externalId ?? '').trim();
  const topicId = Number(body.topicId);
  const locale = parseLocale(String(body.locale ?? ''));
  const status = parseStatus(String(body.status ?? ''));
  const stem = String(body.stem ?? '').trim();
  const difficulty = parseNullableInt(body.difficulty);
  const sourceFile = String(body.sourceFile ?? '').trim() || null;
  const correctExplanation = String(body.correctExplanation ?? '').trim() || null;
  const correctOptionKey = String(body.correctOptionKey ?? '').trim().toUpperCase();
  const rawOptions = Array.isArray(body.options) ? body.options : [];

  if (!externalId || !Number.isInteger(topicId) || topicId <= 0 || !locale || !status || !stem) {
    return { error: 'Missing required question fields.' } as const;
  }

  if (difficulty === undefined) {
    return { error: 'Difficulty must be empty or a non-negative integer.' } as const;
  }

  if (!OPTION_KEYS.includes(correctOptionKey as (typeof OPTION_KEYS)[number])) {
    return { error: 'Select a valid correct option.' } as const;
  }

  const options = OPTION_KEYS.map((key, index) => {
    const match = rawOptions.find(
      (option) =>
        option &&
        typeof option === 'object' &&
        String((option as Record<string, unknown>).key ?? '')
          .trim()
          .toUpperCase() === key,
    ) as Record<string, unknown> | undefined;

    const text = String(match?.text ?? '').trim();
    return {
      key,
      text,
      isCorrect: key === correctOptionKey,
      displayOrder: index,
    };
  });

  if (options.some((option) => !option.text)) {
    return { error: 'All option texts are required.' } as const;
  }

  const references = (Array.isArray(body.references) ? body.references : [])
    .map(normalizeReference)
    .filter(Boolean) as Array<{
      document: string | null;
      area: string | null;
      topicRef: string | null;
      locator: string | null;
      note: string | null;
    }>;

  return {
    data: {
      externalId,
      topicId,
      locale,
      status,
      stem,
      difficulty,
      sourceFile,
      tags: normalizeTags(body.tags),
      correctExplanation,
      options,
      references,
    },
  } as const;
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
    await tx.question.update({
      where: { id: questionId },
      data: {
        externalId: parsed.data.externalId,
        topicId: parsed.data.topicId,
        locale: parsed.data.locale,
        stem: parsed.data.stem,
        difficulty: parsed.data.difficulty,
        status: parsed.data.status,
        tags: parsed.data.tags,
        sourceFile: parsed.data.sourceFile,
        reviewedById: auth.userId,
        version: { increment: 1 },
      },
    });

    for (const option of parsed.data.options) {
      await tx.questionOption.upsert({
        where: {
          questionId_optionKey: {
            questionId,
            optionKey: option.key,
          },
        },
        update: {
          text: option.text,
          isCorrect: option.isCorrect,
          displayOrder: option.displayOrder,
          deletedAt: null,
        },
        create: {
          questionId,
          optionKey: option.key,
          text: option.text,
          isCorrect: option.isCorrect,
          displayOrder: option.displayOrder,
        },
      });
    }

    if (parsed.data.correctExplanation) {
      await tx.questionExplanation.upsert({
        where: { questionId },
        update: { correctExplanation: parsed.data.correctExplanation, deletedAt: null },
        create: { questionId, correctExplanation: parsed.data.correctExplanation },
      });
    } else {
      await tx.questionExplanation.deleteMany({ where: { questionId } });
    }

    await tx.questionReference.deleteMany({ where: { questionId } });

    if (parsed.data.references.length > 0) {
      await tx.questionReference.createMany({
        data: parsed.data.references.map((reference, index) => ({
          questionId,
          document: reference.document,
          area: reference.area,
          topicRef: reference.topicRef,
          locator: reference.locator,
          note: reference.note,
          displayOrder: index,
        })),
      });
    }

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
