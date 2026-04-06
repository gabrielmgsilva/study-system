import { redirect } from 'next/navigation';

import { getCurrentSessionServer } from '@/lib/currentUserServer';
import { checkStudentAccess } from '@/lib/services/subscription-guard';
import { getDashboardData } from '@/lib/services/dashboard';
import { DashboardContent } from './dashboard-content';

export default async function DashboardPage() {
  const session = await getCurrentSessionServer();
  if (!session) redirect('/auth/login');

  const access = await checkStudentAccess(session.userId);
  if (!access.allowed) redirect(access.redirect);

  const data = await getDashboardData(session.userId);

  return <DashboardContent data={data} />;
}
