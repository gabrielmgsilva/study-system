import { getAdminConsoleCopy } from '@/lib/adminConsole';
import { getServerAppLocale } from '@/lib/i18n/appServer';

import AdminUsersClient from '../ui/AdminUsersClient';

export default async function AdminUsersPage() {
  const locale = await getServerAppLocale();
  void getAdminConsoleCopy(locale);

  return <AdminUsersClient locale={locale} />;
}
