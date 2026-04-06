import { redirect } from 'next/navigation';

import { getCurrentUserServer } from '@/lib/currentUserServer';
import { prisma } from '@/lib/prisma';
import { selectQuestions } from '@/lib/services/study-engine';
import { checkQuickReviewAccess } from '@/lib/services/usage-limiter';
import QuickReviewSession from '@/components/student/quick-review-session';

export default async function QuickReviewPage() {
  const user = await getCurrentUserServer();
  if (!user) redirect('/auth/login');

  const access = await checkQuickReviewAccess(user.id);
  if (!access.allowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80dvh] px-6 text-center">
        <div className="text-5xl mb-4">⚡</div>
        <h2 className="text-lg font-semibold mb-2">Quick Review limit reached</h2>
        <p className="text-sm text-muted-foreground mb-4">Come back tomorrow for more!</p>
        <a href="/dashboard" className="inline-flex items-center justify-center h-12 px-6 rounded-lg bg-primary text-primary-foreground font-medium">
          Back to Dashboard
        </a>
      </div>
    );
  }

  const questions = await selectQuestions(user.id, '', 'quick_review', 5);

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80dvh] px-6 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-lg font-semibold mb-2">All caught up!</h2>
        <p className="text-sm text-muted-foreground mb-4">No weak topics to review right now.</p>
        <a href="/dashboard" className="inline-flex items-center justify-center h-12 px-6 rounded-lg bg-primary text-primary-foreground font-medium">
          Back to Dashboard
        </a>
      </div>
    );
  }

  const session = await prisma.studySession.create({
    data: {
      userId: user.id,
      licenseId: 'cross-module',
      moduleKey: 'quick-review',
      mode: 'practice',
      isQuickReview: true,
      startedAt: new Date(),
    },
  });

  const isExpired = !user.subscriptionStatus || user.subscriptionStatus === 'expired' || user.subscriptionStatus === 'canceled';

  return <QuickReviewSession questions={questions} sessionId={session.id} showUpgradeCta={isExpired} />;
}
