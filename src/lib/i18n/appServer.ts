import 'server-only';

import { cookies, headers } from 'next/headers';

import { normalizeLandingLocale } from '@/lib/i18n/landing';
import { appLocaleCookie } from '@/lib/i18n/app';

export async function getServerAppLocale() {
  const headerStore = await headers();
  const headerLocale = headerStore.get('x-ameone-locale');

  if (headerLocale) {
    return normalizeLandingLocale(headerLocale);
  }

  const cookieStore = await cookies();
  return normalizeLandingLocale(cookieStore.get(appLocaleCookie)?.value);
}