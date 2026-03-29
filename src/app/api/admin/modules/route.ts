import type { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { isAuthError, requireAdmin } from '@/lib/guards';
import { prisma } from '@/lib/prisma';

function parseOptionalLicenseId(value: string | null) {
  const parsed = String(value ?? '').trim().toLowerCase();
  return parsed.length > 0 ? parsed : null;
}

function parseName(value: unknown) {
  const parsed = String(value ?? '').trim();
  return parsed.length > 0 ? parsed : null;
}

function parseSlug(value: unknown) {
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

function parseModuleKey(value: unknown, licenseId: string, slug: string) {
  const parsed = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return parsed.length > 0 ? parsed : `${licenseId}.${slug}`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const licenseId = parseOptionalLicenseId(req.nextUrl.searchParams.get('licenseId'));

  const where: Prisma.ModuleWhereInput = {
    deletedAt: null,
    ...(licenseId ? { licenseId } : {}),
  };

  const items = await prisma.module.findMany({
    where,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      licenseId: true,
      slug: true,
      moduleKey: true,
      name: true,
      description: true,
      displayOrder: true,
      isActive: true,
      _count: {
        select: {
          subjects: {
            where: { deletedAt: null },
          },
        },
      },
    },
  });

  const enriched = await Promise.all(
    items.map(async (item) => {
      const [topicCount, questionCount] = await Promise.all([
        prisma.topic.count({
          where: {
            deletedAt: null,
            subject: {
              deletedAt: null,
              moduleId: item.id,
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
                moduleId: item.id,
              },
            },
          },
        }),
      ]);

      return {
        ...item,
        subjectCount: item._count.subjects,
        topicCount,
        questionCount,
      };
    }),
  );

  return NextResponse.json({ ok: true, items: enriched });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const licenseId = parseOptionalLicenseId(body?.licenseId);
  const name = parseName(body?.name);
  const slug = parseSlug(body?.slug);
  const description = parseDescription(body?.description);
  const displayOrder = parseNullableInt(body?.displayOrder);
  const isActive = parseNullableBool(body?.isActive);

  if (!licenseId || !name || !slug || displayOrder === undefined || isActive === undefined) {
    return NextResponse.json({ ok: false, error: 'Invalid module payload.' }, { status: 400 });
  }

  const license = await prisma.license.findFirst({
    where: { id: licenseId, deletedAt: null },
    select: { id: true },
  });

  if (!license) {
    return NextResponse.json({ ok: false, error: 'Certification not found.' }, { status: 404 });
  }

  const moduleKey = parseModuleKey(body?.moduleKey, licenseId, slug);

  const duplicate = await prisma.module.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { moduleKey },
        { licenseId, slug },
      ],
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json({ ok: false, error: 'A module with this slug or module key already exists.' }, { status: 409 });
  }

  const item = await prisma.module.create({
    data: {
      licenseId,
      slug,
      moduleKey,
      name,
      description,
      displayOrder: displayOrder ?? 0,
      isActive,
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

  return NextResponse.json({ ok: true, item: { ...item, subjectCount: 0, topicCount: 0, questionCount: 0 } });
}