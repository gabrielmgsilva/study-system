import type { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { createQuestionFromParsed } from '@/lib/adminQuestionMutations';
import { parseLocale, parseQuestionPayload, parseStatus } from '@/lib/adminQuestionPayload';
import { prisma } from '@/lib/prisma';
import { isAuthError, requireAdmin } from '@/lib/guards';

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
        version: true,
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
    const questionId = await createQuestionFromParsed(tx, parsed.data, auth.userId);

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

  return NextResponse.json({ ok: true, item: created });
}
