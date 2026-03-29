import type { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { isAuthError, requireAdmin } from '@/lib/guards';
import { prisma } from '@/lib/prisma';

function parseOptionalModuleId(value: string | null) {
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

function parseText(value: unknown) {
  if (value === undefined) return undefined;
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

  const moduleId = parseOptionalModuleId(req.nextUrl.searchParams.get('moduleId'));

  const where: Prisma.SubjectWhereInput = {
    deletedAt: null,
    ...(moduleId ? { moduleId } : {}),
  };

  const items = await prisma.subject.findMany({
    where,
    orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
    select: {
      id: true,
      moduleId: true,
      code: true,
      name: true,
      shortTitle: true,
      subtitle: true,
      weight: true,
      displayOrder: true,
      isActive: true,
      _count: {
        select: {
          topics: {
            where: { deletedAt: null },
          },
        },
      },
    },
  });

  const enriched = await Promise.all(
    items.map(async (item) => ({
      ...item,
      topicCount: item._count.topics,
      questionCount: await prisma.question.count({
        where: {
          deletedAt: null,
          topic: {
            deletedAt: null,
            subjectId: item.id,
          },
        },
      }),
    })),
  );

  return NextResponse.json({ ok: true, items: enriched });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const moduleId = parseNullableInt(body?.moduleId, 1);
  const code = parseCode(body?.code);
  const name = parseName(body?.name);
  const shortTitle = parseText(body?.shortTitle);
  const subtitle = parseText(body?.subtitle);
  const weight = parseNullableInt(body?.weight, 1);
  const displayOrder = parseNullableInt(body?.displayOrder);
  const isActive = parseNullableBool(body?.isActive);

  if (!moduleId || !code || !name || weight === undefined || displayOrder === undefined || isActive === undefined) {
    return NextResponse.json({ ok: false, error: 'Invalid subject payload.' }, { status: 400 });
  }

  const module = await prisma.module.findFirst({ where: { id: moduleId, deletedAt: null }, select: { id: true } });
  if (!module) {
    return NextResponse.json({ ok: false, error: 'Module not found.' }, { status: 404 });
  }

  const duplicate = await prisma.subject.findFirst({
    where: { deletedAt: null, moduleId, code },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json({ ok: false, error: 'A subject with this code already exists in the module.' }, { status: 409 });
  }

  const item = await prisma.subject.create({
    data: {
      moduleId,
      code,
      name,
      shortTitle,
      subtitle,
      weight: weight ?? 1,
      displayOrder: displayOrder ?? 0,
      isActive,
    },
    select: {
      id: true,
      moduleId: true,
      code: true,
      name: true,
      shortTitle: true,
      subtitle: true,
      weight: true,
      displayOrder: true,
      isActive: true,
    },
  });

  return NextResponse.json({ ok: true, item: { ...item, topicCount: 0, questionCount: 0 } });
}