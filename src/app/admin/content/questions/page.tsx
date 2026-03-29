import { getAdminConsoleCopy } from '@/lib/adminConsole';
import { getServerAppLocale } from '@/lib/i18n/appServer';

import AdminQuestionsClient from '../../ui/AdminQuestionsClient';

export default async function AdminQuestionsPage() {
  const locale = await getServerAppLocale();
  void getAdminConsoleCopy(locale);

  return <AdminQuestionsClient locale={locale} />;
}