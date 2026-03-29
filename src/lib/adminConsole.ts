import { ROUTES } from '@/lib/routes';
import type { LandingLocale } from '@/lib/i18n/landing';

export type AdminSectionId = 'users' | 'plans' | 'content' | 'coupons';

export function getAdminConsoleCopy(locale: LandingLocale = 'en') {
  if (locale === 'pt') {
    return {
      shellTitle: 'Administração',
      shellDescription:
        'Gerencie usuários, catálogo de planos e o conteúdo normalizado consumido por flashcards e testes.',
      backToApp: 'Voltar ao app',
      switchLanguage: 'Trocar idioma',
      sections: [
        {
          id: 'users' as const,
          label: 'Usuários',
          description: 'Contas, papéis, onboarding e visão de assinaturas por usuário.',
          href: ROUTES.adminUsers,
        },
        {
          id: 'plans' as const,
          label: 'Gerenciamento de Planos',
          description: 'Catálogo de planos, limites de uso e quantidade máxima de certificações por usuário.',
          href: ROUTES.adminPlans,
        },
        {
          id: 'content' as const,
          label: 'Conteúdos',
          description: 'Questões, tópicos e status editorial do conteúdo exibido ao aluno.',
          href: ROUTES.adminContent,
        },
        {
          id: 'coupons' as const,
          label: 'Cupons',
          description: 'Cupons de desconto sincronizados com o Stripe para planos anuais.',
          href: ROUTES.adminCoupons,
        },
      ],
      pages: {
        users: {
          eyebrow: 'Administração de usuários',
          title: 'Usuários',
          description:
            'Liste, filtre e atualize usuários com paginação, busca textual e edição de perfil administrativo.',
        },
        plans: {
          eyebrow: 'Gerenciamento de planos',
          title: 'Plan Management',
          description:
            'Cadastre, pesquise e edite planos dinâmicos com preço, limites de uso e limite de certificações por usuário.',
        },
        content: {
          eyebrow: 'Administração de conteúdo',
          title: 'Certificações e estrutura de conteúdo',
          description:
            'Gerencie certificações, a estrutura hierárquica de módulos e o acesso ao gerenciador editorial de questões.',
        },
        coupons: {
          eyebrow: 'Gestão de cupons',
          title: 'Cupons de Desconto',
          description:
            'Crie e gerencie cupons de desconto percentuais sincronizados com o Stripe.',
        },
      },
    };
  }

  return {
    shellTitle: 'Administration',
    shellDescription:
      'Manage users, subscription catalog, and the normalized content consumed by flashcards and tests.',
    backToApp: 'Back to app',
    switchLanguage: 'Switch language',
    sections: [
      {
        id: 'users' as const,
        label: 'Users',
        description: 'Accounts, roles, onboarding state, and per-user subscription overview.',
        href: ROUTES.adminUsers,
      },
      {
        id: 'plans' as const,
        label: 'Plan Management',
        description: 'Plan catalog with usage limits and certification enrollment caps.',
        href: ROUTES.adminPlans,
      },
      {
        id: 'content' as const,
        label: 'Content',
        description: 'Questions, topics, and editorial status for study content.',
        href: ROUTES.adminContent,
      },
      {
        id: 'coupons' as const,
        label: 'Coupons',
        description: 'Percentage-off discount coupons synced with Stripe for annual plans.',
        href: ROUTES.adminCoupons,
      },
    ],
    pages: {
      users: {
        eyebrow: 'User administration',
        title: 'Users',
        description:
          'List, filter, and update users with pagination, text search, and basic admin profile editing.',
      },
      plans: {
        eyebrow: 'Plan management',
        title: 'Plan Management',
        description:
          'Create, search, and maintain dynamic plans with pricing, usage limits, and certification caps.',
      },
      content: {
        eyebrow: 'Content administration',
        title: 'Certifications and content structure',
        description:
          'Manage certifications, the module hierarchy, and access the editorial question manager from the selected topic.',
      },      coupons: {
        eyebrow: 'Coupon management',
        title: 'Discount Coupons',
        description:
          'Create and manage percentage-off coupons synced with Stripe.',
      },    },
  };
}
