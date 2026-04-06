import { redirect } from 'next/navigation';

import { getCurrentSessionServer } from '@/lib/currentUserServer';
import { checkStudentAccess } from '@/lib/services/subscription-guard';
import { prisma } from '@/lib/prisma';
import { getLicenseEntitlementSnapshots } from '@/lib/studyAccess';
import { StudyHubContent } from '@/components/student/study-hub-content';

export const metadata = { title: 'Study' };

export default async function StudyPage() {
  const session = await getCurrentSessionServer();
  if (!session) redirect('/auth/login');

  const access = await checkStudentAccess(session.userId);
  if (!access.allowed) redirect(access.redirect);

  const entitlements = await getLicenseEntitlementSnapshots(
    prisma,
    session.userId,
  );

  const enrolledLicenseIds = Object.keys(entitlements);

  const licenses = await prisma.license.findMany({
    where: { id: { in: enrolledLicenseIds }, isActive: true, deletedAt: null },
    orderBy: { displayOrder: 'asc' },
    select: { id: true, name: true },
  });

  const modules = await prisma.module.findMany({
    where: {
      licenseId: { in: enrolledLicenseIds },
      isActive: true,
      deletedAt: null,
    },
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      moduleKey: true,
      name: true,
      licenseId: true,
    },
  });

  const progress = await prisma.studyProgress.findMany({
    where: { userId: session.userId, deletedAt: null },
    select: {
      moduleKey: true,
      mode: true,
      questionsTotal: true,
      questionsCorrect: true,
    },
  });

  const serializedEntitlements: Record<
    string,
    {
      flashcardsRemaining: number | null;
      practiceRemaining: number | null;
      testsRemaining: number | null;
    }
  > = {};
  for (const [lid, snap] of Object.entries(entitlements)) {
    serializedEntitlements[lid] = {
      flashcardsRemaining: snap.usage.flashcardsRemaining,
      practiceRemaining: snap.usage.practiceRemaining,
      testsRemaining: snap.usage.testsRemaining,
    };
  }

  return (
    <div className="px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">Study</h1>
      <StudyHubContent
        licenses={licenses}
        modules={modules}
        progress={progress}
        entitlements={serializedEntitlements}
      />
    </div>
  );
}
