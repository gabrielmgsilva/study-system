import { notFound } from 'next/navigation';

import { PublicLandingPage } from '@/components/landing/PublicLandingPage';
import { isLandingLocale, landingLocales, normalizeLandingLocale } from '@/lib/i18n/landing';

export function generateStaticParams() {
  return landingLocales.map((locale) => ({ locale }));
}

export default async function LocalizedHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLandingLocale(locale)) {
    notFound();
  }

  const normalizedLocale = normalizeLandingLocale(locale);

  return <PublicLandingPage locale={normalizedLocale} basePath={`/${normalizedLocale}`} />;
}