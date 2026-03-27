import {
  landingLocales,
  normalizeLandingLocale,
  type LandingLocale,
} from '@/lib/i18n/landing';

export const appLocaleCookie = 'ameone_locale';

const localePattern = new RegExp(`^/(${landingLocales.join('|')})(?=/|$)`);

export function getAppLocaleFromPathname(pathname?: string | null): LandingLocale {
  const match = pathname?.match(localePattern);
  return normalizeLandingLocale(match?.[1]);
}

export function stripLocalePrefix(pathname: string): string {
  if (!pathname) return '/';
  const nextPath = pathname.replace(localePattern, '');
  return nextPath || '/';
}

export function localizeAppHref(href: string, locale: LandingLocale): string {
  if (!href.startsWith('/')) return href;
  if (localePattern.test(href)) return href;
  if (href === '/') return `/${locale}`;

  if (
    href.startsWith('/app') ||
    href.startsWith('/admin') ||
    href.startsWith('/auth')
  ) {
    return `/${locale}${href}`;
  }

  return href;
}

export function localizePathname(
  pathname: string,
  locale: LandingLocale,
  search?: string,
): string {
  const stripped = stripLocalePrefix(pathname || '/');
  const localized = stripped === '/' ? `/${locale}` : `/${locale}${stripped}`;
  return `${localized}${search || ''}`;
}

type AppDictionary = {
  shell: {
    brandSubtitle: string;
    dashboard: string;
    studyModule: string;
    profile: string;
    notifications: string;
    studentRole: string;
    logout: string;
    signingOut: string;
    certifications: string;
    loadingModules: string;
    noCertifications: string;
  };
  dashboard: {
    eyebrow: string;
    welcomeBack: string;
    description: string;
    studyTitle: string;
    studyDescription: string;
    studyCta: string;
    profileTitle: string;
    profileDescription: string;
    profileCta: string;
    defaultName: string;
  };
  study: {
    progress: string;
    difficulty: string;
    flashcards: string;
    practice: string;
    test: string;
    cardsMastered: string;
    spacedRepetition: string;
    interactiveQa: string;
    timedAssessment: string;
    continueStudying: string;
    startPractice: string;
    startTest: string;
    lastPracticeScore: string;
    questionsAnswered: string;
    avgAccuracy: string;
    streak: string;
    mockTestAverage: string;
    testsCompleted: string;
    bestScore: string;
    time: string;
    readiness: string;
    detailedTracking: string;
    flashcardMastery: string;
    practicePerformance: string;
    testReadiness: string;
    easy: string;
    medium: string;
    hard: string;
    correct: string;
    average: string;
    avgTime: string;
    studyRecommendations: string;
    recommendationsTuned: string;
    viewFullModule: string;
  };
  guards: {
    loading: string;
    underMaintenance: string;
    comingSoon: string;
    maintenanceBody: string;
    comingSoonBody: string;
    keysChecked: string;
    openStudentArea: string;
    back: string;
    lockedForPlan: string;
  };
  shortcut: {
    loading: string;
    open: string;
    comingSoon: string;
    manageAccess: string;
    requiresPremium: string;
    locked: string;
  };
  student: {
    area: string;
    title: string;
    description: string;
    refresh: string;
    refreshing: string;
    openHub: string;
    ownedLicenses: string;
    loading: string;
    notOwned: string;
    choosePlan: string;
    saving: string;
    confirm: string;
    refreshStatus: string;
    goToLicense: string;
    open: string;
    locked: string;
    credits: string;
    practice: string;
    test: string;
    logbook: string;
    yes: string;
    no: string;
    basic: string;
    standard: string;
    premium: string;
    exploreStart: string;
    seriousStudy: string;
    examCareer: string;
  };
  account: {
    title: string;
    description: string;
    refresh: string;
    creditsDev: string;
    entitlements: string;
    roadmap: string;
    note: string;
    basicTitle: string;
    standardTitle: string;
    premiumTitle: string;
    basicDesc: string;
    standardDesc: string;
    premiumDesc: string;
    basicCopy: string;
    basicHint: string;
    standardCopy: string;
    standardHint: string;
    premiumCopy: string;
    premiumHint: string;
    roadmapItems: string[];
  };
  admin: {
    navTitle: string;
    navDescription: string;
    modulesTab: string;
    plansTab: string;
    backToApp: string;
    switchLanguage: string;
    moduleControlTitle: string;
    moduleControlDescription: string;
    openPlanOverrides: string;
    plansTitle: string;
    plansDescription: string;
    openModuleControl: string;
    modulesManagerTitle: string;
    modulesManagerDescription: string;
    saveCopy: string;
    copied: string;
    licenseStatus: string;
    licenseMessage: string;
    licenseMessagePlaceholder: string;
    licenseLockedPrefix: string;
    licenseLockedSuffix: string;
    modules: string;
    noModulesConfigured: string;
    routeId: string;
    moduleStatus: string;
    messageOptional: string;
    moduleMessagePlaceholder: string;
    active: string;
    comingSoon: string;
    underMaintenance: string;
    findUser: string;
    findUserDescription: string;
    userEmail: string;
    load: string;
    loading: string;
    enterUserEmail: string;
    unableLoadUserEntitlements: string;
    user: string;
    noName: string;
    derivedAccess: string;
    flashcards: string;
    practice: string;
    test: string;
    logbook: string;
    yes: string;
    no: string;
    plan: string;
    flashcardsPerDayOverride: string;
    practicePerDayOverride: string;
    testsPerWeekOverride: string;
    defaultValue: string;
    saveLicense: string;
    savingLicense: string;
    unableSavePlanOverrides: string;
  };
};

const en: AppDictionary = {
  shell: {
    brandSubtitle: 'Comprehensive Learning Hub',
    dashboard: 'Dashboard',
    studyModule: 'Study Module',
    profile: 'Profile',
    notifications: 'Notifications',
    studentRole: 'Student',
    logout: 'Logout',
    signingOut: 'Signing out...',
    certifications: 'Certifications',
    loadingModules: 'Loading available modules...',
    noCertifications: 'No active certifications found for this account yet.',
  },
  dashboard: {
    eyebrow: 'Dashboard',
    welcomeBack: 'Welcome back,',
    description:
      'This dashboard is the entry point for the new logged-in experience. Use Study Module to continue through your available certifications, or open Profile to manage plans and entitlements.',
    studyTitle: 'Study Module',
    studyDescription:
      'Open the new study workspace with top navigation, certification sidebar and module overview.',
    studyCta: 'Open Study Module',
    profileTitle: 'Profile',
    profileDescription:
      'Review licences, plans, and the account configuration already linked to your user.',
    profileCta: 'Open Profile',
    defaultName: 'student',
  },
  study: {
    progress: 'Progress',
    difficulty: 'Difficulty',
    flashcards: 'Flashcards',
    practice: 'Practice',
    test: 'Test',
    cardsMastered: 'Cards Mastered',
    spacedRepetition: 'Spaced repetition learning with adaptive difficulty.',
    interactiveQa: 'Interactive Q&A with immediate feedback.',
    timedAssessment: 'Timed assessment simulation.',
    continueStudying: 'Continue Studying',
    startPractice: 'Start Practice',
    startTest: 'Start Test',
    lastPracticeScore: 'Last Practice Score',
    questionsAnswered: 'Questions Answered',
    avgAccuracy: 'Avg. Accuracy',
    streak: 'Streak',
    mockTestAverage: 'Mock Test Average',
    testsCompleted: 'Tests Completed',
    bestScore: 'Best Score',
    time: 'Time',
    readiness: 'Readiness',
    detailedTracking: 'Detailed Progress Tracking',
    flashcardMastery: 'Flashcard Mastery',
    practicePerformance: 'Practice Performance',
    testReadiness: 'Test Readiness',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    correct: 'Correct',
    average: 'Average',
    avgTime: 'Avg. Time',
    studyRecommendations: 'Study Recommendations',
    recommendationsTuned: 'Recommendations tuned for',
    viewFullModule: 'View Full Study Module',
  },
  guards: {
    loading: 'Loading...',
    underMaintenance: 'Under maintenance',
    comingSoon: 'Coming soon',
    maintenanceBody:
      'This module is temporarily under maintenance. Please try again later.',
    comingSoonBody:
      'This module is not available yet. It will be released soon.',
    keysChecked: 'Keys checked:',
    openStudentArea: 'Open Student Area',
    back: 'Back',
    lockedForPlan: 'This module is locked for your current plan.',
  },
  shortcut: {
    loading: 'Loading...',
    open: 'Open',
    comingSoon: 'Coming soon',
    manageAccess: 'Manage access',
    requiresPremium: 'Requires Premium',
    locked: 'Locked',
  },
  student: {
    area: 'Student Area',
    title: 'Your licences & plans',
    description:
      'AME ONE sells access per licence (Transport Canada mindset). Pick a plan per licence.',
    refresh: 'Refresh',
    refreshing: 'Refreshing...',
    openHub: 'Open Hub',
    ownedLicenses: 'Owned licences',
    loading: 'Loading...',
    notOwned: 'Not owned',
    choosePlan: 'Choose plan (dev / no billing yet)',
    saving: 'Saving...',
    confirm: 'Confirm',
    refreshStatus: 'Refresh status',
    goToLicense: 'Go to licence',
    open: 'Open',
    locked: 'Locked',
    credits: 'Credits',
    practice: 'Practice',
    test: 'Test',
    logbook: 'Logbook',
    yes: 'yes',
    no: 'no',
    basic: 'Explore & Start',
    standard: 'Serious Study',
    premium: 'Exam & Career',
    exploreStart: 'Explore & Start',
    seriousStudy: 'Serious Study',
    examCareer: 'Exam & Career',
  },
  account: {
    title: 'My Account',
    description: 'This page is the long-term home for billing, plans and usage limits.',
    refresh: 'Refresh',
    creditsDev: 'Credits (dev)',
    entitlements: 'Entitlements',
    roadmap: 'Roadmap (no migration later)',
    note:
      'For now, module unlock still uses credits while the subscription model is being finalized.',
    basicTitle: 'BASIC',
    standardTitle: 'STANDARD',
    premiumTitle: 'PREMIUM',
    basicDesc: 'Explore & Start',
    standardDesc: 'Serious Study',
    premiumDesc: 'Exam & Career',
    basicCopy: 'Daily limits (Flashcards / Practice cooldown / Tests weekly).',
    basicHint: 'Coming soon: plan enforcement.',
    standardCopy: 'Practice unlimited, higher flashcard limit, tests 2–3/week.',
    standardHint: 'Coming soon: checkout + license selection.',
    premiumCopy: 'Unlimited tests + Logbook included.',
    premiumHint: 'Coming soon: Logbook add-on & priority modules.',
    roadmapItems: [
      'Billing + plans per licence (M / E / S / Balloons) + REGS as global.',
      'Usage limits: daily flashcards, practice cooldown, tests per week.',
      'Logbook as add-on OR included in PREMIUM.',
      'Admin tools to grant entitlements for testing.',
    ],
  },
  admin: {
    navTitle: 'Admin Console',
    navDescription: 'Internal tools for module availability and per-user plan overrides.',
    modulesTab: 'Module Control',
    plansTab: 'Plan Overrides',
    backToApp: 'Back to app',
    switchLanguage: 'Switch language',
    moduleControlTitle: 'Admin — Module Control',
    moduleControlDescription:
      'Two-layer gate: License → Modules. This screen manages the current release state for each area.',
    openPlanOverrides: 'Open Plan Overrides',
    plansTitle: 'Admin — License Plans & Overrides',
    plansDescription:
      'Find a user by email, then update the plan tier and optional daily or weekly caps for each license.',
    openModuleControl: 'Open Module Control',
    modulesManagerTitle: 'Admin v1 — Licenses & Modules',
    modulesManagerDescription:
      'Manage availability with a two-layer gate: License → Modules. Saving copies an updated moduleFlags.ts.',
    saveCopy: 'Save (copy moduleFlags.ts)',
    copied: 'Copied. Paste into src/lib/moduleFlags.ts and redeploy.',
    licenseStatus: 'License status',
    licenseMessage: 'License message (optional)',
    licenseMessagePlaceholder: 'Short message shown when license is locked...',
    licenseLockedPrefix: 'License is',
    licenseLockedSuffix: 'Modules below will be blocked even if they are set to Active.',
    modules: 'Modules',
    noModulesConfigured: 'No modules configured.',
    routeId: 'Route id',
    moduleStatus: 'Module status',
    messageOptional: 'Message (optional)',
    moduleMessagePlaceholder: 'Short, ESL-friendly message...',
    active: 'Active',
    comingSoon: 'Coming soon',
    underMaintenance: 'Under maintenance',
    findUser: 'Find User',
    findUserDescription:
      'Search by account email. This screen is meant for support or manual plan tuning.',
    userEmail: 'User email',
    load: 'Load',
    loading: 'Loading...',
    enterUserEmail: 'Enter a user email.',
    unableLoadUserEntitlements: 'Unable to load user entitlements.',
    user: 'User',
    noName: 'No name',
    derivedAccess: 'Derived access',
    flashcards: 'flashcards',
    practice: 'practice',
    test: 'test',
    logbook: 'logbook',
    yes: 'yes',
    no: 'no',
    plan: 'Plan',
    flashcardsPerDayOverride: 'Flashcards/day override',
    practicePerDayOverride: 'Practice/day override',
    testsPerWeekOverride: 'Tests/week override',
    defaultValue: 'Default',
    saveLicense: 'Save license',
    savingLicense: 'Saving...',
    unableSavePlanOverrides: 'Unable to save plan overrides.',
  },
};

const pt: AppDictionary = {
  shell: {
    brandSubtitle: 'Hub de Aprendizado Completo',
    dashboard: 'Painel',
    studyModule: 'Módulo de Estudo',
    profile: 'Perfil',
    notifications: 'Notificações',
    studentRole: 'Aluno',
    logout: 'Sair',
    signingOut: 'Saindo...',
    certifications: 'Certificações',
    loadingModules: 'Carregando módulos disponíveis...',
    noCertifications: 'Nenhuma certificação ativa foi encontrada para esta conta.',
  },
  dashboard: {
    eyebrow: 'Painel',
    welcomeBack: 'Bem-vindo de volta,',
    description:
      'Este painel é o ponto de entrada da nova experiência da área logada. Use o Módulo de Estudo para continuar pelas suas certificações disponíveis ou abra o Perfil para gerenciar planos e liberações.',
    studyTitle: 'Módulo de Estudo',
    studyDescription:
      'Abra o novo espaço de estudo com navegação superior, barra lateral de certificações e visão geral do módulo.',
    studyCta: 'Abrir Módulo de Estudo',
    profileTitle: 'Perfil',
    profileDescription:
      'Revise licenças, planos e a configuração de conta já vinculada ao seu usuário.',
    profileCta: 'Abrir Perfil',
    defaultName: 'aluno',
  },
  study: {
    progress: 'Progresso',
    difficulty: 'Dificuldade',
    flashcards: 'Flashcards',
    practice: 'Prática',
    test: 'Teste',
    cardsMastered: 'Cards dominados',
    spacedRepetition: 'Aprendizado por repetição espaçada com dificuldade adaptativa.',
    interactiveQa: 'Perguntas e respostas interativas com feedback imediato.',
    timedAssessment: 'Simulação de avaliação cronometrada.',
    continueStudying: 'Continuar estudando',
    startPractice: 'Iniciar prática',
    startTest: 'Iniciar teste',
    lastPracticeScore: 'Última pontuação da prática',
    questionsAnswered: 'Questões respondidas',
    avgAccuracy: 'Precisão média',
    streak: 'Sequência',
    mockTestAverage: 'Média dos simulados',
    testsCompleted: 'Testes concluídos',
    bestScore: 'Melhor nota',
    time: 'Tempo',
    readiness: 'Prontidão',
    detailedTracking: 'Acompanhamento detalhado do progresso',
    flashcardMastery: 'Domínio dos flashcards',
    practicePerformance: 'Desempenho na prática',
    testReadiness: 'Prontidão para teste',
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
    correct: 'Corretas',
    average: 'Média',
    avgTime: 'Tempo médio',
    studyRecommendations: 'Recomendações de estudo',
    recommendationsTuned: 'Recomendações ajustadas para',
    viewFullModule: 'Ver módulo de estudo completo',
  },
  guards: {
    loading: 'Carregando...',
    underMaintenance: 'Em manutenção',
    comingSoon: 'Em breve',
    maintenanceBody:
      'Este módulo está temporariamente em manutenção. Tente novamente mais tarde.',
    comingSoonBody:
      'Este módulo ainda não está disponível. Ele será liberado em breve.',
    keysChecked: 'Chaves verificadas:',
    openStudentArea: 'Abrir Área do Aluno',
    back: 'Voltar',
    lockedForPlan: 'Este módulo está bloqueado para o seu plano atual.',
  },
  shortcut: {
    loading: 'Carregando...',
    open: 'Abrir',
    comingSoon: 'Em breve',
    manageAccess: 'Gerenciar acesso',
    requiresPremium: 'Requer Premium',
    locked: 'Bloqueado',
  },
  student: {
    area: 'Área do Aluno',
    title: 'Suas licenças e planos',
    description:
      'A AME ONE vende acesso por licença. Escolha um plano para cada licença.',
    refresh: 'Atualizar',
    refreshing: 'Atualizando...',
    openHub: 'Abrir hub',
    ownedLicenses: 'Licenças adquiridas',
    loading: 'Carregando...',
    notOwned: 'Não adquirida',
    choosePlan: 'Escolha o plano (dev / sem cobrança ainda)',
    saving: 'Salvando...',
    confirm: 'Confirmar',
    refreshStatus: 'Atualizar status',
    goToLicense: 'Ir para a licença',
    open: 'Abrir',
    locked: 'Bloqueado',
    credits: 'Créditos',
    practice: 'Prática',
    test: 'Teste',
    logbook: 'Logbook',
    yes: 'sim',
    no: 'não',
    basic: 'Explorar e começar',
    standard: 'Estudo sério',
    premium: 'Prova e carreira',
    exploreStart: 'Explorar e começar',
    seriousStudy: 'Estudo sério',
    examCareer: 'Prova e carreira',
  },
  account: {
    title: 'Minha conta',
    description: 'Esta página é a base de longo prazo para cobrança, planos e limites de uso.',
    refresh: 'Atualizar',
    creditsDev: 'Créditos (dev)',
    entitlements: 'Permissões',
    roadmap: 'Roadmap (sem migração depois)',
    note:
      'Por enquanto, o desbloqueio de módulos ainda usa créditos enquanto o modelo de assinatura está sendo finalizado.',
    basicTitle: 'BASIC',
    standardTitle: 'STANDARD',
    premiumTitle: 'PREMIUM',
    basicDesc: 'Explorar e começar',
    standardDesc: 'Estudo sério',
    premiumDesc: 'Prova e carreira',
    basicCopy: 'Limites diários (flashcards / intervalo da prática / testes semanais).',
    basicHint: 'Em breve: regras de plano em produção.',
    standardCopy: 'Prática ilimitada, limite maior de flashcards e testes 2 a 3 vezes por semana.',
    standardHint: 'Em breve: checkout e seleção de licença.',
    premiumCopy: 'Testes ilimitados + logbook incluído.',
    premiumHint: 'Em breve: add-on de logbook e módulos prioritários.',
    roadmapItems: [
      'Cobrança + planos por licença (M / E / S / Balloons) + REGS como global.',
      'Limites de uso: flashcards diários, intervalo da prática e testes por semana.',
      'Logbook como add-on OU incluído no PREMIUM.',
      'Ferramentas de admin para conceder permissões em testes.',
    ],
  },
  admin: {
    navTitle: 'Console Administrativo',
    navDescription: 'Ferramentas internas para disponibilidade de módulos e overrides de plano por usuário.',
    modulesTab: 'Controle de módulos',
    plansTab: 'Overrides de plano',
    backToApp: 'Voltar ao app',
    switchLanguage: 'Trocar idioma',
    moduleControlTitle: 'Admin — Controle de módulos',
    moduleControlDescription:
      'Porta em duas camadas: Licença → Módulos. Esta tela controla o estado atual de liberação de cada área.',
    openPlanOverrides: 'Abrir overrides de plano',
    plansTitle: 'Admin — Planos e overrides por licença',
    plansDescription:
      'Encontre um usuário por email e ajuste o plano e os limites opcionais diários ou semanais de cada licença.',
    openModuleControl: 'Abrir controle de módulos',
    modulesManagerTitle: 'Admin v1 — Licenças e módulos',
    modulesManagerDescription:
      'Gerencie disponibilidade com uma porta em duas camadas: Licença → Módulos. Salvar copia um moduleFlags.ts atualizado.',
    saveCopy: 'Salvar (copiar moduleFlags.ts)',
    copied: 'Copiado. Cole em src/lib/moduleFlags.ts e faça o redeploy.',
    licenseStatus: 'Status da licença',
    licenseMessage: 'Mensagem da licença (opcional)',
    licenseMessagePlaceholder: 'Mensagem curta exibida quando a licença estiver bloqueada...',
    licenseLockedPrefix: 'A licença está',
    licenseLockedSuffix: 'Os módulos abaixo ficarão bloqueados mesmo se estiverem como Ativo.',
    modules: 'Módulos',
    noModulesConfigured: 'Nenhum módulo configurado.',
    routeId: 'ID da rota',
    moduleStatus: 'Status do módulo',
    messageOptional: 'Mensagem (opcional)',
    moduleMessagePlaceholder: 'Mensagem curta e simples para o usuário...',
    active: 'Ativo',
    comingSoon: 'Em breve',
    underMaintenance: 'Em manutenção',
    findUser: 'Encontrar usuário',
    findUserDescription:
      'Pesquise pelo email da conta. Esta tela é voltada para suporte ou ajustes manuais de plano.',
    userEmail: 'Email do usuário',
    load: 'Carregar',
    loading: 'Carregando...',
    enterUserEmail: 'Informe o email do usuário.',
    unableLoadUserEntitlements: 'Não foi possível carregar as permissões do usuário.',
    user: 'Usuário',
    noName: 'Sem nome',
    derivedAccess: 'Acesso derivado',
    flashcards: 'flashcards',
    practice: 'prática',
    test: 'teste',
    logbook: 'logbook',
    yes: 'sim',
    no: 'não',
    plan: 'Plano',
    flashcardsPerDayOverride: 'Override de flashcards/dia',
    practicePerDayOverride: 'Override de prática/dia',
    testsPerWeekOverride: 'Override de testes/semana',
    defaultValue: 'Padrão',
    saveLicense: 'Salvar licença',
    savingLicense: 'Salvando...',
    unableSavePlanOverrides: 'Não foi possível salvar os overrides do plano.',
  },
};

const appDictionaries: Record<LandingLocale, AppDictionary> = { en, pt };

export function getAppDictionary(locale: LandingLocale = 'en') {
  return appDictionaries[locale] ?? appDictionaries.en;
}