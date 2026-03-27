import type { ContentLocale, Prisma, QuestionStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { isAuthError, requireAdmin } from '@/lib/guards';

const CONTENT_LOCALES = ['en', 'pt'] as const satisfies readonly ContentLocale[];
const QUESTION_STATUSES = ['draft', 'review', 'published', 'archived'] as const satisfies readonly QuestionStatus[];
const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

function parsePage(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function parsePageSize(value: string | null) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return 12;
  return Math.min(parsed, 50);
}

function parseOptionalId(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseLocale(value: string | null): ContentLocale | null {
  if (!value) return null;
  return CONTENT_LOCALES.includes(value as ContentLocale) ? (value as ContentLocale) : null;
}

function parseStatus(value: string | null): QuestionStatus | null {
  if (!value) return null;
  return QUESTION_STATUSES.includes(value as QuestionStatus) ? (value as QuestionStatus) : null;
}

function parseNullableInt(value: unknown) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 30);
  }

  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function normalizeReference(value: unknown) {
  if (!value || typeof value !== 'object') return null;

  const ref = {
    document: String((value as Record<string, unknown>).document ?? '').trim() || null,
    area: String((value as Record<string, unknown>).area ?? '').trim() || null,
    topicRef: String((value as Record<string, unknown>).topicRef ?? '').trim() || null,
    locator: String((value as Record<string, unknown>).locator ?? '').trim() || null,
    note: String((value as Record<string, unknown>).note ?? '').trim() || null,
  };

  return Object.values(ref).some(Boolean) ? ref : null;
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

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const q = String(req.nextUrl.searchParams.get('q') ?? '').trim();
  const licenseId = String(req.nextUrl.searchParams.get('licenseId') ?? '').trim().toLowerCase();
  const moduleId = parseOptionalId(req.nextUrl.searchParams.get('moduleId'));
  const subjectId = parseOptionalId(req.nextUrl.searchParams.get('subjectId'));
  const topicId = parseOptionalId(req.nextUrl.searchParams.get('topicId'));
  const locale = parseLocale(req.nextUrl.searchParams.get('locale'));
  const status = parseStatus(req.nextUrl.searchParams.get('status'));
  const page = parsePage(req.nextUrl.searchParams.get('page'));
  const pageSize = parsePageSize(req.nextUrl.searchParams.get('pageSize'));

  const relationFilter: Prisma.TopicWhereInput = {
    ...(topicId ? { id: topicId } : {}),
    ...(subjectId ? { subjectId } : {}),
    ...(moduleId ? { subject: { moduleId } } : {}),
    ...(licenseId ? { subject: { module: { licenseId } } } : {}),
  };

  const where: Prisma.QuestionWhereInput = {
    deletedAt: null,
    ...(locale ? { locale } : {}),
    ...(status ? { status } : {}),
    ...(topicId || subjectId || moduleId || licenseId ? { topic: relationFilter } : {}),
    ...(q
      ? {
          OR: [
            { externalId: { contains: q, mode: 'insensitive' } },
            { stem: { contains: q, mode: 'insensitive' } },
            { sourceFile: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ updatedAt: 'desc' }],
      select: {
        id: true,
        externalId: true,
        locale: true,
        stem: true,
        difficulty: true,
        status: true,
        tags: true,
        updatedAt: true,
        topic: {
          select: {
            id: true,
            code: true,
            name: true,
            subject: {
              select: {
                id: true,
                code: true,
                name: true,
                module: {
                  select: {
                    id: true,
                    name: true,
                    moduleKey: true,
                    license: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        options: {
          where: { deletedAt: null },
          orderBy: { displayOrder: 'asc' },
          select: {
            optionKey: true,
            isCorrect: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    items: rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = parseQuestionPayload(body);
  if ('error' in parsed) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
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
      externalId: parsed.data.externalId,
      locale: parsed.data.locale,
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json({ ok: false, error: 'A question already exists for this external id and locale.' }, { status: 409 });
  }

  const created = await prisma.$transaction(async (tx) => {
    const question = await tx.question.create({
      data: {
        externalId: parsed.data.externalId,
        topicId: parsed.data.topicId,
        locale: parsed.data.locale,
        stem: parsed.data.stem,
        difficulty: parsed.data.difficulty,
        status: parsed.data.status,
        tags: parsed.data.tags,
        sourceFile: parsed.data.sourceFile,
        createdById: auth.userId,
      },
      select: { id: true },
    });

    await tx.questionOption.createMany({
      data: parsed.data.options.map((option) => ({
        questionId: question.id,
        optionKey: option.key,
        text: option.text,
        isCorrect: option.isCorrect,
        displayOrder: option.displayOrder,
      })),
    });

    if (parsed.data.correctExplanation) {
      await tx.questionExplanation.create({
        data: {
          questionId: question.id,
          correctExplanation: parsed.data.correctExplanation,
        },
      });
    }

    if (parsed.data.references.length > 0) {
      await tx.questionReference.createMany({
        data: parsed.data.references.map((reference, index) => ({
          questionId: question.id,
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
      where: { id: question.id },
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

  return NextResponse.json({ ok: true, item: created });
}
