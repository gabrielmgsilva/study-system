import { redirect } from 'next/navigation';

import { localizeAppHref } from '@/lib/i18n/app';
import { getServerAppLocale } from '@/lib/i18n/appServer';
import { ROUTES } from '@/lib/routes';

export default async function AdminModulesPage() {
  const locale = await getServerAppLocale();
  redirect(localizeAppHref(ROUTES.adminContent, locale));
}
