// src/lib/moduleFlags.ts
import type {
  LicenseId,
  ModuleIdByLicense,
  MModuleId,
  EModuleId,
  SModuleId,
  BalloonsModuleId,
  RegsModuleId,
} from '@/lib/routes';

export type ModuleStatus = 'active' | 'coming_soon' | 'maintenance';
export type Flag = { status: ModuleStatus; message?: string };

const DEFAULT_FLAG: Flag = {
  status: 'coming_soon',
  message: 'Coming soon.',
} as const;

export const licenseFlags: Record<LicenseId, Flag> = {
  m: { status: 'active' },
  e: { status: 'active' },
  s: { status: 'active' },
  balloons: { status: 'active' },
  regs: { status: 'active' },
};

export const moduleFlags: {
  m: Record<MModuleId, Flag>;
  e: Record<EModuleId, Flag>;
  s: Record<SModuleId, Flag>;
  balloons: Record<BalloonsModuleId, Flag>;
  regs: Record<RegsModuleId, Flag>;
} = {
  m: {
    hub: { status: 'active' },
    'standard-practices': { status: 'active' },
    airframe: { status: 'active' },
    powerplant: { status: 'active' },
    logbook: { status: 'active' },
  },

  e: {
    hub: { status: 'active' },
    'standard-practices': { status: 'active' },
    'rating-avionics': { status: 'active' },
    logbook: { status: 'active' },
  },

  s: {
    hub: { status: 'active' },
    'standard-practices': { status: 'active' },
    'rating-structures': { status: 'active' },
    logbook: { status: 'active' },
  },

  balloons: {
    hub: { status: 'active' },
    bregs: { status: 'active' },
    logbook: { status: 'active' },
  },

  // ✅ REGS: /app/regs é o "core" global (deck combinado)
  regs: {
    core: { status: 'active' },
    cars: { status: 'active' },
    standards: { status: 'active' },
  },
};

export type ModuleId<L extends LicenseId> = ModuleIdByLicense[L];

export function getLabel(status: ModuleStatus) {
  if (status === 'active') return 'Active';
  if (status === 'coming_soon') return 'Coming soon';
  return 'Under maintenance';
}
export const getModuleLabel = getLabel;

export function getLicenseFlag(license: LicenseId): Flag {
  return licenseFlags[license] ?? DEFAULT_FLAG;
}

export function getModuleFlag<L extends LicenseId>(
  license: L,
  module: ModuleId<L>,
): Flag {
  const licModules = moduleFlags[license] as Record<string, Flag> | undefined;
  return licModules?.[module as unknown as string] ?? DEFAULT_FLAG;
}

export function getEffectiveFlag<L extends LicenseId>(
  license: L,
  module?: ModuleId<L>,
): Flag {
  const lic = getLicenseFlag(license);
  if (lic.status !== 'active') return lic;
  if (!module) return lic;
  return getModuleFlag(license, module);
}
