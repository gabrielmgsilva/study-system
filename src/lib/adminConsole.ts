import { ROUTES } from '@/lib/routes';
import type { LandingLocale } from '@/lib/i18n/landing';

export type AdminSectionId = 'users' | 'plans' | 'content';

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
          label: 'Planos',
          description: 'Catálogo de assinaturas, limites por licença e por módulo.',
          href: ROUTES.adminPlans,
        },
        {
          id: 'content' as const,
          label: 'Conteúdos',
          description: 'Questões, tópicos e status editorial do conteúdo exibido ao aluno.',
          href: ROUTES.adminContent,
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
          eyebrow: 'Administração de planos',
          title: 'Planos de assinatura',
          description:
            'Defina os planos disponíveis por licença e módulo, incluindo limites de uso e acesso ao logbook.',
        },
        content: {
          eyebrow: 'Administração de conteúdo',
          title: 'Conteúdo para flashcards e testes',
          description:
            'Gerencie questões normalizadas, filtros editoriais, status de publicação e a base usada pelos modos de estudo.',
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
        label: 'Plans',
        description: 'Subscription catalog, limits by license, and module-specific plan rules.',
        href: ROUTES.adminPlans,
      },
      {
        id: 'content' as const,
        label: 'Content',
        description: 'Questions, topics, and editorial status for study content.',
        href: ROUTES.adminContent,
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
        eyebrow: 'Plan administration',
        title: 'Subscription plans',
        description:
          'Define the available plans by license and module, including usage limits and logbook access.',
      },
      content: {
        eyebrow: 'Content administration',
        title: 'Flashcard and test content',
        description:
          'Manage normalized questions, editorial filters, publication status, and the study content base.',
      },
    },
  };
}
