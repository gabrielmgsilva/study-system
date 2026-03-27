import React from 'react';
import { redirect } from 'next/navigation';

import LoggedAppShell from '@/components/app/LoggedAppShell';
import { AuthProvider } from '@/contexts/AuthContext';
import { getDefaultPrivateRouteForRole } from '@/lib/authz';
import { getCurrentUserServer } from '@/lib/currentUserServer';
import { localizeAppHref } from '@/lib/i18n/app';
import { getServerAppLocale } from '@/lib/i18n/appServer';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getServerAppLocale();
  const user = await getCurrentUserServer();

  if (!user) {
    redirect(localizeAppHref('/auth/login', locale));
  }

  if (user.role === 'admin') {
    redirect(localizeAppHref(getDefaultPrivateRouteForRole('admin'), locale));
  }

  return (
    <AuthProvider>
      <LoggedAppShell
        locale={locale}
        user={{
          name: user.name,
          email: user.email,
          username: user.username,
          primaryLicenseId: user.primaryLicenseId,
        }}
      >
        {children}
      </LoggedAppShell>
    </AuthProvider>
  );
}
