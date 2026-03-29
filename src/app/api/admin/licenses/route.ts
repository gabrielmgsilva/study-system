import type { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { isAuthError, requireAdmin } from '@/lib/guards';
import { prisma } from '@/lib/prisma';

function parsePage(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function parsePageSize(value: string | null) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return 12;
  return Math.min(parsed, 50);
}

function parseStatus(value: string | null) {
  if (value === 'active' || value === 'inactive') return value;
  return 'all';
}

function parseName(value: unknown) {
  const parsed = String(value ?? '').trim();
  return parsed.length > 0 ? parsed : null;
}

function parseLicenseId(value: unknown) {
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
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

async function countChildrenForLicense(licenseId: string) {
  const [subjectCount, topicCount, questionCount] = await Promise.all([
    prisma.subject.count({
      where: {
        deletedAt: null,
        module: {
          deletedAt: null,
          licenseId,
        },
      },
    }),
    prisma.topic.count({
      where: {
        deletedAt: null,
        subject: {
          deletedAt: null,
          module: {
            deletedAt: null,
            licenseId,
          },
        },
      },
    }),
    prisma.question.count({
      where: {
        deletedAt: null,
        topic: {
          deletedAt: null,
          subject: {
            deletedAt: null,
            module: {
              deletedAt: null,
              licenseId,
            },
          },
        },
      },
    }),
  ]);

  return { subjectCount, topicCount, questionCount };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const q = String(req.nextUrl.searchParams.get('q') ?? '').trim();
  const status = parseStatus(req.nextUrl.searchParams.get('status'));
  const page = parsePage(req.nextUrl.searchParams.get('page'));
  const pageSize = parsePageSize(req.nextUrl.searchParams.get('pageSize'));

  const where: Prisma.LicenseWhereInput = {
    deletedAt: null,
    ...(status === 'active' ? { isActive: true } : {}),
    ...(status === 'inactive' ? { isActive: false } : {}),
    ...(q
      ? {
          OR: [
            { id: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.license.count({ where }),
    prisma.license.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        description: true,
        displayOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            modules: {
              where: { deletedAt: null },
            },
          },
        },
      },
    }),
  ]);

  const items = await Promise.all(
    rows.map(async (row) => {
      const childCounts = await countChildrenForLicense(row.id);

      return {
        ...row,
        moduleCount: row._count.modules,
        ...childCounts,
      };
    }),
  );

  return NextResponse.json({
    ok: true,
    items,
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

  const body = await req.json().catch(() => ({}));
  const id = parseLicenseId(body?.id);
  const name = parseName(body?.name);
  const description = parseDescription(body?.description);
  const displayOrder = parseNullableInt(body?.displayOrder);
  const isActive = parseNullableBool(body?.isActive);

  if (!id || !name || displayOrder === undefined || isActive === undefined) {
    return NextResponse.json({ ok: false, error: 'Invalid certification payload.' }, { status: 400 });
  }

  const duplicate = await prisma.license.findFirst({
    where: {
      deletedAt: null,
      OR: [{ id }, { name }],
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { ok: false, error: 'A certification with this slug or name already exists.' },
      { status: 409 },
    );
  }

  const created = await prisma.license.create({
    data: {
      id,
      name,
      description,
      displayOrder: displayOrder ?? 0,
      isActive,
    },
    select: {
      id: true,
      name: true,
      description: true,
      displayOrder: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    item: {
      ...created,
      moduleCount: 0,
      subjectCount: 0,
      topicCount: 0,
      questionCount: 0,
    },
  });
}