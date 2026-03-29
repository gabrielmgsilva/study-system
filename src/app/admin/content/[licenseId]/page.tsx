import { getServerAppLocale } from '@/lib/i18n/appServer';

import AdminLicenseDetailClient from '../../ui/AdminLicenseDetailClient';

export default async function AdminLicenseDetailPage({
  params,
}: {
  params: Promise<{ licenseId: string }>;
}) {
  const locale = await getServerAppLocale();
  const { licenseId } = await params;

  return <AdminLicenseDetailClient locale={locale} licenseId={licenseId} />;
}