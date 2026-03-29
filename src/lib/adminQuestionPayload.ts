import type { ContentLocale, QuestionStatus } from '@prisma/client';

export const CONTENT_LOCALES = ['en', 'pt'] as const satisfies readonly ContentLocale[];
export const QUESTION_STATUSES = ['draft', 'review', 'published', 'archived'] as const satisfies readonly QuestionStatus[];

export type ParsedQuestionOption = {
  key: string;
  text: string;
  isCorrect: boolean;
  displayOrder: number;
  explanation: string | null;
};

export type ParsedQuestionReference = {
  document: string | null;
  area: string | null;
  topicRef: string | null;
  locator: string | null;
  note: string | null;
};

export type ParsedQuestionData = {
  externalId: string;
  topicId: number;
  locale: ContentLocale;
  status: QuestionStatus;
  stem: string;
  difficulty: number | null;
  sourceFile: string | null;
  tags: string[];
  correctExplanation: string | null;
  options: ParsedQuestionOption[];
  references: ParsedQuestionReference[];
};

export function parseLocale(value: string | null): ContentLocale | null {
  if (!value) return null;
  return CONTENT_LOCALES.includes(value as ContentLocale) ? (value as ContentLocale) : null;
}

export function parseStatus(value: string | null): QuestionStatus | null {
  if (!value) return null;
  return QUESTION_STATUSES.includes(value as QuestionStatus) ? (value as QuestionStatus) : null;
}

export function parseNullableInt(value: unknown) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

export function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 30);
  }

  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export function normalizeReference(value: unknown) {
  if (!value || typeof value !== 'object') return null;

  const ref = {
    document: String((value as Record<string, unknown>).document ?? '').trim() || null,
    area: String((value as Record<string, unknown>).area ?? '').trim() || null,
    topicRef: String((value as Record<string, unknown>).topicRef ?? '').trim() || null,
    locator: String((value as Record<string, unknown>).locator ?? '').trim() || null,
    note: String((value as Record<string, unknown>).note ?? '').trim() || null,
  };

  return Object.values(ref).some(Boolean) ? ref : null;
}

export function parseQuestionPayload(body: Record<string, unknown>) {
  const externalId = String(body.externalId ?? '').trim();
  const topicId = Number(body.topicId);
  const locale = parseLocale(String(body.locale ?? ''));
  const status = parseStatus(String(body.status ?? ''));
  const stem = String(body.stem ?? '').trim();
  const difficulty = parseNullableInt(body.difficulty);
  const sourceFile = String(body.sourceFile ?? '').trim() || null;
  const correctExplanation = String(body.correctExplanation ?? '').trim() || null;
  const correctOptionKey = String(body.correctOptionKey ?? '').trim().toUpperCase();
  const rawOptions = Array.isArray(body.options) ? body.options : [];

  if (!externalId || !Number.isInteger(topicId) || topicId <= 0 || !locale || !status || !stem) {
    return { error: 'Missing required question fields.' } as const;
  }

  if (difficulty === undefined) {
    return { error: 'Difficulty must be empty or a non-negative integer.' } as const;
  }

  const options = rawOptions
    .map((option, index) => {
      if (!option || typeof option !== 'object') return null;

      const record = option as Record<string, unknown>;
      const key = String(record.key ?? record.id ?? '')
        .trim()
        .toUpperCase();
      const text = String(record.text ?? '').trim();
      const explanation = String(record.explanation ?? '').trim() || null;

      if (!key) return null;

      return {
        key,
        text,
        explanation,
        isCorrect: key === correctOptionKey,
        displayOrder: index,
      };
    })
    .filter(Boolean) as ParsedQuestionOption[];

  if (options.length < 2) {
    return { error: 'At least two options are required.' } as const;
  }

  const optionKeySet = new Set(options.map((option) => option.key));
  if (optionKeySet.size !== options.length) {
    return { error: 'Option keys must be unique.' } as const;
  }

  if (options.some((option) => !option.text)) {
    return { error: 'All option texts are required.' } as const;
  }

  if (!optionKeySet.has(correctOptionKey)) {
    return { error: 'Select a valid correct option.' } as const;
  }

  const references = (Array.isArray(body.references) ? body.references : [])
    .map(normalizeReference)
    .filter(Boolean) as ParsedQuestionReference[];

  return {
    data: {
      externalId,
      topicId,
      locale,
      status,
      stem,
      difficulty,
      sourceFile,
      tags: normalizeTags(body.tags),
      correctExplanation,
      options,
      references,
    },
  } as const;
}