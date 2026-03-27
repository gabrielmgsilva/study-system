import type { AuthRole } from '@/lib/jwt';

import { stripLocalePrefix } from '@/lib/i18n/app';
import { ROUTES } from '@/lib/routes';

export function getDefaultPrivateRouteForRole(role: AuthRole) {
  return role === 'admin' ? ROUTES.adminHome : ROUTES.appHome;
}

export function canRoleAccessPrivatePath(role: AuthRole, pathname: string) {
  const normalizedPath = stripLocalePrefix(pathname);

  if (normalizedPath.startsWith('/admin')) {
    return role === 'admin';
  }

  if (normalizedPath.startsWith('/app')) {
    return role === 'user';
  }

  return true;
}

export function isRoleCompatibleRedirect(role: AuthRole, pathname: string) {
  return canRoleAccessPrivatePath(role, pathname);
}