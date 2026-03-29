import type { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { isAuthError, requireAdmin } from '@/lib/guards';
import { prisma } from '@/lib/prisma';

function parseOptionalSubjectId(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseCode(value: unknown) {
  const parsed = String(value ?? '').trim();
  return parsed.length > 0 ? parsed : null;
}

function parseName(value: unknown) {
  const parsed = String(value ?? '').trim();
  return parsed.length > 0 ? parsed : null;
}

function parseNullableInt(value: unknown, minimum = 0) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum ? parsed : undefined;
}

function parseNullableBool(value: unknown) {
  if (value === '' || value === null || value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const subjectId = parseOptionalSubjectId(req.nextUrl.searchParams.get('subjectId'));

  const where: Prisma.TopicWhereInput = {
    deletedAt: null,
    ...(subjectId ? { subjectId } : {}),
  };

  const items = await prisma.topic.findMany({
    where,
    orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
    select: {
      id: true,
      subjectId: true,
      code: true,
      name: true,
      displayOrder: true,
      isActive: true,
      _count: {
        select: {
          questions: {
            where: { deletedAt: null },
          },
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    items: items.map((item) => ({
      ...item,
      questionCount: item._count.questions,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const subjectId = parseNullableInt(body?.subjectId, 1);
  const code = parseCode(body?.code);
  const name = parseName(body?.name);
  const displayOrder = parseNullableInt(body?.displayOrder);
  const isActive = parseNullableBool(body?.isActive);

  if (!subjectId || !code || !name || displayOrder === undefined || isActive === undefined) {
    return NextResponse.json({ ok: false, error: 'Invalid topic payload.' }, { status: 400 });
  }

  const subject = await prisma.subject.findFirst({ where: { id: subjectId, deletedAt: null }, select: { id: true } });
  if (!subject) {
    return NextResponse.json({ ok: false, error: 'Subject not found.' }, { status: 404 });
  }

  const duplicate = await prisma.topic.findFirst({
    where: { deletedAt: null, subjectId, code },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json({ ok: false, error: 'A topic with this code already exists in the subject.' }, { status: 409 });
  }

  const item = await prisma.topic.create({
    data: {
      subjectId,
      code,
      name,
      displayOrder: displayOrder ?? 0,
      isActive,
    },
    select: {
      id: true,
      subjectId: true,
      code: true,
      name: true,
      displayOrder: true,
      isActive: true,
    },
  });

  return NextResponse.json({ ok: true, item: { ...item, questionCount: 0 } });
}