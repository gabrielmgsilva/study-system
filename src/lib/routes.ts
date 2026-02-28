// src/lib/routes.ts

// -----------------------------
// New TC-like IDs (modelo definitivo)
// -----------------------------
export type LicenseId = 'm' | 'e' | 's' | 'balloons' | 'regs';

// Submódulos por licença (modelo definitivo)
export type MModuleId =
  | 'hub'
  | 'standard-practices'
  | 'airframe'
  | 'powerplant'
  | 'logbook';

export type EModuleId =
  | 'hub'
  | 'standard-practices'
  | 'rating-avionics'
  | 'logbook';

export type SModuleId =
  | 'hub'
  | 'standard-practices'
  | 'rating-structures'
  | 'logbook';

export type BalloonsModuleId = 'hub' | 'bregs' | 'logbook';

// REGS (global) — modelo atual
export type RegsModuleId = 'core' | 'cars' | 'standards';

// União geral (helper tipado)
export type ModuleIdByLicense = {
  m: MModuleId;
  e: EModuleId;
  s: SModuleId;
  balloons: BalloonsModuleId;
  regs: RegsModuleId;
};

type LicenseWithModules = Exclude<LicenseId, 'regs'>;

export const ROUTES = {
  // -----------------------------
  // Public
  // -----------------------------
  landing: '/',
  pricing: '/pricing',

  about: '/about',
  help: '/help',
  instructions: '/instructions',
  feedback: '/feedback',
  becomeAme: '/become-ame',

  terms: '/terms',
  privacy: '/privacy',

  // -----------------------------
  // Auth (public)
  // -----------------------------
  login: '/auth/login',
  register: '/auth/register',
  forgotPassword: '/auth/forgot-password',

  // -----------------------------
  // App core (logged)
  // -----------------------------
  appHome: '/app',
  appHub: '/app/hub',
  student: '/app/student',
  account: '/app/account',

  // -----------------------------
  // TC-like — logged
  // -----------------------------
  regs: '/app/regs',

  m: '/app/m',
  e: '/app/e',
  s: '/app/s',
  balloons: '/app/balloons',

  // Hubs
  mHub: '/app/m/hub',
  eHub: '/app/e/hub',
  sHub: '/app/s/hub',
  balloonsHub: '/app/balloons/hub',

  // Logbooks
  mLogbook: '/app/m/logbook',
  eLogbook: '/app/e/logbook',
  sLogbook: '/app/s/logbook',
  balloonsLogbook: '/app/balloons/logbook',

  // M modules
  mStandardPractices: '/app/m/standard-practices',
  mAirframe: '/app/m/airframe',
  mPowerplant: '/app/m/powerplant',

  // E modules
  eStandardPractices: '/app/e/standard-practices',
  eRatingAvionics: '/app/e/rating-avionics',

  // S modules
  sStandardPractices: '/app/s/standard-practices',
  sRatingStructures: '/app/s/rating-structures',

  // Balloons modules
  balloonsBregs: '/app/balloons/bregs',

  // REGS subpages
  regsCars: '/app/regs/cars',
  regsStandards: '/app/regs/standards',

  // (deprecated – se ainda existir link antigo não quebra build)
  regsCertification: '/app/regs/certification',
  regsMaintenancePrm: '/app/regs/maintenance-prm',
  regsRca: '/app/regs/rca',

  // -----------------------------
  // Helpers (typed, modelo novo only)
  // -----------------------------
  license: (licenseId: LicenseId) => `/app/${licenseId}` as const,

  module: <L extends LicenseId>(
    licenseId: L,
    moduleId: ModuleIdByLicense[L],
  ) => `/app/${licenseId}/${moduleId}` as const,

  licenseHub: (licenseId: LicenseWithModules) =>
    `/app/${licenseId}/hub` as const,

  licenseLogbook: (licenseId: LicenseWithModules) =>
    `/app/${licenseId}/logbook` as const,
} as const;
