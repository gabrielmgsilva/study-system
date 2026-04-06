import { redirect } from 'next/navigation';

import { getCurrentSessionServer } from '@/lib/currentUserServer';
import { checkStudentAccess } from '@/lib/services/subscription-guard';
import { selectQuestions } from '@/lib/services/study-engine';
import { prisma } from '@/lib/prisma';
import { TestSession } from '@/components/student/test-session';

export const metadata = { title: 'Test' };

export default async function TestPage({
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

  const questions = await selectQuestions(session.userId, moduleKey, 'test');

  if (questions.length === 0) redirect(`/study`);

  const studySession = await prisma.studySession.create({
    data: {
      userId: session.userId,
      licenseId,
      moduleKey,
      mode: 'test',
      questionsAnswered: 0,
      isQuickReview: false,
    },
    select: { id: true },
  });

  const testAttempt = await prisma.testAttempt.create({
    data: {
      userId: session.userId,
      moduleKey,
      status: 'in_progress',
      questionIds: JSON.stringify(questions.map((q) => q.externalId)),
      answers: '{}',
      currentIndex: 0,
      questionsTotal: questions.length,
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
    <TestSession
      sessionId={studySession.id}
      testAttemptId={testAttempt.id}
      questions={serializedQuestions}
      licenseId={licenseId}
      moduleKey={moduleKey}
      timeLimitMinutes={60}
    />
  );
}
