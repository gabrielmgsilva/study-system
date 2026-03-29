import { notFound } from 'next/navigation';

import AdminQuestionsClient from '@/app/admin/ui/AdminQuestionsClient';
import { prisma } from '@/lib/prisma';
import { getServerAppLocale } from '@/lib/i18n/appServer';

export default async function AdminTopicQuestionsPage({
  params,
}: {
  params: Promise<{ licenseId: string; topicId: string }>;
}) {
  const locale = await getServerAppLocale();
  const { licenseId, topicId: topicIdParam } = await params;
  const topicId = Number(topicIdParam);

  if (!Number.isInteger(topicId) || topicId <= 0) {
    notFound();
  }

  const topic = await prisma.topic.findFirst({
    where: {
      id: topicId,
      deletedAt: null,
      subject: {
        deletedAt: null,
        module: {
          deletedAt: null,
          licenseId,
        },
      },
    },
    select: {
      id: true,
      code: true,
      name: true,
      subject: {
        select: {
          id: true,
          code: true,
          name: true,
          module: {
            select: {
              id: true,
              name: true,
              license: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!topic) {
    notFound();
  }

  return (
    <AdminQuestionsClient
      locale={locale}
      lockedHierarchy
      initialFilters={{
        licenseId: topic.subject.module.license.id,
        moduleId: String(topic.subject.module.id),
        subjectId: String(topic.subject.id),
        topicId: String(topic.id),
      }}
      hierarchySummary={{
        licenseName: topic.subject.module.license.name,
        moduleName: topic.subject.module.name,
        subjectName: `${topic.subject.code} · ${topic.subject.name}`,
        topicName: `${topic.code} · ${topic.name}`,
      }}
    />
  );
}