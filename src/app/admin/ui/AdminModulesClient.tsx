"use client";

import React from "react";
import type { LandingLocale } from '@/lib/i18n/landing';
import type { ModuleStatus } from "@/lib/moduleFlags";
import ModuleStatusBadge from "@/components/ModuleStatusBadge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAppDictionary } from '@/lib/i18n/app';

type Flag = { status: ModuleStatus; message?: string };
type LicenseFlags = Record<string, Flag>;
type ModuleFlags = Record<string, Record<string, Flag>>;

type Props = {
  locale: LandingLocale;
  initialLicenseFlags: LicenseFlags;
  initialModuleFlags: ModuleFlags;
};

function getLicenseOrder(locale: LandingLocale) {
  const isPt = locale === 'pt';

  return [
    {
      id: 'regs',
      label: 'REGS',
      desc: isPt
        ? 'Regulamentos (CARs, Standards, Certification, PRM, RCA)'
        : 'Regulations (CARs, Standards, Certification, PRM, RCA)',
    },
    {
      id: 'm',
      label: 'M',
      desc: isPt
        ? 'Avião e helicóptero (Práticas padrão, Célula, Grupo motopropulsor, Logbook)'
        : 'Airplane & Helicopter (Standard Practices, Airframe, Powerplant, Logbook)',
    },
    {
      id: 'e',
      label: 'E',
      desc: isPt
        ? 'Aviônicos (Práticas padrão, habilitação, Logbook)'
        : 'Avionics (Standard Practices, Rating, Logbook)',
    },
    {
      id: 's',
      label: 'S',
      desc: isPt
        ? 'Estruturas (Práticas padrão, habilitação, Logbook)'
        : 'Structures (Standard Practices, Rating, Logbook)',
    },
    { id: 'balloons', label: isPt ? 'Balões' : 'Balloons', desc: 'BREGS + Logbook' },
  ];
}

function humanizeModuleId(id: string) {
  const cleaned = id.replace(/[-_]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function AdminModulesClient({
  locale,
  initialLicenseFlags,
  initialModuleFlags,
}: Props) {
  const admin = getAppDictionary(locale).admin;
  const licenseOrder = React.useMemo(() => getLicenseOrder(locale), [locale]);
  const statusOptions = React.useMemo(
    () => [
      { value: 'active' as ModuleStatus, label: admin.active },
      { value: 'coming_soon' as ModuleStatus, label: admin.comingSoon },
      { value: 'maintenance' as ModuleStatus, label: admin.underMaintenance },
    ],
    [admin.active, admin.comingSoon, admin.underMaintenance],
  );
  const [licenseFlags, setLicenseFlags] = React.useState<LicenseFlags>(initialLicenseFlags);
  const [moduleFlags, setModuleFlags] = React.useState<ModuleFlags>(initialModuleFlags);
  const [saved, setSaved] = React.useState(false);

  function updateLicense(licenseId: string, patch: Partial<Flag>) {
    setSaved(false);
    setLicenseFlags((prev) => ({
      ...prev,
      [licenseId]: { ...(prev[licenseId] ?? { status: "coming_soon" }), ...patch },
    }));
  }

  function updateModule(licenseId: string, moduleId: string, patch: Partial<Flag>) {
    setSaved(false);
    setModuleFlags((prev) => ({
      ...prev,
      [licenseId]: {
        ...(prev[licenseId] ?? {}),
        [moduleId]: { ...(prev[licenseId]?.[moduleId] ?? { status: "coming_soon" }), ...patch },
      },
    }));
  }

  function buildModuleFlagsTs() {
    const lines: string[] = [];
    lines.push(`// src/lib/moduleFlags.ts`);
    lines.push(`export type ModuleStatus = "active" | "coming_soon" | "maintenance";`);
    lines.push(`export type Flag = { status: ModuleStatus; message?: string };`);
    lines.push("");
    lines.push(`export const licenseFlags = {`);

    for (const lic of licenseOrder) {
      const f = licenseFlags[lic.id] ?? { status: "coming_soon" as ModuleStatus };
      const msg = f.message?.trim();
      lines.push(
        `  ${lic.id}: { status: "${f.status}"${msg ? `, message: ${JSON.stringify(msg)}` : ""} },`
      );
    }

    for (const extraId of Object.keys(licenseFlags)) {
      if (licenseOrder.some((x) => x.id === extraId)) continue;
      const f = licenseFlags[extraId];
      const msg = f.message?.trim();
      lines.push(
        `  ${extraId}: { status: "${f.status}"${msg ? `, message: ${JSON.stringify(msg)}` : ""} },`
      );
    }

    lines.push(`} as const satisfies Record<string, Flag>;`);
    lines.push("");
    lines.push(`export const moduleFlags = {`);

    const licenseIds = [
      ...licenseOrder.map((x) => x.id),
      ...Object.keys(moduleFlags).filter((id) => !licenseOrder.some((x) => x.id === id)),
    ];

    for (const licId of licenseIds) {
      const mods = moduleFlags[licId] ?? {};
      lines.push(`  ${licId}: {`);
      for (const modId of Object.keys(mods)) {
        const f = mods[modId];
        const msg = f.message?.trim();
        const key = JSON.stringify(modId);
        lines.push(
          `    ${key}: { status: "${f.status}"${msg ? `, message: ${JSON.stringify(msg)}` : ""} },`
        );
      }
      lines.push(`  },`);
    }

    lines.push(`} as const satisfies Record<string, Record<string, Flag>>;`);
    lines.push("");
    lines.push(`export type LicenseId = keyof typeof licenseFlags;`);
    lines.push(`export type ModuleId<L extends LicenseId> = keyof (typeof moduleFlags)[L];`);
    lines.push("");
    lines.push(`export function getLabel(status: ModuleStatus) {`);
    lines.push(`  if (status === "active") return "Active";`);
    lines.push(`  if (status === "coming_soon") return "Coming soon";`);
    lines.push(`  return "Under maintenance";`);
    lines.push(`}`);
    lines.push(`export const getModuleLabel = getLabel;`);
    lines.push("");
    lines.push(`export function getLicenseFlag(license: LicenseId): Flag {`);
    lines.push(`  return licenseFlags[license];`);
    lines.push(`}`);
    lines.push("");
    lines.push(`export function getModuleFlag<L extends LicenseId>(license: L, module: ModuleId<L>): Flag {`);
    lines.push(`  return (moduleFlags[license] as any)[module] as Flag;`);
    lines.push(`}`);
    lines.push("");
    lines.push(`export function getEffectiveFlag<L extends LicenseId>(license: L, module?: ModuleId<L>): Flag {`);
    lines.push(`  const lic = getLicenseFlag(license);`);
    lines.push(`  if (lic.status !== "active") return lic;`);
    lines.push(`  if (!module) return lic;`);
    lines.push(`  return getModuleFlag(license, module);`);
    lines.push(`}`);
    return lines.join("\n");
  }

  async function onSaveCopy() {
    const text = buildModuleFlagsTs();
    await navigator.clipboard.writeText(text);
    setSaved(true);
  }

  const licenseCards = licenseOrder.map((lic) => {
    const licFlag = licenseFlags[lic.id] ?? { status: "coming_soon" as ModuleStatus };
    const modules = moduleFlags[lic.id] ?? {};
    const licenseLocked = licFlag.status !== "active";
    const statusLabel =
      licFlag.status === 'active'
        ? admin.active
        : licFlag.status === 'coming_soon'
        ? admin.comingSoon
        : admin.underMaintenance;

    return (
      <Card key={lic.id} className="border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
        <CardHeader className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-lg text-slate-900">{lic.label}</CardTitle>
              {lic.desc ? <CardDescription className="mt-1 text-slate-500">{lic.desc}</CardDescription> : null}
            </div>

            <div className="flex items-center gap-2">
              <ModuleStatusBadge status={licFlag.status} label={statusLabel} />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs text-slate-500">{admin.licenseStatus}</div>
              <select
                value={licFlag.status}
                onChange={(e) =>
                  updateLicense(lic.id, { status: e.target.value as ModuleStatus })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#d8e0fb]"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-500">{admin.licenseMessage}</div>
              <Input
                value={licFlag.message ?? ""}
                onChange={(e) => updateLicense(lic.id, { message: e.target.value })}
                placeholder={admin.licenseMessagePlaceholder}
                className="rounded-xl border-slate-200 bg-white"
              />
            </div>
          </div>

          {licenseLocked ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {admin.licenseLockedPrefix} <span className="font-medium">{statusLabel}</span>. {admin.licenseLockedSuffix}
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="text-sm font-medium text-slate-900">{admin.modules}</div>

          <div className="space-y-3">
            {Object.keys(modules).length === 0 ? (
              <div className="text-sm text-slate-500">{admin.noModulesConfigured}</div>
            ) : null}

            {Object.entries(modules).map(([moduleId, f]) => (
              <div
                key={moduleId}
                className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 ${
                  licenseLocked ? "opacity-90" : ""
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-semibold text-slate-900">{humanizeModuleId(moduleId)}</div>
                      <ModuleStatusBadge
                        status={f.status}
                        label={
                          f.status === 'active'
                            ? admin.active
                            : f.status === 'coming_soon'
                            ? admin.comingSoon
                            : admin.underMaintenance
                        }
                      />
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {admin.routeId}: <span className="font-mono">{moduleId}</span>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:w-[380px]">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500">{admin.moduleStatus}</div>
                      <select
                        value={f.status}
                        onChange={(e) =>
                          updateModule(lic.id, moduleId, {
                            status: e.target.value as ModuleStatus,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#d8e0fb]"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-slate-500">{admin.messageOptional}</div>
                      <Input
                        value={f.message ?? ""}
                        onChange={(e) => updateModule(lic.id, moduleId, { message: e.target.value })}
                        placeholder={admin.moduleMessagePlaceholder}
                        className="rounded-xl border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  });

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
        <CardHeader className="space-y-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base text-slate-900">{admin.modulesManagerTitle}</CardTitle>
              <CardDescription className="mt-1 text-slate-500">
                {admin.modulesManagerDescription}
              </CardDescription>
            </div>

            <Button onClick={onSaveCopy} className="rounded-xl bg-[#2d4bb3] text-white hover:bg-[#243d93]">
              {admin.saveCopy}
            </Button>
          </div>

          {saved ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {admin.copied}
            </div>
          ) : null}
        </CardHeader>
      </Card>

      <div className="grid gap-4">{licenseCards}</div>
    </div>
  );
}
