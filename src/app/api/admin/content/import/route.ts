import { NextRequest, NextResponse } from 'next/server';

import { createQuestionFromParsed, updateQuestionFromParsed } from '@/lib/adminQuestionMutations';
import { parseQuestionPayload, parseStatus } from '@/lib/adminQuestionPayload';
import { isAuthError, requireAdmin } from '@/lib/guards';
import { prisma } from '@/lib/prisma';

type ImportItem = {
  id?: string;
  questionType?: string;
  stem?: string;
  options?: Array<{ id?: string; text?: string }>;
  correctOptionId?: string;
  references?: Array<{ doc?: string; area?: string; topic?: string; locator?: string; note?: string }>;
  explanation?: {
    correct?: string;
    whyOthersAreWrong?: Record<string, string>;
  };
  tcSectionCode?: string;
  tcSectionTitle?: string;
  tcTopicCode?: string;
  tcTopicTitle?: string;
  difficulty?: number;
  tags?: string[];
  status?: string;
  sourceFile?: string;
};

function parseLicenseId(value: unknown) {
  const parsed = String(value ?? '').trim().toLowerCase();
  return parsed.length > 0 ? parsed : null;
}

function parseLocale(value: unknown) {
  const parsed = String(value ?? '').trim().toLowerCase();
  return parsed === 'pt' ? 'pt' : parsed === 'en' ? 'en' : null;
}

function parseModuleId(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
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

async function ensureModule(licenseId: string, moduleId: number | null, moduleName: string | null, moduleSlug: string | null) {
  if (moduleId) {
    const existing = await prisma.module.findFirst({
      where: { id: moduleId, licenseId, deletedAt: null },
      select: { id: true },
    });

    return existing;
  }

  if (!moduleName || !moduleSlug) return null;

  const current = await prisma.module.findFirst({
    where: { licenseId, slug: moduleSlug, deletedAt: null },
    select: { id: true },
  });

  if (current) return current;

  return prisma.module.create({
    data: {
      licenseId,
      name: moduleName,
      slug: moduleSlug,
      moduleKey: `${licenseId}.${moduleSlug}`,
      displayOrder: 0,
      isActive: true,
    },
    select: { id: true },
  });
}

async function ensureSubject(moduleId: number, code: string, name: string) {
  const current = await prisma.subject.findFirst({
    where: { moduleId, code, deletedAt: null },
    select: { id: true },
  });

  if (current) return current;

  return prisma.subject.create({
    data: {
      moduleId,
      code,
      name,
      weight: 1,
      displayOrder: 0,
      isActive: true,
    },
    select: { id: true },
  });
}

async function ensureTopic(subjectId: number, code: string, name: string) {
  const current = await prisma.topic.findFirst({
    where: { subjectId, code, deletedAt: null },
    select: { id: true },
  });

  if (current) return current;

  return prisma.topic.create({
    data: {
      subjectId,
      code,
      name,
      displayOrder: 0,
      isActive: true,
    },
    select: { id: true },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (isAuthError(auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const licenseId = parseLicenseId(body?.licenseId);
  const locale = parseLocale(body?.locale);
  const moduleId = parseModuleId(body?.moduleId);
  const moduleName = parseName(body?.moduleName);
  const moduleSlug = parseSlug(body?.moduleSlug);
  const items = Array.isArray(body?.items) ? (body.items as ImportItem[]) : [];

  if (!licenseId || !locale || items.length === 0) {
    return NextResponse.json({ ok: false, error: 'Invalid import payload.' }, { status: 400 });
  }

  const license = await prisma.license.findFirst({
    where: { id: licenseId, deletedAt: null },
    select: { id: true },
  });

  if (!license) {
    return NextResponse.json({ ok: false, error: 'Certification not found.' }, { status: 404 });
  }

  const module = await ensureModule(licenseId, moduleId, moduleName, moduleSlug);
  if (!module) {
    return NextResponse.json({ ok: false, error: 'Select an existing module or provide a new module name and slug.' }, { status: 400 });
  }

  const summary = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const [index, item] of items.entries()) {
    try {
      const sectionCode = String(item.tcSectionCode ?? '').trim();
      const sectionTitle = String(item.tcSectionTitle ?? '').trim();
      const topicCode = String(item.tcTopicCode ?? '').trim();
      const topicTitle = String(item.tcTopicTitle ?? '').trim();

      if (!sectionCode || !sectionTitle || !topicCode || !topicTitle) {
        throw new Error('Missing section/topic hierarchy fields.');
      }

      const subject = await ensureSubject(module.id, sectionCode, sectionTitle);
      const topic = await ensureTopic(subject.id, topicCode, topicTitle);
      const parsed = parseQuestionPayload({
        externalId: item.id,
        topicId: topic.id,
        locale,
        status: parseStatus(item.status ?? null) ?? 'draft',
        difficulty: item.difficulty ?? null,
        sourceFile: item.sourceFile ?? null,
        stem: item.stem,
        tags: item.tags ?? [],
        correctOptionKey: item.correctOptionId,
        correctExplanation: item.explanation?.correct ?? null,
        options: (item.options ?? []).map((option) => ({
          key: option.id,
          text: option.text,
          explanation: item.explanation?.whyOthersAreWrong?.[String(option.id ?? '').trim().toUpperCase()] ?? null,
        })),
        references: (item.references ?? []).map((reference) => ({
          document: reference.doc ?? null,
          area: reference.area ?? null,
          topicRef: reference.topic ?? null,
          locator: reference.locator ?? null,
          note: reference.note ?? null,
        })),
      });

      if ('error' in parsed) {
        throw new Error(parsed.error);
      }

      const duplicate = await prisma.question.findFirst({
        where: {
          deletedAt: null,
          externalId: parsed.data.externalId,
          locale: parsed.data.locale,
        },
        select: { id: true },
      });

      await prisma.$transaction(async (tx) => {
        if (duplicate) {
          await updateQuestionFromParsed(tx, duplicate.id, parsed.data, auth.userId);
        } else {
          await createQuestionFromParsed(tx, parsed.data, auth.userId);
        }
      });

      if (duplicate) {
        summary.updated += 1;
      } else {
        summary.created += 1;
      }
    } catch (error) {
      summary.skipped += 1;
      summary.errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown import error.'}`);
    }
  }

  return NextResponse.json({ ok: true, summary });
}