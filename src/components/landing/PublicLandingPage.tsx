import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  ChartColumn,
  Check,
  CircleHelp,
  ClipboardList,
  Facebook,
  Instagram,
  LayoutGrid,
  Linkedin,
  Monitor,
  ShieldCheck,
  Smartphone,
  Tablet,
  Twitter,
} from 'lucide-react';
import { Sora } from 'next/font/google';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { getLandingDictionary, type LandingLocale } from '@/lib/i18n/landing';
import { getPublicPlans, type PublicPlan } from '@/lib/publicPlans';
import {
  getPublicPlanSectionId,
  type PublicPlanSectionId,
} from '@/lib/publicPlanPresentation';
import { ROUTES } from '@/lib/routes';
import LandingPricingSection from './LandingPricingSection';

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const navSections = [
  { key: 'howItWorks', section: 'how-it-works' },
  { key: 'benefits', section: 'benefits' },
  { key: 'pricing', section: 'pricing' },
  { key: 'faq', section: 'faq' },
] as const;

const localeOptions: Array<{
  locale: LandingLocale;
  label: string;
  country: string;
  flagClassName: string;
}> = [
  {
    locale: 'en',
    label: 'EN',
    country: 'English',
    flagClassName:
      'bg-[linear-gradient(180deg,#b22234_0_14%,#ffffff_14%_28%,#b22234_28%_42%,#ffffff_42%_56%,#b22234_56%_70%,#ffffff_70%_84%,#b22234_84%_100%)] before:absolute before:left-0 before:top-0 before:h-[58%] before:w-[45%] before:bg-[#3c3b6e]',
  },
] as const;

type PublicLandingPageProps = {
  locale?: LandingLocale;
  basePath?: string;
};

function getLandingLink(basePath: string, section?: string) {
  if (!section) {
    return basePath || '/';
  }

  return basePath ? `${basePath}#${section}` : `#${section}`;
}

function getLocaleHref(targetLocale: LandingLocale, section?: string) {
  const basePath = `/${targetLocale}`;

  return section ? `${basePath}#${section}` : basePath;
}

export async function PublicLandingPage({
  locale = 'en',
  basePath = '',
}: PublicLandingPageProps) {
  const dictionary = getLandingDictionary(locale);
  const homeHref = getLandingLink(basePath);
  const plans = await getPublicPlans();
  const planSections: Array<{
    id: PublicPlanSectionId;
    eyebrow: string;
    title: string;
    description: string;
    plans: PublicPlan[];
  }> = [
    {
      id: 'regs',
      eyebrow: dictionary.pricing.regsEyebrow,
      title: dictionary.pricing.regsTitle,
      description: dictionary.pricing.regsDescription,
      plans: plans.filter((plan) => getPublicPlanSectionId(plan) === 'regs'),
    },
    {
      id: 'licenses',
      eyebrow: dictionary.pricing.licensesEyebrow,
      title: dictionary.pricing.licensesTitle,
      description: dictionary.pricing.licensesDescription,
      plans: plans.filter((plan) => getPublicPlanSectionId(plan) === 'licenses'),
    },
    {
      id: 'logbook',
      eyebrow: dictionary.pricing.logbookEyebrow,
      title: dictionary.pricing.logbookTitle,
      description: dictionary.pricing.logbookDescription,
      plans: plans.filter((plan) => getPublicPlanSectionId(plan) === 'logbook'),
    },
  ];

  return (
    <div className="relative z-10 min-h-screen bg-[#f5f7fb] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 sm:py-4">
          <Link href={homeHref} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#132d58] shadow-sm">
              <Image src="/home/logo.svg" alt="AME ONE" width={20} height={20} priority />
            </div>
            <span className={`${sora.className} text-base font-semibold tracking-tight text-[#102a54]`}>
              AME ONE
            </span>
          </Link>

          <nav className="hidden items-center justify-center gap-7 text-sm font-medium text-slate-600 lg:flex">
            {navSections.map((item) => (
              <Link
                key={item.key}
                href={getLandingLink(basePath, item.section)}
                className="transition hover:text-[#0f2b57]"
              >
                {dictionary.nav[item.key]}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm lg:flex">
              {localeOptions.map((option) => {
                const isActive = option.locale === locale;

                return (
                  <Link
                    key={option.locale}
                    href={getLocaleHref(option.locale)}
                    aria-label={option.country}
                    className={[
                      'flex items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-semibold transition',
                      isActive
                        ? 'bg-[#102a54] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-[#102a54]',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'relative block h-3.5 w-5 overflow-hidden rounded-[2px] shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)] before:content-[""]',
                        option.flagClassName,
                      ].join(' ')}
                    />
                    <span>{option.label}</span>
                  </Link>
                );
              })}
            </div>

            <Button
              asChild
              variant="ghost"
              className="hidden text-sm font-semibold text-[#0f2b57] hover:bg-[#f0f5ff] hover:text-[#0f2b57] sm:inline-flex"
            >
              <Link href={ROUTES.localizedLogin(locale)}>{dictionary.nav.signIn}</Link>
            </Button>
            <Button
              asChild
              className="h-10 rounded-md bg-[#ff6d3a] px-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(255,109,58,0.25)] hover:bg-[#f2612e]"
            >
              <Link href={ROUTES.localizedRegister(locale)}>{dictionary.nav.getStarted}</Link>
            </Button>
          </div>

          <div className="col-span-3 flex flex-col gap-3 pt-1 md:hidden">
            <div className="flex items-center justify-center gap-2">
              {localeOptions.map((option) => {
                const isActive = option.locale === locale;

                return (
                  <Link
                    key={option.locale}
                    href={getLocaleHref(option.locale)}
                    aria-label={option.country}
                    className={[
                      'flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition',
                      isActive
                        ? 'border-[#102a54] bg-[#102a54] text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-[#102a54]',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'relative block h-3.5 w-5 overflow-hidden rounded-[2px] shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)] before:content-[""]',
                        option.flagClassName,
                      ].join(' ')}
                    />
                    <span>{option.label}</span>
                  </Link>
                );
              })}
            </div>

            <nav className="flex items-center justify-center gap-4 overflow-x-auto text-sm font-medium text-slate-600 scrollbar-none">
            {navSections.map((item) => (
              <Link
                key={item.key}
                href={getLandingLink(basePath, item.section)}
                className="whitespace-nowrap transition hover:text-[#0f2b57]"
              >
                {dictionary.nav[item.key]}
              </Link>
            ))}
            </nav>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero-pattern overflow-hidden">
          <div className="landing-grid">
            <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:py-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-12 lg:py-20">
              <div className="space-y-6 text-white sm:space-y-7">
                <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-medium tracking-wide text-cyan-200">
                  {dictionary.hero.badge}
                </div>

                <div className="space-y-4">
                  <h1 className={`${sora.className} max-w-xl text-[2.35rem] font-bold leading-[0.98] tracking-tight sm:text-5xl lg:text-[3.75rem]`}>
                    <span className="block">{dictionary.hero.title[0]}</span>
                    <span className="block">{dictionary.hero.title[1]}</span>
                    <span className="block text-[#18c8ff]">{dictionary.hero.title[2]}</span>
                  </h1>

                  <p className="max-w-xl text-[15px] leading-7 text-slate-300 md:text-lg">
                    {dictionary.hero.description}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    asChild
                    size="lg"
                    className="min-h-12 rounded-md bg-[#ff6d3a] px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(255,109,58,0.28)] hover:bg-[#f2612e] max-sm:w-full"
                  >
                    <Link href={ROUTES.localizedRegister(locale)} className="flex items-center gap-2">
                      {dictionary.hero.primaryCta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="min-h-12 rounded-md border border-white/20 bg-white/8 px-6 text-sm font-semibold text-white hover:bg-white/14 hover:text-white max-sm:w-full"
                  >
                    <Link href={getLandingLink(basePath, 'pricing')}>{dictionary.hero.secondaryCta}</Link>
                  </Button>
                </div>

                <div className="grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-5 sm:gap-6 sm:pt-6">
                  {dictionary.hero.stats.map((item) => (
                    <div key={item.label}>
                      <div className="text-2xl font-bold text-[#18c8ff]">{item.value}</div>
                      <div className="mt-1 text-xs text-slate-300 sm:text-sm">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#10233f] shadow-[0_20px_60px_rgba(5,15,34,0.45)]">
                  <Image
                    src="/home/51ed925481-1408cffd65a92ae8aa3e.png"
                    alt="Aircraft inside a maintenance hangar"
                    width={768}
                    height={768}
                    priority
                    className="h-[280px] w-full object-cover object-center sm:h-[420px] lg:h-[500px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 bg-white py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-500">{dictionary.howItWorks.eyebrow}</p>
              <h2 className={`${sora.className} mt-3 text-3xl font-semibold tracking-tight text-[#102a54] sm:text-4xl`}>
                {dictionary.howItWorks.title}
              </h2>
              <p className="mt-3 text-sm text-slate-500 sm:text-base">{dictionary.howItWorks.description}</p>
            </div>

            <div className="mt-10 grid gap-5 lg:mt-12 lg:grid-cols-3 lg:gap-6">
              {dictionary.howItWorks.steps.map((step, index) => {
                const Icon = [ClipboardList, BookOpen, ChartColumn][index];

                return (
                  <article
                    key={step.number}
                    className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,43,87,0.08)] sm:p-7"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff6d3a] text-sm font-bold text-white shadow-[0_10px_22px_rgba(255,109,58,0.25)]">
                      {step.number}
                    </div>
                    <div className="mt-5 flex justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-[#102a54]">
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                    <h3 className={`${sora.className} mt-5 text-center text-xl font-semibold text-[#102a54]`}>
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-500">{step.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="benefits" className="scroll-mt-24 bg-[#f7f8fc] py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-500">{dictionary.benefits.eyebrow}</p>
              <h2 className={`${sora.className} mt-3 text-3xl font-semibold tracking-tight text-[#102a54] sm:text-4xl`}>
                {dictionary.benefits.title}
              </h2>
              <p className="mt-3 text-sm text-slate-500 sm:text-base">{dictionary.benefits.description}</p>
            </div>

            <div className="mt-10 grid gap-5 lg:mt-12 lg:grid-cols-[1fr_1fr_1fr] lg:gap-6">
              <article className="rounded-[22px] bg-[#102a54] p-6 text-white shadow-[0_22px_50px_rgba(16,42,84,0.24)] sm:p-7">
                <div className="flex justify-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-[#102a54]">
                    <LayoutGrid className="h-5 w-5" />
                  </div>
                </div>
                <h3 className={`${sora.className} mt-5 text-center text-2xl font-semibold`}>
                  {dictionary.benefits.licenseCard.title}
                </h3>
                <p className="mt-2 text-sm text-slate-300">{dictionary.benefits.licenseCard.description}</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-100">
                  {dictionary.benefits.licenseCard.items.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-cyan-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,43,87,0.08)] sm:p-7">
                <div className="flex justify-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff1eb] text-[#ff6d3a]">
                    <BookOpen className="h-5 w-5" />
                  </div>
                </div>
                <h3 className={`${sora.className} mt-5 text-center text-2xl font-semibold text-[#102a54]`}>
                  {dictionary.benefits.studyCard.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500">{dictionary.benefits.studyCard.description}</p>
                <div className="mt-6 space-y-3">
                  {dictionary.benefits.studyCard.items.map((item, index) => (
                    <div key={item.title} className="rounded-2xl bg-slate-50 px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 h-3 w-3 rounded-full ${index === 0 ? 'bg-[#ff6d3a]' : index === 1 ? 'bg-[#ffa66a]' : 'bg-[#d9dee8]'}`} />
                        <div>
                          <p className="text-sm font-semibold text-[#102a54]">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[22px] border border-cyan-200 bg-[#eef9ff] p-6 shadow-[0_18px_40px_rgba(15,43,87,0.08)] sm:p-7">
                <div className="flex justify-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#102a54] text-white">
                    <ChartColumn className="h-5 w-5" />
                  </div>
                </div>
                <h3 className={`${sora.className} mt-5 text-center text-2xl font-semibold text-[#102a54]`}>
                  {dictionary.benefits.analyticsCard.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500">{dictionary.benefits.analyticsCard.description}</p>
                <div className="mt-6 space-y-4">
                  {dictionary.benefits.analyticsCard.items.map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-600">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#102a54]">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        <LandingPricingSection
          locale={locale}
          dictionary={dictionary}
          planSections={planSections}
          totalPlans={plans.length}
          soraClassName={sora.className}
        />

        <section className="bg-[#f7f8fc] py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="rounded-[28px] bg-[#102a54] px-6 py-8 text-white shadow-[0_25px_60px_rgba(16,42,84,0.3)] sm:px-10 sm:py-12">
              <div className="grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
                <div>
                  <h2 className={`${sora.className} max-w-md text-3xl font-semibold tracking-tight sm:text-4xl`}>
                    {dictionary.security.title}
                  </h2>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                    {dictionary.security.description}
                  </p>

                  <div className="mt-8 grid gap-5 sm:grid-cols-2">
                    {dictionary.security.items.map((item, index) => {
                      const Icon = [ShieldCheck, Smartphone, ClipboardList, CircleHelp][index];

                      return (
                        <div key={item.title} className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123566] text-cyan-300">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{item.title}</p>
                            <p className="mt-1 text-sm text-slate-300">{item.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {dictionary.security.devices.map((device, index) => {
                    const Icon = [Monitor, Tablet, Smartphone, Smartphone][index];

                    return (
                      <div
                        key={device}
                        className="flex min-h-[92px] flex-col items-center justify-center rounded-2xl bg-[#163764] text-center shadow-inner sm:min-h-[102px]"
                      >
                        <Icon className="h-6 w-6 text-cyan-300" />
                        <span className="mt-3 text-sm font-medium text-slate-200">{device}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 bg-white py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-4xl px-4">
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-500">{dictionary.faq.eyebrow}</p>
              <h2 className={`${sora.className} mt-3 text-3xl font-semibold tracking-tight text-[#102a54] sm:text-4xl`}>
                {dictionary.faq.title}
              </h2>
              <p className="mt-3 text-sm text-slate-500 sm:text-base">{dictionary.faq.description}</p>
            </div>

            <div className="mt-10 rounded-[24px] bg-white sm:mt-12">
              <Accordion type="single" collapsible className="space-y-4">
                {dictionary.faq.items.map((item, index) => (
                  <AccordionItem
                    key={item.question}
                    value={`faq-${index}`}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 shadow-[0_10px_28px_rgba(15,43,87,0.06)]"
                  >
                    <AccordionTrigger className="py-5 text-sm font-semibold text-[#102a54] hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-sm leading-7 text-slate-500">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#102a54] pb-8 pt-14 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
            <div>
              <Link href={homeHref} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                  <Image src="/home/logo.svg" alt="AME ONE" width={22} height={22} />
                </div>
                <span className={`${sora.className} text-lg font-semibold`}>AME ONE</span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-7 text-slate-300">
                {dictionary.footer.description}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                {dictionary.footer.platform}
              </h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <Link href={getLandingLink(basePath, 'how-it-works')} className="block transition hover:text-white">
                  {dictionary.footer.links.howItWorks}
                </Link>
                <Link href={getLandingLink(basePath, 'benefits')} className="block transition hover:text-white">
                  {dictionary.footer.links.benefits}
                </Link>
                <Link href={getLandingLink(basePath, 'pricing')} className="block transition hover:text-white">
                  {dictionary.footer.links.pricing}
                </Link>
                <Link href={getLandingLink(basePath, 'faq')} className="block transition hover:text-white">
                  {dictionary.footer.links.faq}
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                {dictionary.footer.legal}
              </h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <Link href={ROUTES.terms} className="block transition hover:text-white">
                  {dictionary.footer.links.terms}
                </Link>
                <Link href={ROUTES.privacy} className="block transition hover:text-white">
                  {dictionary.footer.links.privacy}
                </Link>
                <Link href={ROUTES.pricing} className="block transition hover:text-white">
                  {dictionary.footer.links.subscription}
                </Link>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                {dictionary.footer.social}
              </h3>
              <div className="mt-4 flex items-center gap-3">
                {[Facebook, Instagram, Linkedin, Twitter].map((Icon, index) => (
                  <Link
                    key={index}
                    href={homeHref}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-slate-200 transition hover:bg-white/16 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <p className="pt-7 text-center text-sm text-slate-400">{dictionary.footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}