import { redirect } from 'next/navigation';

import { getCurrentSessionServer } from '@/lib/currentUserServer';
import { checkStudentAccess } from '@/lib/services/subscription-guard';
import { selectQuestions } from '@/lib/services/study-engine';
import { prisma } from '@/lib/prisma';
import { FlashcardSession } from '@/components/student/flashcard-session';

export const metadata = { title: 'Flashcards' };

export default async function FlashcardPage({
  params,
  searchParams,
}: {
  params: Promise<{ licenseId: string }>;
  searchParams: Promise<{ module?: string }>;
}) {
  const { licenseId } = await params;
  const { module: moduleKey } = await searchParams;

  const session = await getCurrentSessionServer();
  if (!session) redirect('/auth/login');

  const access = await checkStudentAccess(session.userId);
  if (!access.allowed) redirect(access.redirect);

  if (!moduleKey) redirect(`/study`);

  const questions = await selectQuestions(
    session.userId,
    moduleKey,
    'flashcard',
  );

  if (questions.length === 0) redirect(`/study`);

  const studySession = await prisma.studySession.create({
    data: {
      userId: session.userId,
      licenseId,
      moduleKey,
      mode: 'flashcard',
      questionsAnswered: 0,
      isQuickReview: false,
    },
    select: { id: true },
  });

  const serializedQuestions = questions.map((q) => ({
    id: q.id,
    externalId: q.externalId,
    stem: q.stem,
    difficulty: q.difficulty,
    topicCode: q.topicCode,
    topicName: q.topicName,
    subjectCode: q.subjectCode,
    options: q.options,
    correctKey: q.correctKey,
    explanation: q.explanation,
    references: q.references,
  }));

  return (
    <FlashcardSession
      sessionId={studySession.id}
      questions={serializedQuestions}
      licenseId={licenseId}
      moduleKey={moduleKey}
    />
  );
}
