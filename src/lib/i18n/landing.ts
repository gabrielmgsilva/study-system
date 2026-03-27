export const landingLocales = ['en', 'pt'] as const;

export type LandingLocale = (typeof landingLocales)[number];

export type LandingDictionary = {
  nav: {
    howItWorks: string;
    benefits: string;
    pricing: string;
    faq: string;
    signIn: string;
    getStarted: string;
  };
  hero: {
    badge: string;
    title: string[];
    description: string;
    primaryCta: string;
    secondaryCta: string;
    stats: Array<{
      value: string;
      label: string;
    }>;
    visualEyebrow: string;
    visualTitle: string;
    visualDescription: string;
  };
  howItWorks: {
    eyebrow: string;
    title: string;
    description: string;
    steps: Array<{
      number: string;
      title: string;
      description: string;
    }>;
  };
  benefits: {
    eyebrow: string;
    title: string;
    description: string;
    licenseCard: {
      title: string;
      description: string;
      items: string[];
    };
    studyCard: {
      title: string;
      description: string;
      items: Array<{
        title: string;
        description: string;
      }>;
    };
    analyticsCard: {
      title: string;
      description: string;
      items: Array<{
        title: string;
        description: string;
      }>;
    };
  };
  pricing: {
    eyebrow: string;
    title: string;
    description: string;
    popular: string;
    plans: Array<{
      name: string;
      subtitle: string;
      price: string;
      period: string;
      cta: string;
      features: string[];
      mutedFeatures?: string[];
      highlighted?: boolean;
    }>;
  };
  security: {
    title: string;
    description: string;
    items: Array<{
      title: string;
      description: string;
    }>;
    devices: string[];
  };
  faq: {
    eyebrow: string;
    title: string;
    description: string;
    items: Array<{
      question: string;
      answer: string;
    }>;
  };
  footer: {
    description: string;
    platform: string;
    legal: string;
    social: string;
    links: {
      howItWorks: string;
      benefits: string;
      pricing: string;
      faq: string;
      terms: string;
      privacy: string;
      subscription: string;
    };
    copyright: string;
  };
};

const en: LandingDictionary = {
  nav: {
    howItWorks: 'How It Works',
    benefits: 'Benefits',
    pricing: 'Pricing',
    faq: 'FAQ',
    signIn: 'Sign In',
    getStarted: 'Get Started',
  },
  hero: {
    badge: 'ANAC Certification',
    title: ['Your Aircraft Maintenance', 'Approval Journey', 'Starts Here'],
    description:
      'Prepare for the AME certification process with real exam-style questions, performance analysis, and focused study guidance for each license.',
    primaryCta: 'Start Now',
    secondaryCta: 'View Plans',
    stats: [
      { value: '5+', label: 'Licenses' },
      { value: '1000+', label: 'Questions' },
      { value: '24/7', label: 'Support' },
    ],
    visualEyebrow: 'Practical aviation learning',
    visualTitle: 'Structured study for AME candidates',
    visualDescription:
      'A focused learning environment with guided practice, mock tests, and clear progress tracking.',
  },
  howItWorks: {
    eyebrow: 'How It Works',
    title: 'How It Works',
    description: 'Three simple steps for your approval path',
    steps: [
      {
        number: '1',
        title: 'Choose Your License',
        description:
          'Select between M (Mechanical), E (Avionics), S (Structures), Balloons, or REGS to begin your focused study path.',
      },
      {
        number: '2',
        title: 'Study With Real Questions',
        description:
          'Practice with exam-style questions and targeted drills based on the topics that matter most for your preparation.',
      },
      {
        number: '3',
        title: 'Track Your Progress',
        description:
          'Follow your evolution with detailed analytics by topic and identify your improvement priorities quickly.',
      },
    ],
  },
  benefits: {
    eyebrow: 'Platform Benefits',
    title: 'Platform Benefits',
    description: 'Everything you need to prepare with confidence',
    licenseCard: {
      title: 'Study by License',
      description: 'Focused content for each certification path',
      items: ['M - Mechanical', 'E - Avionics', 'S - Structures', 'Balloons', 'REGS - Regulations'],
    },
    studyCard: {
      title: 'Study Modes',
      description: 'Learn your way with flexible modes',
      items: [
        {
          title: 'Practice Mode',
          description: 'Answer questions with no time pressure.',
        },
        {
          title: 'Test Mode',
          description: 'Run full mock exams with a countdown.',
        },
        {
          title: 'Flashcards',
          description: 'Memorize key concepts faster.',
        },
      ],
    },
    analyticsCard: {
      title: 'Performance Analytics',
      description: 'Understand your strengths and weak spots',
      items: [
        {
          title: 'Progress by Topic',
          description: 'See your performance in each subject area.',
        },
        {
          title: 'Accuracy Rate',
          description: 'Track your progress over time.',
        },
        {
          title: 'Recommendations',
          description: 'Get suggestions on what to review next.',
        },
      ],
    },
  },
  pricing: {
    eyebrow: 'Plans and Pricing',
    title: 'Plans and Pricing',
    description: 'Choose the ideal plan for your preparation',
    popular: 'Most Popular',
    plans: [
      {
        name: 'Basic',
        subtitle: 'To get started',
        price: 'Free',
        period: '',
        cta: 'Start Free',
        features: ['1 license', '100 questions', 'Practice mode', 'Basic statistics'],
        mutedFeatures: ['Test mode', 'Flashcards'],
      },
      {
        name: 'Standard',
        subtitle: 'Most chosen',
        price: '$49',
        period: '/month',
        cta: 'Subscribe Now',
        highlighted: true,
        features: [
          '3 licenses',
          '500 questions',
          'All study modes',
          'Full analytics',
          'Priority support',
          'Mobile access',
        ],
      },
      {
        name: 'Premium',
        subtitle: 'Complete access',
        price: '$99',
        period: '/month',
        cta: 'Get Premium',
        features: [
          'All licenses',
          'Unlimited questions',
          'All Standard resources',
          'Personalized simulations',
          'Individual mentorship',
          'Additional study material',
        ],
      },
    ],
  },
  security: {
    title: 'Secure and Cross-Platform Learning',
    description:
      'Your study journey is protected and accessible from any device you use throughout the day.',
    items: [
      {
        title: 'Protected Data',
        description: 'Account encryption and secure authentication.',
      },
      {
        title: 'Mobile Access',
        description: 'Available on iOS and Android devices.',
      },
      {
        title: 'Sync',
        description: 'Real-time progress synchronization.',
      },
      {
        title: '24/7 Support',
        description: 'Always available when you need help.',
      },
    ],
    devices: ['Desktop', 'Tablet', 'iOS', 'Android'],
  },
  faq: {
    eyebrow: 'Frequently Asked Questions',
    title: 'Frequently Asked Questions',
    description: 'Clear answers about the platform',
    items: [
      {
        question: 'Can I change plans later?',
        answer:
          'Yes. You can upgrade or downgrade your subscription based on your study needs and license goals.',
      },
      {
        question: 'Are the questions updated regularly?',
        answer:
          'Yes. The question bank is reviewed and expanded frequently to keep the study experience relevant and consistent.',
      },
      {
        question: 'Does it work offline?',
        answer:
          'The platform is optimized for online use so your progress and analytics stay synchronized across devices.',
      },
      {
        question: 'Is approval guaranteed?',
        answer:
          'No platform can guarantee approval, but AME ONE is designed to improve preparation quality with structured practice and feedback.',
      },
      {
        question: 'Can I cancel anytime?',
        answer:
          'Yes. Paid plans can be canceled according to the subscription terms without locking your account data.',
      },
    ],
  },
  footer: {
    description: 'A complete study platform for aircraft maintenance certification.',
    platform: 'Platform',
    legal: 'Legal',
    social: 'Social',
    links: {
      howItWorks: 'How It Works',
      benefits: 'Benefits',
      pricing: 'Pricing',
      faq: 'FAQ',
      terms: 'Terms of Use',
      privacy: 'Privacy Policy',
      subscription: 'Subscription Agreement',
    },
    copyright: '© 2026 AME ONE. All rights reserved.',
  },
};

const landingDictionaries: Record<LandingLocale, LandingDictionary> = {
  en,
  pt: en,
};

export function getLandingDictionary(locale: LandingLocale = 'en'): LandingDictionary {
  return landingDictionaries[locale] ?? landingDictionaries.en;
}

export function isLandingLocale(value: string): value is LandingLocale {
  return landingLocales.includes(value as LandingLocale);
}

export function normalizeLandingLocale(value?: string): LandingLocale {
  if (value && isLandingLocale(value)) {
    return value;
  }

  return 'en';
}