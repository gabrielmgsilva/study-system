import { redirect } from 'next/navigation';

import { getCurrentSessionServer } from '@/lib/currentUserServer';
import { checkStudentAccess } from '@/lib/services/subscription-guard';
import { getUserGoals, generateAutoGoals } from '@/lib/services/goals';
import { GoalsContent } from '@/components/student/goals-content';

export default async function GoalsPage() {
  const session = await getCurrentSessionServer();
  if (!session) redirect('/auth/login');

  const access = await checkStudentAccess(session.userId);
  if (!access.allowed) redirect(access.redirect);

  // Generate auto-goals if needed (side effect, doesn't block)
  await generateAutoGoals(session.userId).catch(() => {});

  const goals = await getUserGoals(session.userId);

  return <GoalsContent goals={goals} />;
}
