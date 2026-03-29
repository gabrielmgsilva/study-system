import { NextRequest, NextResponse } from 'next/server';

import { isAuthError, requireAdmin } from '@/lib/guards';
import { prisma } from '@/lib/prisma';

function parseSubjectId(value: string) {
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> },
) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { subjectId: subjectIdParam } = await params;
  const subjectId = parseSubjectId(subjectIdParam);
  if (!subjectId) {
    return NextResponse.json({ ok: false, error: 'Invalid subject id.' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const code = parseCode(body?.code);
  const name = parseName(body?.name);
  const shortTitle = parseText(body?.shortTitle);
  const subtitle = parseText(body?.subtitle);
  const weight = parseNullableInt(body?.weight, 1);
  const displayOrder = parseNullableInt(body?.displayOrder);
  const isActive = parseNullableBool(body?.isActive);

  if (
    (body?.code !== undefined && code === null) ||
    (body?.name !== undefined && name === null) ||
    weight === undefined ||
    displayOrder === undefined ||
    isActive === undefined
  ) {
    return NextResponse.json({ ok: false, error: 'Invalid subject payload.' }, { status: 400 });
  }

  const current = await prisma.subject.findFirst({
    where: { id: subjectId, deletedAt: null },
    select: { id: true, moduleId: true, code: true },
  });

  if (!current) {
    return NextResponse.json({ ok: false, error: 'Subject not found.' }, { status: 404 });
  }

  const nextCode = code ?? current.code;
  const duplicate = await prisma.subject.findFirst({
    where: {
      deletedAt: null,
      id: { not: subjectId },
      moduleId: current.moduleId,
      code: nextCode,
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json({ ok: false, error: 'A subject with this code already exists in the module.' }, { status: 409 });
  }

  const item = await prisma.subject.update({
    where: { id: subjectId },
    data: {
      ...(code !== undefined ? { code: nextCode } : {}),
      ...(typeof name === 'string' ? { name } : {}),
      ...(shortTitle !== undefined ? { shortTitle } : {}),
      ...(subtitle !== undefined ? { subtitle } : {}),
      ...(weight !== null || body?.weight !== undefined ? { weight: weight ?? 1 } : {}),
      ...(displayOrder !== null || body?.displayOrder !== undefined ? { displayOrder: displayOrder ?? 0 } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
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

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ subjectId: string }> },
) {
  void req;

  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { subjectId: subjectIdParam } = await params;
  const subjectId = parseSubjectId(subjectIdParam);
  if (!subjectId) {
    return NextResponse.json({ ok: false, error: 'Invalid subject id.' }, { status: 400 });
  }

  const current = await prisma.subject.findFirst({
    where: { id: subjectId, deletedAt: null },
    select: {
      id: true,
      _count: {
        select: {
          topics: {
            where: { deletedAt: null },
          },
        },
      },
    },
  });

  if (!current) {
    return NextResponse.json({ ok: false, error: 'Subject not found.' }, { status: 404 });
  }

  if (current._count.topics > 0) {
    return NextResponse.json({ ok: false, error: 'This subject still has topics and cannot be deleted.' }, { status: 409 });
  }

  await prisma.subject.update({ where: { id: subjectId }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}