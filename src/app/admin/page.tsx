import { redirect } from 'next/navigation';

import { getServerAppLocale } from '@/lib/i18n/appServer';
import { localizeAppHref } from '@/lib/i18n/app';
import { ROUTES } from '@/lib/routes';

export default async function AdminIndexPage() {
  const locale = await getServerAppLocale();
  redirect(localizeAppHref(ROUTES.adminUsers, locale));
}
