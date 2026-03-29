import { getAdminConsoleCopy } from '@/lib/adminConsole';
import { getServerAppLocale } from '@/lib/i18n/appServer';

import AdminLicensesClient from '../ui/AdminLicensesClient';

export default async function AdminContentPage() {
  const locale = await getServerAppLocale();
  void getAdminConsoleCopy(locale);

  return <AdminLicensesClient locale={locale} />;
}
