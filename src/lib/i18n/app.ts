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
    addCertification: string;
    menu: string;
    language: string;
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
    studyModesTitle: string;
    studyModesDescription: string;
    flashcardModeTitle: string;
    practiceModeTitle: string;
    testModeTitle: string;
    flashcardModeDescription: string;
    practiceModeDescription: string;
    testModeDescription: string;
    start: string;
    starting: string;
    limitReached: string;
    notIncludedInPlan: string;
    availableLabel: string;
    blockedLabel: string;
    sessionsToday: string;
    sessionsThisWeek: string;
    sessionsThisMonth: string;
    resetsIn: string;
    daySingular: string;
    dayPlural: string;
    unlimitedLabel: string;
    notAvailableLabel: string;
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
    enroll: string;
    unlimited: string;
    notAvailable: string;
    none: string;
    blocked: string;
    limited: string;
    day: string;
    days: string;
    week: string;
    weeks: string;
    month: string;
    months: string;
    planRequiredTitle: string;
    planRequiredBody: string;
    logbookPlanTitle: string;
    logbookPlanBody: string;
    currentPlanLabel: string;
    noPlanSelected: string;
    certificationsLabel: string;
    regsExclusionNote: string;
    logbookOnlySummary: string;
    enrollRegsHelper: string;
    enrollLogbookHelper: string;
    enrollDefaultHelper: string;
    planNeededForEnrollment: string;
    certificationLimitReached: string;
    failedToEnrollLicense: string;
  };
  account: {
    title: string;
    description: string;
    refresh: string;
    note: string;
    subscriptionLabel: string;
    currentPlan: string;
    manageBilling: string;
    viewPricing: string;
    upgradeNow: string;
    renewsOn: string;
    expiresOn: string;
    noSubscription: string;
    subscribeNow: string;
    statusActive: string;
    statusTrialing: string;
    statusCanceled: string;
    statusPastDue: string;
    enrolledLicenses: string;
    ofMax: string;
    billingPortalError: string;
    noBillingAccount: string;
    securityLabel: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    changePassword: string;
    passwordChanged: string;
    passwordMismatch: string;
    dangerZoneLabel: string;
    deleteAccount: string;
    deleteAccountWarning: string;
    deleteAccountConfirmPlaceholder: string;
    deleteAccountConfirmButton: string;
    deleteAccountError: string;
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
    addCertification: 'Add certification',
    menu: 'Menu',
    language: 'Language',
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
    studyModesTitle: 'Study modes',
    studyModesDescription: 'Choose how you want to study this deck.',
    flashcardModeTitle: 'Flashcard mode',
    practiceModeTitle: 'Practice mode',
    testModeTitle: 'Test mode',
    flashcardModeDescription: 'Self-paced review. Each start consumes one flashcard session from your plan.',
    practiceModeDescription: 'Multiple choice with instant feedback. Each start consumes one practice session from your plan.',
    testModeDescription: 'Timed exam. Each start consumes one test session from your plan.',
    start: 'Start',
    starting: 'Starting...',
    limitReached: 'Limit reached',
    notIncludedInPlan: 'This study mode is not included in your current plan.',
    availableLabel: 'Available',
    blockedLabel: 'Blocked',
    sessionsToday: 'sessions today',
    sessionsThisWeek: 'sessions this week',
    sessionsThisMonth: 'sessions this month',
    resetsIn: 'Resets in',
    daySingular: 'day',
    dayPlural: 'days',
    unlimitedLabel: 'Unlimited',
    notAvailableLabel: 'Not available',
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
    enroll: 'Add certification',
    unlimited: 'Unlimited',
    notAvailable: 'Not available',
    none: 'None',
    blocked: 'blocked',
    limited: 'limited',
    day: 'day',
    days: 'days',
    week: 'week',
    weeks: 'weeks',
    month: 'month',
    months: 'months',
    planRequiredTitle: 'Plan required before adding certifications',
    planRequiredBody:
      'Your preferences were saved, but this account still needs an active plan before you can add certifications here.',
    logbookPlanTitle: 'This plan is configured for logbook access',
    logbookPlanBody:
      'This is a 1-track logbook plan. Add one certification track to activate its logbook area, but flashcards, practice, and tests stay blocked until you move to a study plan.',
    currentPlanLabel: 'Current plan',
    noPlanSelected: 'No plan selected',
    certificationsLabel: 'Certifications',
    regsExclusionNote: 'REGS does not count toward the limit when enrolled.',
    logbookOnlySummary:
      'This plan enables logbook access for 1 certification track only and does not include study volume.',
    enrollRegsHelper: 'Add REGS to unlock CARs and Standards. It does not consume a certification slot.',
    enrollLogbookHelper:
      'Add this certification to activate its logbook area. Study modes remain blocked on your current plan.',
    enrollDefaultHelper: 'Add this certification track using your current plan.',
    planNeededForEnrollment: 'Your account still needs an active plan before you can add certifications.',
    certificationLimitReached: 'Your current plan already reached the certification limit.',
    failedToEnrollLicense: 'Failed to add certification',
  },
  account: {
    title: 'My Account',
    description: 'Manage your subscription, billing and enrolled licenses.',
    refresh: 'Refresh',
    note: 'Your subscription determines access to study modes and limits per license.',
    subscriptionLabel: 'Subscription',
    currentPlan: 'Current plan',
    manageBilling: 'Manage Billing',
    viewPricing: 'View Pricing',
    upgradeNow: 'Upgrade Now',
    renewsOn: 'Renews on',
    expiresOn: 'Expires on',
    noSubscription: 'No active subscription.',
    subscribeNow: 'Subscribe Now',
    statusActive: 'Active',
    statusTrialing: 'Trial',
    statusCanceled: 'Canceled',
    statusPastDue: 'Past Due',
    enrolledLicenses: 'Enrolled Licenses',
    ofMax: 'of',
    billingPortalError: 'Unable to open billing portal. Please try again.',
    noBillingAccount: 'No billing account linked yet. Complete a checkout to enable billing management.',
    securityLabel: 'Security',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    changePassword: 'Change Password',
    passwordChanged: 'Password changed successfully.',
    passwordMismatch: 'New passwords do not match.',
    dangerZoneLabel: 'Danger Zone',
    deleteAccount: 'Delete Account',
    deleteAccountWarning: 'This action is permanent and cannot be undone. Type DELETE to confirm.',
    deleteAccountConfirmPlaceholder: 'Type DELETE to confirm',
    deleteAccountConfirmButton: 'Permanently Delete Account',
    deleteAccountError: 'Failed to delete account. Please try again.',
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
    addCertification: 'Adicionar certificação',
    menu: 'Menu',
    language: 'Idioma',
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
    studyModesTitle: 'Modos de estudo',
    studyModesDescription: 'Escolha como você quer estudar este deck.',
    flashcardModeTitle: 'Modo flashcard',
    practiceModeTitle: 'Modo prática',
    testModeTitle: 'Modo teste',
    flashcardModeDescription: 'Revisão no seu ritmo. Cada início consome uma sessão de flashcard do seu plano.',
    practiceModeDescription: 'Múltipla escolha com feedback imediato. Cada início consome uma sessão de prática do seu plano.',
    testModeDescription: 'Simulado cronometrado. Cada início consome uma sessão de teste do seu plano.',
    start: 'Iniciar',
    starting: 'Iniciando...',
    limitReached: 'Limite atingido',
    notIncludedInPlan: 'Este modo de estudo não está incluído no seu plano atual.',
    availableLabel: 'Disponível',
    blockedLabel: 'Bloqueado',
    sessionsToday: 'sessões hoje',
    sessionsThisWeek: 'sessões nesta semana',
    sessionsThisMonth: 'sessões neste mês',
    resetsIn: 'Reinicia em',
    daySingular: 'dia',
    dayPlural: 'dias',
    unlimitedLabel: 'Ilimitado',
    notAvailableLabel: 'Indisponível',
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
    enroll: 'Adicionar certificação',
    unlimited: 'Ilimitado',
    notAvailable: 'Indisponível',
    none: 'Nenhuma',
    blocked: 'bloqueado',
    limited: 'limitado',
    day: 'dia',
    days: 'dias',
    week: 'semana',
    weeks: 'semanas',
    month: 'mês',
    months: 'meses',
    planRequiredTitle: 'É preciso ter um plano antes de adicionar certificações',
    planRequiredBody:
      'Suas preferências foram salvas, mas esta conta ainda precisa de um plano ativo antes que você possa adicionar certificações aqui.',
    logbookPlanTitle: 'Este plano está configurado para acesso ao logbook',
    logbookPlanBody:
      'Este é um plano de logbook para 1 trilha. Adicione uma certificação para ativar a área de logbook dela, mas flashcards, prática e testes continuam bloqueados até você migrar para um plano de estudo.',
    currentPlanLabel: 'Plano atual',
    noPlanSelected: 'Nenhum plano selecionado',
    certificationsLabel: 'Certificações',
    regsExclusionNote: 'REGS não conta no limite quando está matriculado.',
    logbookOnlySummary:
      'Este plano libera acesso ao logbook para apenas 1 trilha de certificação e não inclui volume de estudo.',
    enrollRegsHelper: 'Adicione REGS para liberar CARs e Standards. Ele não consome um slot de certificação.',
    enrollLogbookHelper:
      'Adicione esta certificação para ativar a área de logbook dela. Os modos de estudo continuam bloqueados no seu plano atual.',
    enrollDefaultHelper: 'Adicione esta trilha de certificação usando o seu plano atual.',
    planNeededForEnrollment: 'A sua conta ainda precisa de um plano ativo antes que você possa adicionar certificações.',
    certificationLimitReached: 'O seu plano atual já atingiu o limite de certificações.',
    failedToEnrollLicense: 'Falha ao adicionar a certificação',
  },
  account: {
    title: 'Minha conta',
    description: 'Gerencie sua assinatura, cobrança e licenças matriculadas.',
    refresh: 'Atualizar',
    note: 'Sua assinatura determina o acesso aos modos de estudo e limites por licença.',
    subscriptionLabel: 'Assinatura',
    currentPlan: 'Plano atual',
    manageBilling: 'Gerenciar cobrança',
    viewPricing: 'Ver planos',
    upgradeNow: 'Assinar agora',
    renewsOn: 'Renova em',
    expiresOn: 'Expira em',
    noSubscription: 'Nenhuma assinatura ativa.',
    subscribeNow: 'Assinar agora',
    statusActive: 'Ativo',
    statusTrialing: 'Trial',
    statusCanceled: 'Cancelado',
    statusPastDue: 'Pagamento pendente',
    enrolledLicenses: 'Licenças matriculadas',
    ofMax: 'de',
    billingPortalError: 'Não foi possível abrir o portal de cobrança. Tente novamente.',
    noBillingAccount: 'Nenhuma conta de cobrança vinculada. Finalize um checkout para habilitar o gerenciamento.',
    securityLabel: 'Segurança',
    currentPassword: 'Senha atual',
    newPassword: 'Nova senha',
    confirmPassword: 'Confirmar nova senha',
    changePassword: 'Alterar senha',
    passwordChanged: 'Senha alterada com sucesso.',
    passwordMismatch: 'As novas senhas não coincidem.',
    dangerZoneLabel: 'Zona de perigo',
    deleteAccount: 'Excluir conta',
    deleteAccountWarning: 'Esta ação é permanente e não pode ser desfeita. Digite DELETE para confirmar.',
    deleteAccountConfirmPlaceholder: 'Digite DELETE para confirmar',
    deleteAccountConfirmButton: 'Excluir conta permanentemente',
    deleteAccountError: 'Falha ao excluir a conta. Tente novamente.',
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