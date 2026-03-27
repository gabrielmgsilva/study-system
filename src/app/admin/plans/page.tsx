import { getAdminConsoleCopy } from '@/lib/adminConsole';
import { getServerAppLocale } from '@/lib/i18n/appServer';

import AdminPlansClient from '../ui/AdminPlansClient';

export default async function AdminPlansPage() {
  const locale = await getServerAppLocale();
  void getAdminConsoleCopy(locale);

  return <AdminPlansClient locale={locale} />;
}