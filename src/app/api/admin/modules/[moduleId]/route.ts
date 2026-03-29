import { NextRequest, NextResponse } from 'next/server';

import { isAuthError, requireAdmin } from '@/lib/guards';
import { prisma } from '@/lib/prisma';

function parseModuleId(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseName(value: unknown) {
  const parsed = String(value ?? '').trim();
  return parsed.length > 0 ? parsed : null;
}

function parseSlug(value: unknown) {
  if (value === undefined) return undefined;
  const parsed = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return parsed.length > 0 ? parsed : null;
}

function parseDescription(value: unknown) {
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

function parseModuleKey(value: unknown) {
  if (value === undefined) return undefined;
  const parsed = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return parsed.length > 0 ? parsed : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { moduleId: moduleIdParam } = await params;
  const moduleId = parseModuleId(moduleIdParam);
  if (!moduleId) {
    return NextResponse.json({ ok: false, error: 'Invalid module id.' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const name = body?.name === undefined ? undefined : parseName(body?.name);
  const slug = parseSlug(body?.slug);
  const moduleKey = parseModuleKey(body?.moduleKey);
  const description = parseDescription(body?.description);
  const displayOrder = parseNullableInt(body?.displayOrder);
  const isActive = parseNullableBool(body?.isActive);

  if (
    (body?.name !== undefined && !name) ||
    (body?.slug !== undefined && slug === null) ||
    (body?.moduleKey !== undefined && moduleKey === null) ||
    displayOrder === undefined ||
    isActive === undefined
  ) {
    return NextResponse.json({ ok: false, error: 'Invalid module payload.' }, { status: 400 });
  }

  const current = await prisma.module.findFirst({
    where: { id: moduleId, deletedAt: null },
    select: { id: true, licenseId: true, slug: true, moduleKey: true },
  });

  if (!current) {
    return NextResponse.json({ ok: false, error: 'Module not found.' }, { status: 404 });
  }

  const nextSlug = slug ?? current.slug;
  const nextModuleKey = moduleKey ?? current.moduleKey;

  const duplicate = await prisma.module.findFirst({
    where: {
      deletedAt: null,
      id: { not: moduleId },
      OR: [
        { moduleKey: nextModuleKey },
        { licenseId: current.licenseId, slug: nextSlug },
      ],
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json({ ok: false, error: 'A module with this slug or module key already exists.' }, { status: 409 });
  }

  const item = await prisma.module.update({
    where: { id: moduleId },
    data: {
      ...(typeof name === 'string' ? { name } : {}),
      ...(slug !== undefined ? { slug: nextSlug } : {}),
      ...(moduleKey !== undefined ? { moduleKey: nextModuleKey } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(displayOrder !== null || body?.displayOrder !== undefined ? { displayOrder: displayOrder ?? 0 } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
    select: {
      id: true,
      licenseId: true,
      slug: true,
      moduleKey: true,
      name: true,
      description: true,
      displayOrder: true,
      isActive: true,
    },
  });

  return NextResponse.json({ ok: true, item });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  void req;

  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { moduleId: moduleIdParam } = await params;
  const moduleId = parseModuleId(moduleIdParam);
  if (!moduleId) {
    return NextResponse.json({ ok: false, error: 'Invalid module id.' }, { status: 400 });
  }

  const current = await prisma.module.findFirst({
    where: { id: moduleId, deletedAt: null },
    select: {
      id: true,
      _count: {
        select: {
          subjects: {
            where: { deletedAt: null },
          },
        },
      },
    },
  });

  if (!current) {
    return NextResponse.json({ ok: false, error: 'Module not found.' }, { status: 404 });
  }

  if (current._count.subjects > 0) {
    return NextResponse.json({ ok: false, error: 'This module still has subjects and cannot be deleted.' }, { status: 409 });
  }

  await prisma.module.update({ where: { id: moduleId }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}