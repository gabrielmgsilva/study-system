import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { isAuthError, requireAdmin } from '@/lib/guards';

function parseOptionalId(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const licenseId = String(req.nextUrl.searchParams.get('licenseId') ?? '').trim().toLowerCase();
  const moduleId = parseOptionalId(req.nextUrl.searchParams.get('moduleId'));
  const subjectId = parseOptionalId(req.nextUrl.searchParams.get('subjectId'));

  const [licenses, modules, subjects, topics] = await Promise.all([
    prisma.license.findMany({
      where: { deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true },
    }),
    prisma.module.findMany({
      where: { deletedAt: null, ...(licenseId ? { licenseId } : {}) },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, licenseId: true, name: true, moduleKey: true },
    }),
    moduleId
      ? prisma.subject.findMany({
          where: { deletedAt: null, moduleId },
          orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
          select: { id: true, moduleId: true, code: true, name: true },
        })
      : Promise.resolve([]),
    subjectId
      ? prisma.topic.findMany({
          where: { deletedAt: null, subjectId },
          orderBy: [{ displayOrder: 'asc' }, { code: 'asc' }],
          select: { id: true, subjectId: true, code: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({ ok: true, licenses, modules, subjects, topics });
}
