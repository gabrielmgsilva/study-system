'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface Props {
  licenses: { id: string; name: string }[];
  entitlements: { licenseId: string; isActive: boolean }[];
  maxLicenses: number;
}

export function LicenseManager({
  licenses,
  entitlements,
  maxLicenses,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>(
    () => {
      const map: Record<string, boolean> = {};
      for (const e of entitlements) {
        map[e.licenseId] = e.isActive;
      }
      return map;
    },
  );

  const activeCount = Object.values(toggleStates).filter(Boolean).length;

  const handleToggle = async (licenseId: string, checked: boolean) => {
    // Enforce max
    if (checked && activeCount >= maxLicenses) return;

    setToggleStates((prev) => ({ ...prev, [licenseId]: checked }));

    try {
      const res = await fetch('/api/licenses/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId, isActive: checked }),
      });

      if (!res.ok) {
        // Revert on failure
        setToggleStates((prev) => ({ ...prev, [licenseId]: !checked }));
      } else {
        startTransition(() => router.refresh());
      }
    } catch {
      setToggleStates((prev) => ({ ...prev, [licenseId]: !checked }));
    }
  };

  const enrolled = licenses.filter(
    (l) => toggleStates[l.id] !== undefined,
  );
  const available = licenses.filter(
    (l) => toggleStates[l.id] === undefined,
  );

  return (
    <div className="min-h-screen pb-24 px-4 pt-4">
      <h1 className="text-xl font-bold mb-1">Certifications</h1>
      <p className="text-sm text-muted-foreground mb-4">
        {activeCount} of {maxLicenses} selected
      </p>

      {/* Enrolled */}
      {enrolled.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            Enrolled
          </h2>
          <div className="space-y-2 mb-6">
            {enrolled.map((l) => (
              <Card
                key={l.id}
                className={cn(
                  'flex items-center justify-between p-4 min-h-[64px]',
                  toggleStates[l.id] && 'border-primary/40',
                )}
              >
                <div>
                  <p className="font-medium text-sm">{l.name}</p>
                  <Badge
                    variant={toggleStates[l.id] ? 'default' : 'secondary'}
                    className="text-[10px] mt-0.5"
                  >
                    {toggleStates[l.id] ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <Switch
                  checked={toggleStates[l.id] ?? false}
                  onCheckedChange={(checked) => handleToggle(l.id, checked)}
                  disabled={pending}
                  className="min-h-[24px]"
                />
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Available */}
      {available.length > 0 && (
        <>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            Available
          </h2>
          <div className="space-y-2">
            {available.map((l) => {
              const disabled = activeCount >= maxLicenses;
              return (
                <Card
                  key={l.id}
                  className={cn(
                    'flex items-center justify-between p-4 min-h-[64px]',
                    disabled && 'opacity-50',
                  )}
                >
                  <div>
                    <p className="font-medium text-sm">{l.name}</p>
                  </div>
                  <Switch
                    checked={false}
                    onCheckedChange={(checked) => handleToggle(l.id, checked)}
                    disabled={disabled || pending}
                    className="min-h-[24px]"
                  />
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
