import { getServerAppLocale } from '@/lib/i18n/appServer';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminIndexPage() {
  const locale = await getServerAppLocale();
  return <AdminDashboardClient locale={locale} />;
}
