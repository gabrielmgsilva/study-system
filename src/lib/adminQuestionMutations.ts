import type { Prisma } from '@prisma/client';

import type { ParsedQuestionData } from '@/lib/adminQuestionPayload';

async function syncQuestionOptions(tx: Prisma.TransactionClient, questionId: number, options: ParsedQuestionData['options']) {
  const existing = await tx.questionOption.findMany({
    where: { questionId },
    select: { id: true, optionKey: true },
  });

  const incomingKeys = new Set(options.map((option) => option.key));

  for (const staleOption of existing.filter((option) => !incomingKeys.has(option.optionKey))) {
    await tx.questionOptionExplanation.deleteMany({ where: { questionOptionId: staleOption.id } });
    await tx.questionOption.update({
      where: { id: staleOption.id },
      data: { deletedAt: new Date() },
    });
  }

  for (const option of options) {
    const saved = await tx.questionOption.upsert({
      where: {
        questionId_optionKey: {
          questionId,
          optionKey: option.key,
        },
      },
      update: {
        text: option.text,
        isCorrect: option.isCorrect,
        displayOrder: option.displayOrder,
        deletedAt: null,
      },
      create: {
        questionId,
        optionKey: option.key,
        text: option.text,
        isCorrect: option.isCorrect,
        displayOrder: option.displayOrder,
      },
      select: { id: true },
    });

    if (option.explanation) {
      await tx.questionOptionExplanation.upsert({
        where: { questionOptionId: saved.id },
        update: { explanation: option.explanation, deletedAt: null },
        create: { questionOptionId: saved.id, explanation: option.explanation },
      });
    } else {
      await tx.questionOptionExplanation.deleteMany({ where: { questionOptionId: saved.id } });
    }
  }
}

async function syncQuestionExplanation(tx: Prisma.TransactionClient, questionId: number, correctExplanation: string | null) {
  if (correctExplanation) {
    await tx.questionExplanation.upsert({
      where: { questionId },
      update: { correctExplanation, deletedAt: null },
      create: { questionId, correctExplanation },
    });
    return;
  }

  await tx.questionExplanation.deleteMany({ where: { questionId } });
}

async function syncQuestionReferences(tx: Prisma.TransactionClient, questionId: number, references: ParsedQuestionData['references']) {
  await tx.questionReference.deleteMany({ where: { questionId } });

  if (references.length === 0) return;

  await tx.questionReference.createMany({
    data: references.map((reference, index) => ({
      questionId,
      document: reference.document,
      area: reference.area,
      topicRef: reference.topicRef,
      locator: reference.locator,
      note: reference.note,
      displayOrder: index,
    })),
  });
}

export async function createQuestionFromParsed(
  tx: Prisma.TransactionClient,
  data: ParsedQuestionData,
  userId: number,
) {
  const question = await tx.question.create({
    data: {
      externalId: data.externalId,
      topicId: data.topicId,
      locale: data.locale,
      stem: data.stem,
      difficulty: data.difficulty,
      status: data.status,
      tags: data.tags,
      sourceFile: data.sourceFile,
      createdById: userId,
    },
    select: { id: true },
  });

  await syncQuestionOptions(tx, question.id, data.options);
  await syncQuestionExplanation(tx, question.id, data.correctExplanation);
  await syncQuestionReferences(tx, question.id, data.references);

  return question.id;
}

export async function updateQuestionFromParsed(
  tx: Prisma.TransactionClient,
  questionId: number,
  data: ParsedQuestionData,
  userId: number,
) {
  await tx.question.update({
    where: { id: questionId },
    data: {
      externalId: data.externalId,
      topicId: data.topicId,
      locale: data.locale,
      stem: data.stem,
      difficulty: data.difficulty,
      status: data.status,
      tags: data.tags,
      sourceFile: data.sourceFile,
      reviewedById: userId,
      version: { increment: 1 },
    },
  });

  await syncQuestionOptions(tx, questionId, data.options);
  await syncQuestionExplanation(tx, questionId, data.correctExplanation);
  await syncQuestionReferences(tx, questionId, data.references);
}