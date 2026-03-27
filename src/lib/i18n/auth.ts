import type { LandingLocale } from '@/lib/i18n/landing';

export type AuthDictionary = {
  brand: {
    title: string;
    subtitle: string;
  };
  categoriesLabel: string;
  categories: Array<{
    label: string;
    className: string;
  }>;
  login: {
    cardTitle: string;
    cardDescription: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    rememberMe: string;
    submit: string;
    submitting: string;
    validationError: string;
    invalidCredentials: string;
    footerLead: string;
    footerCta: string;
    legalPrefix: string;
    legalAnd: string;
  };
  register: {
    cardTitle: string;
    cardDescription: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    passwordHint: string;
    submit: string;
    submitting: string;
    validationError: string;
    invalidError: string;
    footerLead: string;
    footerCta: string;
    legalPrefix: string;
    legalAnd: string;
  };
  legal: {
    terms: string;
    privacy: string;
  };
};

const sharedCategories = [
  { label: 'M', className: 'bg-blue-100 text-blue-700' },
  { label: 'E', className: 'bg-emerald-100 text-emerald-700' },
  { label: 'S', className: 'bg-violet-100 text-violet-700' },
  { label: 'Balloons', className: 'bg-amber-100 text-amber-700' },
  { label: 'REGS', className: 'bg-rose-100 text-rose-700' },
] as const;

const en: AuthDictionary = {
  brand: {
    title: 'AME Canada Study Pro',
    subtitle: 'Transport Canada AME Certification Platform',
  },
  categoriesLabel: 'AME License Categories',
  categories: [...sharedCategories],
  login: {
    cardTitle: 'Welcome Back',
    cardDescription: 'Sign in to continue your AME certification journey',
    emailLabel: 'Email or Username',
    emailPlaceholder: 'Enter your email or username',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    rememberMe: 'Remember me',
    submit: 'Sign In',
    submitting: 'Signing in...',
    validationError: 'Email and password are required.',
    invalidCredentials: 'Invalid credentials.',
    footerLead: 'Need access?',
    footerCta: 'View Plans & Licenses',
    legalPrefix: 'By signing in, you agree to our',
    legalAnd: 'and',
  },
  register: {
    cardTitle: 'Create Account',
    cardDescription: 'Create your account in seconds and start studying right away.',
    nameLabel: 'Full Name',
    namePlaceholder: 'Enter your full name',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Create a password',
    passwordHint: 'Use at least 8 characters.',
    submit: 'Create Account',
    submitting: 'Creating account...',
    validationError: 'Name, email, and password are required.',
    invalidError: 'Unable to create account.',
    footerLead: 'Already have an account?',
    footerCta: 'Sign In',
    legalPrefix: 'By creating an account, you agree to our',
    legalAnd: 'and',
  },
  legal: {
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
  },
};

const authDictionaries: Record<LandingLocale, AuthDictionary> = {
  en,
  pt: en,
};

export function getAuthDictionary(locale: LandingLocale = 'en'): AuthDictionary {
  return authDictionaries[locale] ?? authDictionaries.en;
}