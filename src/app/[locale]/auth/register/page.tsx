import { notFound } from 'next/navigation';

import { PublicRegisterPage } from '@/components/auth/PublicRegisterPage';
import { isLandingLocale, landingLocales, normalizeLandingLocale } from '@/lib/i18n/landing';

export function generateStaticParams() {
  return landingLocales.map((locale) => ({ locale }));
}

export default async function LocalizedRegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLandingLocale(locale)) {
    notFound();
  }

  return <PublicRegisterPage locale={normalizeLandingLocale(locale)} />;
}