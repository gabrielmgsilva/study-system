import { NextRequest, NextResponse } from 'next/server';

import { isAuthError, requireAdmin } from '@/lib/guards';
import { prisma } from '@/lib/prisma';

function parseTopicId(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseCode(value: unknown) {
  if (value === undefined) return undefined;
  const parsed = String(value ?? '').trim();
  return parsed.length > 0 ? parsed : null;
}

function parseName(value: unknown) {
  if (value === undefined) return undefined;
  const parsed = String(value ?? '').trim();
  return parsed.length > 0 ? parsed : null;
}

function parseNullableInt(value: unknown) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function parseNullableBool(value: unknown) {
  if (value === '' || value === null || value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ topicId: string }> },
) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { topicId: topicIdParam } = await params;
  const topicId = parseTopicId(topicIdParam);
  if (!topicId) {
    return NextResponse.json({ ok: false, error: 'Invalid topic id.' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const code = parseCode(body?.code);
  const name = parseName(body?.name);
  const displayOrder = parseNullableInt(body?.displayOrder);
  const isActive = parseNullableBool(body?.isActive);

  if (
    (body?.code !== undefined && code === null) ||
    (body?.name !== undefined && name === null) ||
    displayOrder === undefined ||
    isActive === undefined
  ) {
    return NextResponse.json({ ok: false, error: 'Invalid topic payload.' }, { status: 400 });
  }

  const current = await prisma.topic.findFirst({
    where: { id: topicId, deletedAt: null },
    select: { id: true, subjectId: true, code: true },
  });

  if (!current) {
    return NextResponse.json({ ok: false, error: 'Topic not found.' }, { status: 404 });
  }

  const nextCode = code ?? current.code;
  const duplicate = await prisma.topic.findFirst({
    where: {
      deletedAt: null,
      id: { not: topicId },
      subjectId: current.subjectId,
      code: nextCode,
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json({ ok: false, error: 'A topic with this code already exists in the subject.' }, { status: 409 });
  }

  const item = await prisma.topic.update({
    where: { id: topicId },
    data: {
      ...(code !== undefined ? { code: nextCode } : {}),
      ...(typeof name === 'string' ? { name } : {}),
      ...(displayOrder !== null || body?.displayOrder !== undefined ? { displayOrder: displayOrder ?? 0 } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
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

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ topicId: string }> },
) {
  void req;

  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { topicId: topicIdParam } = await params;
  const topicId = parseTopicId(topicIdParam);
  if (!topicId) {
    return NextResponse.json({ ok: false, error: 'Invalid topic id.' }, { status: 400 });
  }

  const current = await prisma.topic.findFirst({
    where: { id: topicId, deletedAt: null },
    select: {
      id: true,
      _count: {
        select: {
          questions: {
            where: { deletedAt: null },
          },
        },
      },
    },
  });

  if (!current) {
    return NextResponse.json({ ok: false, error: 'Topic not found.' }, { status: 404 });
  }

  if (current._count.questions > 0) {
    return NextResponse.json({ ok: false, error: 'This topic still has questions and cannot be deleted.' }, { status: 409 });
  }

  await prisma.topic.update({ where: { id: topicId }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}