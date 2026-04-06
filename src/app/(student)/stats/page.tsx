import { redirect } from 'next/navigation';

import { getCurrentSessionServer } from '@/lib/currentUserServer';
import { checkStudentAccess } from '@/lib/services/subscription-guard';
import {
  getStatsOverview,
  getSessionHistory,
  getTopicStats,
} from '@/lib/services/stats';
import { StatsContent } from '@/components/student/stats-content';

export default async function StatsPage() {
  const session = await getCurrentSessionServer();
  if (!session) redirect('/auth/login');

  const access = await checkStudentAccess(session.userId);
  if (!access.allowed) redirect(access.redirect);

  const [overview, history, topics] = await Promise.all([
    getStatsOverview(session.userId),
    getSessionHistory(session.userId),
    getTopicStats(session.userId),
  ]);

  return (
    <StatsContent
      overview={overview}
      initialHistory={history}
      topics={topics}
    />
  );
}
