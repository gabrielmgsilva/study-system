import { ROUTES, type LicenseId } from '@/lib/routes';
import type { LandingLocale } from '@/lib/i18n/landing';

export type StudyNavLicenseId = Exclude<LicenseId, 'regs'> | 'regs';

export type StudyNavModule = {
  id: string;
  label: string;
  shortLabel: string;
  sidebarHref: string;
  studyHref: string;
  title: string;
  description: string;
  breadcrumb: string;
  progressPercent: number;
  difficulty: string;
  flashcards: {
    status: string;
    mastered: string;
    total: string;
    lastSession: string;
    completion: string;
  };
  practice: {
    status: string;
    lastScore: string;
    questionsAnswered: string;
    accuracy: string;
    streak: string;
  };
  test: {
    status: string;
    averageScore: string;
    testsCompleted: string;
    bestScore: string;
    time: string;
    readiness: string;
  };
  recommendations: string[];
};

export type StudyNavLicense = {
  licenseId: StudyNavLicenseId;
  label: string;
  modules: StudyNavModule[];
};

function buildHubHref(licenseId: StudyNavLicenseId, moduleId: string) {
  return `${ROUTES.appHub}?license=${licenseId}&module=${moduleId}`;
}

const baseStudyNavigation: StudyNavLicense[] = [
  {
    licenseId: 'm',
    label: 'Mechanical',
    modules: [
      {
        id: 'airframe',
        label: 'Airframe',
        shortLabel: 'Airframe',
        sidebarHref: buildHubHref('m', 'airframe'),
        studyHref: ROUTES.mAirframe,
        title: 'Airframe',
        description:
          'Master Transport Canada style questions on structures, systems and mechanical servicing procedures.',
        breadcrumb: 'Mechanical / Airframe',
        progressPercent: 68,
        difficulty: 'Intermediate',
        flashcards: {
          status: 'Active',
          mastered: '24',
          total: '50',
          lastSession: 'Last session: 2 hours ago',
          completion: '48% complete',
        },
        practice: {
          status: 'Ready',
          lastScore: '85%',
          questionsAnswered: '127',
          accuracy: '82%',
          streak: '6 correct',
        },
        test: {
          status: 'Available',
          averageScore: '78%',
          testsCompleted: '3',
          bestScore: '92%',
          time: '45 min',
          readiness: '92%',
        },
        recommendations: [
          'Focus on ATA 27 and ATA 57 weak flashcards still pending.',
          'Practice more troubleshooting sets before the next mock test.',
          'Take a test once your flashcard mastery passes 75%.',
        ],
      },
      {
        id: 'powerplant',
        label: 'Power Plant',
        shortLabel: 'Power Plant',
        sidebarHref: buildHubHref('m', 'powerplant'),
        studyHref: ROUTES.mPowerplant,
        title: 'Power Plant',
        description:
          'Build confidence with engine systems, fuel metering, ignition and propeller-related study blocks.',
        breadcrumb: 'Mechanical / Power Plant',
        progressPercent: 61,
        difficulty: 'Intermediate',
        flashcards: {
          status: 'Active',
          mastered: '19',
          total: '44',
          lastSession: 'Last session: Yesterday',
          completion: '43% complete',
        },
        practice: {
          status: 'Ready',
          lastScore: '79%',
          questionsAnswered: '94',
          accuracy: '77%',
          streak: '4 correct',
        },
        test: {
          status: 'Available',
          averageScore: '72%',
          testsCompleted: '2',
          bestScore: '84%',
          time: '50 min',
          readiness: '81%',
        },
        recommendations: [
          'Revisit combustion, lubrication and induction flashcards.',
          'Run another practice session focused on engine indications.',
          'Delay the next test until average practice accuracy crosses 80%.',
        ],
      },
      {
        id: 'standard-practices',
        label: 'Standard Practices',
        shortLabel: 'Standard Practices',
        sidebarHref: buildHubHref('m', 'standard-practices'),
        studyHref: ROUTES.mStandardPractices,
        title: 'Standard Practices',
        description:
          'Study hardware, fasteners, materials, maintenance records and general shop procedures for M.',
        breadcrumb: 'Mechanical / Standard Practices',
        progressPercent: 74,
        difficulty: 'Foundational',
        flashcards: {
          status: 'Active',
          mastered: '31',
          total: '42',
          lastSession: 'Last session: 5 hours ago',
          completion: '74% complete',
        },
        practice: {
          status: 'Ready',
          lastScore: '88%',
          questionsAnswered: '151',
          accuracy: '84%',
          streak: '8 correct',
        },
        test: {
          status: 'Available',
          averageScore: '83%',
          testsCompleted: '4',
          bestScore: '94%',
          time: '38 min',
          readiness: '95%',
        },
        recommendations: [
          'Keep reviewing hardware identification hard cards.',
          'Use practice mode for maintenance release wording and documentation.',
          'You are ready for another timed test in this module.',
        ],
      },
    ],
  },
  {
    licenseId: 'e',
    label: 'Avionics',
    modules: [
      {
        id: 'rating-avionics',
        label: 'Rating Avionics',
        shortLabel: 'Rating Avionics',
        sidebarHref: buildHubHref('e', 'rating-avionics'),
        studyHref: ROUTES.eRatingAvionics,
        title: 'Rating Avionics',
        description:
          'Train on electrical theory, avionics interfaces, instruments and navigation systems for the E rating.',
        breadcrumb: 'Avionics / Rating Avionics',
        progressPercent: 64,
        difficulty: 'Intermediate',
        flashcards: {
          status: 'Active',
          mastered: '22',
          total: '48',
          lastSession: 'Last session: 3 hours ago',
          completion: '46% complete',
        },
        practice: {
          status: 'Ready',
          lastScore: '81%',
          questionsAnswered: '118',
          accuracy: '79%',
          streak: '5 correct',
        },
        test: {
          status: 'Available',
          averageScore: '76%',
          testsCompleted: '3',
          bestScore: '89%',
          time: '47 min',
          readiness: '88%',
        },
        recommendations: [
          'Focus on power distribution and instrument indication weak topics.',
          'Practice troubleshooting sets that mix navigation and communications.',
          'Take a mock test after one more focused practice run.',
        ],
      },
      {
        id: 'standard-practices',
        label: 'Standard Practices',
        shortLabel: 'Standard Practices',
        sidebarHref: buildHubHref('e', 'standard-practices'),
        studyHref: ROUTES.eStandardPractices,
        title: 'Standard Practices',
        description:
          'Review common electrical practices, wiring, bonding, tooling and documentation standards for E.',
        breadcrumb: 'Avionics / Standard Practices',
        progressPercent: 70,
        difficulty: 'Foundational',
        flashcards: {
          status: 'Active',
          mastered: '28',
          total: '41',
          lastSession: 'Last session: Today',
          completion: '68% complete',
        },
        practice: {
          status: 'Ready',
          lastScore: '86%',
          questionsAnswered: '139',
          accuracy: '83%',
          streak: '7 correct',
        },
        test: {
          status: 'Available',
          averageScore: '80%',
          testsCompleted: '3',
          bestScore: '91%',
          time: '36 min',
          readiness: '91%',
        },
        recommendations: [
          'Review bonding, wiring identification and tooling terminology.',
          'Maintain daily flashcard reviews to consolidate memory-heavy items.',
          'You are close to test-ready; add one timed practice block.',
        ],
      },
    ],
  },
  {
    licenseId: 's',
    label: 'Structures',
    modules: [
      {
        id: 'rating-structures',
        label: 'Rating Structures',
        shortLabel: 'Rating Structures',
        sidebarHref: buildHubHref('s', 'rating-structures'),
        studyHref: ROUTES.sRatingStructures,
        title: 'Rating Structures',
        description:
          'Strengthen your knowledge of sheet metal repairs, composites, corrosion and damage assessment.',
        breadcrumb: 'Structures / Rating Structures',
        progressPercent: 59,
        difficulty: 'Intermediate',
        flashcards: {
          status: 'Active',
          mastered: '17',
          total: '39',
          lastSession: 'Last session: Yesterday',
          completion: '44% complete',
        },
        practice: {
          status: 'Ready',
          lastScore: '76%',
          questionsAnswered: '82',
          accuracy: '74%',
          streak: '3 correct',
        },
        test: {
          status: 'Available',
          averageScore: '71%',
          testsCompleted: '2',
          bestScore: '80%',
          time: '49 min',
          readiness: '79%',
        },
        recommendations: [
          'Reinforce material identification and repair limit concepts.',
          'Practice more damage classification and repair selection questions.',
          'Wait for a stronger readiness score before another mock test.',
        ],
      },
      {
        id: 'standard-practices',
        label: 'Standard Practices',
        shortLabel: 'Standard Practices',
        sidebarHref: buildHubHref('s', 'standard-practices'),
        studyHref: ROUTES.sStandardPractices,
        title: 'Standard Practices',
        description:
          'Review fasteners, tools, structural materials and maintenance records used across the S pathway.',
        breadcrumb: 'Structures / Standard Practices',
        progressPercent: 72,
        difficulty: 'Foundational',
        flashcards: {
          status: 'Active',
          mastered: '29',
          total: '40',
          lastSession: 'Last session: 4 hours ago',
          completion: '72% complete',
        },
        practice: {
          status: 'Ready',
          lastScore: '84%',
          questionsAnswered: '121',
          accuracy: '81%',
          streak: '6 correct',
        },
        test: {
          status: 'Available',
          averageScore: '79%',
          testsCompleted: '3',
          bestScore: '90%',
          time: '37 min',
          readiness: '90%',
        },
        recommendations: [
          'Keep polishing rivet, material and tooling recall.',
          'Use practice mode to lock in maintenance standards vocabulary.',
          'You are nearly test-ready in this module.',
        ],
      },
    ],
  },
  {
    licenseId: 'balloons',
    label: 'Balloons',
    modules: [
      {
        id: 'bregs',
        label: 'BREGS',
        shortLabel: 'BREGS',
        sidebarHref: buildHubHref('balloons', 'bregs'),
        studyHref: ROUTES.balloonsBregs,
        title: 'BREGS',
        description:
          'Study balloon regulations, systems, burner and envelope maintenance subjects with TC-style pacing.',
        breadcrumb: 'Balloons / BREGS',
        progressPercent: 55,
        difficulty: 'Intermediate',
        flashcards: {
          status: 'Active',
          mastered: '15',
          total: '34',
          lastSession: 'Last session: 1 day ago',
          completion: '44% complete',
        },
        practice: {
          status: 'Ready',
          lastScore: '74%',
          questionsAnswered: '61',
          accuracy: '72%',
          streak: '2 correct',
        },
        test: {
          status: 'Available',
          averageScore: '69%',
          testsCompleted: '2',
          bestScore: '78%',
          time: '42 min',
          readiness: '76%',
        },
        recommendations: [
          'Focus on burner, fuel cylinder and envelope inspection weak points.',
          'Do one more practice block on operational limitations.',
          'Save the next test until practice accuracy improves.',
        ],
      },
    ],
  },
  {
    licenseId: 'regs',
    label: 'REGS',
    modules: [
      {
        id: 'cars',
        label: 'CARs',
        shortLabel: 'CARs',
        sidebarHref: buildHubHref('regs', 'cars'),
        studyHref: ROUTES.regsCars,
        title: 'CARs',
        description:
          'Build speed and confidence with the Canadian Aviation Regulations question bank and references.',
        breadcrumb: 'REGS / CARs',
        progressPercent: 66,
        difficulty: 'Advanced',
        flashcards: {
          status: 'Active',
          mastered: '27',
          total: '52',
          lastSession: 'Last session: 2 hours ago',
          completion: '52% complete',
        },
        practice: {
          status: 'Ready',
          lastScore: '82%',
          questionsAnswered: '143',
          accuracy: '80%',
          streak: '5 correct',
        },
        test: {
          status: 'Available',
          averageScore: '77%',
          testsCompleted: '4',
          bestScore: '88%',
          time: '44 min',
          readiness: '87%',
        },
        recommendations: [
          'Keep reviewing difficult regulatory references and applicability rules.',
          'Practice mixed regulation interpretation questions.',
          'Schedule another timed test once flashcard completion hits 60%.',
        ],
      },
      {
        id: 'standards',
        label: 'Standards',
        shortLabel: 'Standards',
        sidebarHref: buildHubHref('regs', 'standards'),
        studyHref: ROUTES.regsStandards,
        title: 'Standards',
        description:
          'Review standards references, chapter guidance and compliance interpretation used across AME study.',
        breadcrumb: 'REGS / Standards',
        progressPercent: 63,
        difficulty: 'Advanced',
        flashcards: {
          status: 'Active',
          mastered: '21',
          total: '46',
          lastSession: 'Last session: 6 hours ago',
          completion: '45% complete',
        },
        practice: {
          status: 'Ready',
          lastScore: '80%',
          questionsAnswered: '109',
          accuracy: '78%',
          streak: '4 correct',
        },
        test: {
          status: 'Available',
          averageScore: '75%',
          testsCompleted: '3',
          bestScore: '86%',
          time: '46 min',
          readiness: '84%',
        },
        recommendations: [
          'Spend more time on standards chapters that support your primary licence.',
          'Practice interpretation questions with reference lookups disabled.',
          'Use one short mock test after another round of flashcards.',
        ],
      },
    ],
  },
];

type StudyModuleOverride = Partial<
  Omit<StudyNavModule, 'id' | 'sidebarHref' | 'studyHref' | 'progressPercent'>
> & {
  flashcards?: Partial<StudyNavModule['flashcards']>;
  practice?: Partial<StudyNavModule['practice']>;
  test?: Partial<StudyNavModule['test']>;
};

const ptLicenseLabels: Record<StudyNavLicenseId, string> = {
  m: 'Mecânica',
  e: 'Aviónica',
  s: 'Estruturas',
  balloons: 'Balões',
  regs: 'REGS',
};

const ptModuleOverrides: Record<string, StudyModuleOverride> = {
  'm.airframe': {
    label: 'Célula',
    shortLabel: 'Célula',
    title: 'Célula',
    description:
      'Domine questões no estilo Transport Canada sobre estruturas, sistemas e procedimentos mecânicos de manutenção.',
    breadcrumb: 'Mecânica / Célula',
    difficulty: 'Intermediário',
    flashcards: {
      status: 'Ativo',
      lastSession: 'Última sessão: há 2 horas',
      completion: '48% concluído',
    },
    practice: {
      status: 'Pronto',
      streak: '6 corretas',
    },
    test: {
      status: 'Disponível',
      readiness: '92%',
    },
    recommendations: [
      'Concentre-se nos flashcards pendentes das fraquezas em ATA 27 e ATA 57.',
      'Pratique mais blocos de troubleshooting antes do próximo simulado.',
      'Faça um teste quando o domínio dos flashcards passar de 75%.',
    ],
  },
  'm.powerplant': {
    label: 'Grupo Motopropulsor',
    shortLabel: 'Grupo Motopropulsor',
    title: 'Grupo Motopropulsor',
    description:
      'Ganhe confiança com sistemas de motor, dosagem de combustível, ignição e blocos de estudo ligados a hélices.',
    breadcrumb: 'Mecânica / Grupo Motopropulsor',
    difficulty: 'Intermediário',
    flashcards: {
      status: 'Ativo',
      lastSession: 'Última sessão: ontem',
      completion: '43% concluído',
    },
    practice: {
      status: 'Pronto',
      streak: '4 corretas',
    },
    test: {
      status: 'Disponível',
      readiness: '81%',
    },
    recommendations: [
      'Revise flashcards de combustão, lubrificação e admissão.',
      'Faça outra prática focada em indicações de motor.',
      'Adie o próximo teste até a precisão média da prática passar de 80%.',
    ],
  },
  'm.standard-practices': {
    label: 'Práticas Padrão',
    shortLabel: 'Práticas Padrão',
    title: 'Práticas Padrão',
    description:
      'Estude ferragens, fixadores, materiais, registros de manutenção e procedimentos gerais de oficina para M.',
    breadcrumb: 'Mecânica / Práticas Padrão',
    difficulty: 'Fundamental',
    flashcards: {
      status: 'Ativo',
      lastSession: 'Última sessão: há 5 horas',
      completion: '74% concluído',
    },
    practice: {
      status: 'Pronto',
      streak: '8 corretas',
    },
    test: {
      status: 'Disponível',
      readiness: '95%',
    },
    recommendations: [
      'Continue revisando os cards difíceis de identificação de hardware.',
      'Use a prática para terminologia de documentação e maintenance release.',
      'Você está pronto para outro teste cronometrado neste módulo.',
    ],
  },
  'e.rating-avionics': {
    label: 'Rating Aviónica',
    shortLabel: 'Rating Aviónica',
    title: 'Rating Aviónica',
    description:
      'Treine teoria elétrica, interfaces aviônicas, instrumentos e sistemas de navegação para o rating E.',
    breadcrumb: 'Aviónica / Rating Aviónica',
    difficulty: 'Intermediário',
    flashcards: {
      status: 'Ativo',
      lastSession: 'Última sessão: há 3 horas',
      completion: '46% concluído',
    },
    practice: {
      status: 'Pronto',
      streak: '5 corretas',
    },
    test: {
      status: 'Disponível',
      readiness: '88%',
    },
    recommendations: [
      'Foque nos tópicos mais fracos de distribuição de potência e indicação de instrumentos.',
      'Pratique blocos de troubleshooting misturando navegação e comunicações.',
      'Faça um simulado após mais uma rodada de prática focada.',
    ],
  },
  'e.standard-practices': {
    label: 'Práticas Padrão',
    shortLabel: 'Práticas Padrão',
    title: 'Práticas Padrão',
    description:
      'Revise práticas elétricas comuns, chicotes, bonding, ferramentas e padrões de documentação para E.',
    breadcrumb: 'Aviónica / Práticas Padrão',
    difficulty: 'Fundamental',
    flashcards: {
      status: 'Ativo',
      lastSession: 'Última sessão: hoje',
      completion: '68% concluído',
    },
    practice: {
      status: 'Pronto',
      streak: '7 corretas',
    },
    test: {
      status: 'Disponível',
      readiness: '91%',
    },
    recommendations: [
      'Revise bonding, identificação de fiação e terminologia de ferramentas.',
      'Mantenha revisões diárias de flashcards para consolidar itens de memorização intensa.',
      'Você está perto de ficar pronto para teste; adicione um bloco cronometrado de prática.',
    ],
  },
  's.rating-structures': {
    label: 'Rating Estruturas',
    shortLabel: 'Rating Estruturas',
    title: 'Rating Estruturas',
    description:
      'Fortaleça seu conhecimento em reparos de chapa, compósitos, corrosão e avaliação de danos.',
    breadcrumb: 'Estruturas / Rating Estruturas',
    difficulty: 'Intermediário',
    flashcards: {
      status: 'Ativo',
      lastSession: 'Última sessão: ontem',
      completion: '44% concluído',
    },
    practice: {
      status: 'Pronto',
      streak: '3 corretas',
    },
    test: {
      status: 'Disponível',
      readiness: '79%',
    },
    recommendations: [
      'Reforce conceitos de identificação de materiais e limites de reparo.',
      'Pratique mais questões de classificação de danos e seleção de reparo.',
      'Espere um índice de prontidão mais forte antes de outro simulado.',
    ],
  },
  's.standard-practices': {
    label: 'Práticas Padrão',
    shortLabel: 'Práticas Padrão',
    title: 'Práticas Padrão',
    description:
      'Revise fixadores, ferramentas, materiais estruturais e registros de manutenção usados ao longo da trilha S.',
    breadcrumb: 'Estruturas / Práticas Padrão',
    difficulty: 'Fundamental',
    flashcards: {
      status: 'Ativo',
      lastSession: 'Última sessão: há 4 horas',
      completion: '72% concluído',
    },
    practice: {
      status: 'Pronto',
      streak: '6 corretas',
    },
    test: {
      status: 'Disponível',
      readiness: '90%',
    },
    recommendations: [
      'Continue refinando a memorização de rebites, materiais e ferramentas.',
      'Use o modo prática para fixar vocabulário de padrões de manutenção.',
      'Você está quase pronto para teste neste módulo.',
    ],
  },
  'balloons.bregs': {
    label: 'BREGS',
    shortLabel: 'BREGS',
    title: 'BREGS',
    description:
      'Estude regulamentos de balões, sistemas, queimador e manutenção de envelope com cadência estilo TC.',
    breadcrumb: 'Balões / BREGS',
    difficulty: 'Intermediário',
    flashcards: {
      status: 'Ativo',
      lastSession: 'Última sessão: há 1 dia',
      completion: '44% concluído',
    },
    practice: {
      status: 'Pronto',
      streak: '2 corretas',
    },
    test: {
      status: 'Disponível',
      readiness: '76%',
    },
    recommendations: [
      'Foque nos pontos fracos de inspeção de queimador, cilindro de combustível e envelope.',
      'Faça mais um bloco de prática sobre limitações operacionais.',
      'Guarde o próximo teste até a precisão da prática melhorar.',
    ],
  },
  'regs.cars': {
    label: 'CARs',
    shortLabel: 'CARs',
    title: 'CARs',
    description:
      'Ganhe velocidade e confiança com o banco de questões e referências do Canadian Aviation Regulations.',
    breadcrumb: 'REGS / CARs',
    difficulty: 'Avançado',
    flashcards: {
      status: 'Ativo',
      lastSession: 'Última sessão: há 2 horas',
      completion: '52% concluído',
    },
    practice: {
      status: 'Pronto',
      streak: '5 corretas',
    },
    test: {
      status: 'Disponível',
      readiness: '87%',
    },
    recommendations: [
      'Continue revisando referências regulatórias difíceis e regras de aplicabilidade.',
      'Pratique questões mistas de interpretação regulatória.',
      'Agende outro teste cronometrado quando os flashcards chegarem a 60%.',
    ],
  },
  'regs.standards': {
    label: 'Standards',
    shortLabel: 'Standards',
    title: 'Standards',
    description:
      'Revise referências de standards, orientação por capítulos e interpretação de conformidade usadas ao longo do estudo AME.',
    breadcrumb: 'REGS / Standards',
    difficulty: 'Avançado',
    flashcards: {
      status: 'Ativo',
      lastSession: 'Última sessão: há 6 horas',
      completion: '45% concluído',
    },
    practice: {
      status: 'Pronto',
      streak: '4 corretas',
    },
    test: {
      status: 'Disponível',
      readiness: '84%',
    },
    recommendations: [
      'Dedique mais tempo aos capítulos de standards que apoiam sua licença principal.',
      'Pratique questões de interpretação sem consulta às referências.',
      'Use um simulado curto após mais uma rodada de flashcards.',
    ],
  },
};

function mergeModule(locale: LandingLocale, licenseId: StudyNavLicenseId, module: StudyNavModule) {
  if (locale === 'en') return module;

  const override = ptModuleOverrides[`${licenseId}.${module.id}`];
  if (!override) return module;

  return {
    ...module,
    ...override,
    flashcards: { ...module.flashcards, ...override.flashcards },
    practice: { ...module.practice, ...override.practice },
    test: { ...module.test, ...override.test },
  } satisfies StudyNavModule;
}

export function getStudyNavigation(locale: LandingLocale = 'en') {
  if (locale === 'en') {
    return baseStudyNavigation;
  }

  return baseStudyNavigation.map((license) => ({
    ...license,
    label: ptLicenseLabels[license.licenseId] ?? license.label,
    modules: license.modules.map((module) => mergeModule(locale, license.licenseId, module)),
  }));
}

export const studyNavigation = getStudyNavigation('en');

export function getStudyLicense(licenseId: string, locale: LandingLocale = 'en') {
  return getStudyNavigation(locale).find((license) => license.licenseId === licenseId) ?? null;
}

export function getStudyModule(
  licenseId: string,
  moduleId: string,
  locale: LandingLocale = 'en',
) {
  const license = getStudyLicense(licenseId, locale);
  if (!license) return null;
  return license.modules.find((module) => module.id === moduleId) ?? null;
}

export function getDefaultStudyModule(
  licenseId?: string | null,
  locale: LandingLocale = 'en',
) {
  const preferred = licenseId ? getStudyLicense(licenseId, locale) : null;
  if (preferred?.modules?.[0]) {
    return { license: preferred, module: preferred.modules[0] };
  }

  const fallbackLicense = getStudyNavigation(locale)[0];
  return {
    license: fallbackLicense,
    module: fallbackLicense.modules[0],
  };
}