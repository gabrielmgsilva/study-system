import { NextRequest, NextResponse } from 'next/server';

import { isAuthError, requireAdmin } from '@/lib/guards';
import { prisma } from '@/lib/prisma';

function parseLicenseId(value: string) {
  const parsed = String(value ?? '').trim().toLowerCase();
  return parsed.length > 0 ? parsed : null;
}

function parseName(value: unknown) {
  const parsed = String(value ?? '').trim();
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

async function getLicenseDetail(licenseId: string) {
  const license = await prisma.license.findFirst({
    where: { id: licenseId, deletedAt: null },
    select: {
      id: true,
      name: true,
      description: true,
      displayOrder: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      modules: {
        where: { deletedAt: null },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          slug: true,
          moduleKey: true,
          name: true,
          description: true,
          displayOrder: true,
          isActive: true,
          subjects: {
            where: { deletedAt: null },
            orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
            select: {
              id: true,
              code: true,
              name: true,
              shortTitle: true,
              subtitle: true,
              weight: true,
              displayOrder: true,
              isActive: true,
              topics: {
                where: { deletedAt: null },
                orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
                select: {
                  id: true,
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
              },
            },
          },
        },
      },
    },
  });

  if (!license) return null;

  const modules = license.modules.map((module) => ({
    ...module,
    subjectCount: module.subjects.length,
    topicCount: module.subjects.reduce((total, subject) => total + subject.topics.length, 0),
    questionCount: module.subjects.reduce(
      (total, subject) => total + subject.topics.reduce((topicTotal, topic) => topicTotal + topic._count.questions, 0),
      0,
    ),
    subjects: module.subjects.map((subject) => ({
      ...subject,
      topicCount: subject.topics.length,
      questionCount: subject.topics.reduce((total, topic) => total + topic._count.questions, 0),
      topics: subject.topics.map((topic) => ({
        id: topic.id,
        code: topic.code,
        name: topic.name,
        displayOrder: topic.displayOrder,
        isActive: topic.isActive,
        questionCount: topic._count.questions,
      })),
    })),
  }));

  return {
    ...license,
    moduleCount: modules.length,
    subjectCount: modules.reduce((total, module) => total + module.subjectCount, 0),
    topicCount: modules.reduce((total, module) => total + module.topicCount, 0),
    questionCount: modules.reduce((total, module) => total + module.questionCount, 0),
    modules,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ licenseId: string }> },
) {
  void req;

  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { licenseId: licenseIdParam } = await params;
  const licenseId = parseLicenseId(licenseIdParam);

  if (!licenseId) {
    return NextResponse.json({ ok: false, error: 'Invalid certification id.' }, { status: 400 });
  }

  const item = await getLicenseDetail(licenseId);

  if (!item) {
    return NextResponse.json({ ok: false, error: 'Certification not found.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ licenseId: string }> },
) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { licenseId: licenseIdParam } = await params;
  const licenseId = parseLicenseId(licenseIdParam);

  if (!licenseId) {
    return NextResponse.json({ ok: false, error: 'Invalid certification id.' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const name = body?.name === undefined ? undefined : parseName(body?.name);
  const description = parseDescription(body?.description);
  const displayOrder = parseNullableInt(body?.displayOrder);
  const isActive = parseNullableBool(body?.isActive);

  if (
    (body?.name !== undefined && !name) ||
    displayOrder === undefined ||
    isActive === undefined
  ) {
    return NextResponse.json({ ok: false, error: 'Invalid certification payload.' }, { status: 400 });
  }

  const current = await prisma.license.findFirst({
    where: { id: licenseId, deletedAt: null },
    select: { id: true },
  });

  if (!current) {
    return NextResponse.json({ ok: false, error: 'Certification not found.' }, { status: 404 });
  }

  if (typeof name === 'string') {
    const duplicate = await prisma.license.findFirst({
      where: {
        deletedAt: null,
        id: { not: licenseId },
        name,
      },
      select: { id: true },
    });

    if (duplicate) {
      return NextResponse.json(
        { ok: false, error: 'A certification with this name already exists.' },
        { status: 409 },
      );
    }
  }

  await prisma.license.update({
    where: { id: licenseId },
    data: {
      ...(typeof name === 'string' ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(displayOrder !== null || body?.displayOrder !== undefined ? { displayOrder: displayOrder ?? 0 } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
  });

  const item = await getLicenseDetail(licenseId);
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ licenseId: string }> },
) {
  void req;

  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const { licenseId: licenseIdParam } = await params;
  const licenseId = parseLicenseId(licenseIdParam);

  if (!licenseId) {
    return NextResponse.json({ ok: false, error: 'Invalid certification id.' }, { status: 400 });
  }

  const license = await prisma.license.findFirst({
    where: { id: licenseId, deletedAt: null },
    select: {
      id: true,
      _count: {
        select: {
          modules: {
            where: { deletedAt: null },
          },
        },
      },
    },
  });

  if (!license) {
    return NextResponse.json({ ok: false, error: 'Certification not found.' }, { status: 404 });
  }

  if (license._count.modules > 0) {
    return NextResponse.json(
      { ok: false, error: 'This certification still has modules and cannot be deleted.' },
      { status: 409 },
    );
  }

  await prisma.license.update({
    where: { id: licenseId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}