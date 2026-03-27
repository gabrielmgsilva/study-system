import { getAdminConsoleCopy } from '@/lib/adminConsole';
import { getServerAppLocale } from '@/lib/i18n/appServer';

import AdminContentClient from '../ui/AdminContentClient';

export default async function AdminContentPage() {
  const locale = await getServerAppLocale();
  void getAdminConsoleCopy(locale);

  return <AdminContentClient locale={locale} />;
}
