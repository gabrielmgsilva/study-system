import { localizeAppHref } from '@/lib/i18n/app';
import type { LandingLocale } from '@/lib/i18n/landing';

type ClientRouter = {
  push: (href: string) => void;
  refresh: () => void;
};

export async function logoutAndRedirect(locale: LandingLocale, router: ClientRouter) {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  }).catch(() => {});

  router.push(localizeAppHref('/', locale));
  router.refresh();
}