import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import AdminShell from '@/components/admin/AdminShell';
import { AuthProvider } from '@/contexts/AuthContext';
import { getCurrentUserServer } from '@/lib/currentUserServer';
import { localizeAppHref } from '@/lib/i18n/app';
import { getServerAppLocale } from '@/lib/i18n/appServer';
import { ROUTES } from '@/lib/routes';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const locale = await getServerAppLocale();
  const user = await getCurrentUserServer();

  if (!user) {
    redirect(localizeAppHref('/auth/login', locale));
  }

  if (user.role !== 'admin') {
    redirect(localizeAppHref(ROUTES.appHome, locale));
  }

  return (
    <AuthProvider>
      <AdminShell
        locale={locale}
        user={{
          name: user.name,
          email: user.email,
        }}
      >
        {children}
      </AdminShell>
    </AuthProvider>
  );
}