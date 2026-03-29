import { getAdminConsoleCopy } from '@/lib/adminConsole';
import { getServerAppLocale } from '@/lib/i18n/appServer';

import AdminCouponsClient from '../ui/AdminCouponsClient';

export default async function AdminCouponsPage() {
  const locale = await getServerAppLocale();
  void getAdminConsoleCopy(locale);

  return <AdminCouponsClient locale={locale} />;
}
