"use client";

import React from "react";
import type { ModuleStatus } from "@/lib/moduleFlags";
import { getLabel } from "@/lib/moduleFlags";
import ModuleStatusBadge from "@/components/ModuleStatusBadge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Flag = { status: ModuleStatus; message?: string };
type LicenseFlags = Record<string, Flag>;
type ModuleFlags = Record<string, Record<string, Flag>>;

type Props = {
  initialLicenseFlags: LicenseFlags;
  initialModuleFlags: ModuleFlags;
};

const LICENSE_ORDER: { id: string; label: string; desc?: string }[] = [
  { id: "regs", label: "REGS", desc: "Regulations (CARs, Standards, Certification, PRM, RCA)" },
  { id: "m", label: "M", desc: "Airplane & Helicopter (Standard Practices, Airframe, Powerplant, Logbook)" },
  { id: "e", label: "E", desc: "Avionics (Standard Practices, Rating, Logbook)" },
  { id: "s", label: "S", desc: "Structures (Standard Practices, Rating, Logbook)" },
  { id: "balloons", label: "Balloons", desc: "BREGS + Logbook" },
];

const STATUS_OPTIONS: { value: ModuleStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "coming_soon", label: "Coming soon" },
  { value: "maintenance", label: "Under maintenance" },
];

function humanizeModuleId(id: string) {
  const cleaned = id.replace(/[-_]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function AdminModulesClient({
  initialLicenseFlags,
  initialModuleFlags,
}: Props) {
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

    for (const lic of LICENSE_ORDER) {
      const f = licenseFlags[lic.id] ?? { status: "coming_soon" as ModuleStatus };
      const msg = f.message?.trim();
      lines.push(
        `  ${lic.id}: { status: "${f.status}"${msg ? `, message: ${JSON.stringify(msg)}` : ""} },`
      );
    }

    for (const extraId of Object.keys(licenseFlags)) {
      if (LICENSE_ORDER.some((x) => x.id === extraId)) continue;
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
      ...LICENSE_ORDER.map((x) => x.id),
      ...Object.keys(moduleFlags).filter((id) => !LICENSE_ORDER.some((x) => x.id === id)),
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

  const licenseCards = LICENSE_ORDER.map((lic) => {
    const licFlag = licenseFlags[lic.id] ?? { status: "coming_soon" as ModuleStatus };
    const modules = moduleFlags[lic.id] ?? {};
    const licenseLocked = licFlag.status !== "active";

    return (
      <Card key={lic.id} className="border-white/10 bg-white/5 backdrop-blur">
        <CardHeader className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-lg">{lic.label}</CardTitle>
              {lic.desc ? <CardDescription className="mt-1">{lic.desc}</CardDescription> : null}
            </div>

            <div className="flex items-center gap-2">
              <ModuleStatusBadge status={licFlag.status} />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">License status</div>
              <select
                value={licFlag.status}
                onChange={(e) =>
                  updateLicense(lic.id, { status: e.target.value as ModuleStatus })
                }
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">License message (optional)</div>
              <Input
                value={licFlag.message ?? ""}
                onChange={(e) => updateLicense(lic.id, { message: e.target.value })}
                placeholder="Short message shown when license is locked..."
                className="rounded-xl border-white/10 bg-black/20"
              />
            </div>
          </div>

          {licenseLocked ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm">
              License is <span className="font-medium">{getLabel(licFlag.status)}</span>. Modules
              below will be blocked even if they are set to Active.
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="text-sm font-medium">Modules</div>

          <div className="space-y-3">
            {Object.keys(modules).length === 0 ? (
              <div className="text-sm text-muted-foreground">No modules configured.</div>
            ) : null}

            {Object.entries(modules).map(([moduleId, f]) => (
              <div
                key={moduleId}
                className={`rounded-2xl border border-white/10 bg-black/10 p-4 ${
                  licenseLocked ? "opacity-90" : ""
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-semibold">{humanizeModuleId(moduleId)}</div>
                      <ModuleStatusBadge status={f.status} />
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Route id: <span className="font-mono">{moduleId}</span>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:w-[380px]">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Module status</div>
                      <select
                        value={f.status}
                        onChange={(e) =>
                          updateModule(lic.id, moduleId, {
                            status: e.target.value as ModuleStatus,
                          })
                        }
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Message (optional)</div>
                      <Input
                        value={f.message ?? ""}
                        onChange={(e) => updateModule(lic.id, moduleId, { message: e.target.value })}
                        placeholder="Short, ESL-friendly message..."
                        className="rounded-xl border-white/10 bg-black/20"
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
      <Card className="border-white/10 bg-white/5 backdrop-blur">
        <CardHeader className="space-y-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Admin v1 — Licenses & Modules</CardTitle>
              <CardDescription className="mt-1">
                Manage availability with a two-layer gate: <b>License</b> → <b>Modules</b>.
                Saving copies an updated <span className="font-mono">moduleFlags.ts</span>.
              </CardDescription>
            </div>

            <Button onClick={onSaveCopy} className="rounded-xl">
              Save (copy moduleFlags.ts)
            </Button>
          </div>

          {saved ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm">
              ✅ Copied. Paste into <span className="font-mono">src/lib/moduleFlags.ts</span> and redeploy.
            </div>
          ) : null}
        </CardHeader>
      </Card>

      <div className="grid gap-4">{licenseCards}</div>
    </div>
  );
}
