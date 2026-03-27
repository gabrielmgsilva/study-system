import { notFound } from 'next/navigation';

import { PublicLoginPage } from '@/components/auth/PublicLoginPage';
import { isLandingLocale, landingLocales, normalizeLandingLocale } from '@/lib/i18n/landing';

export function generateStaticParams() {
  return landingLocales.map((locale) => ({ locale }));
}

export default async function LocalizedLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLandingLocale(locale)) {
    notFound();
  }

  return <PublicLoginPage locale={normalizeLandingLocale(locale)} />;
}