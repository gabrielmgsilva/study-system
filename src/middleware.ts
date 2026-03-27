import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { canRoleAccessPrivatePath, getDefaultPrivateRouteForRole } from '@/lib/authz';
import { appLocaleCookie, getAppLocaleFromPathname, stripLocalePrefix } from '@/lib/i18n/app';
import { landingLocales } from '@/lib/i18n/landing';
import { AUTH_COOKIE_NAME, verifyJWT } from '@/lib/jwt';
import { ROUTES } from '@/lib/routes';

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const hasLocalePrefix = new RegExp(`^/(${landingLocales.join('|')})(?=/|$)`).test(pathname);
  const locale = getAppLocaleFromPathname(pathname);
  const strippedPathname = stripLocalePrefix(pathname);

  const cookie = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const token = await verifyJWT(cookie);
  const hasValidSession = Boolean(token);

  const isPrivate =
    strippedPathname.startsWith('/app') || strippedPathname.startsWith('/admin');
  const isAuth = pathname.startsWith('/auth') || /^\/(en|pt)\/auth(\/|$)/.test(pathname);

  // 🔒 Protect private areas
  if (isPrivate && !hasValidSession) {
    const url = req.nextUrl.clone();
    url.pathname = hasLocalePrefix ? ROUTES.localizedLogin(locale) : ROUTES.login;

    // keep where user wanted to go (optional but useful)
    const next = `${req.nextUrl.pathname}${req.nextUrl.search || ''}`;
    url.searchParams.set('next', next);

    const response = NextResponse.redirect(url);
    response.cookies.set(appLocaleCookie, locale, { path: '/' });
    return response;
  }

  if (isPrivate && token && !canRoleAccessPrivatePath(token.role, pathname)) {
    const url = req.nextUrl.clone();
    const target = getDefaultPrivateRouteForRole(token.role);
    url.pathname = hasLocalePrefix ? `/${locale}${target}` : target;
    url.search = '';

    const response = NextResponse.redirect(url);
    response.cookies.set(appLocaleCookie, locale, { path: '/' });
    return response;
  }

  // 🔁 If logged in, avoid auth pages (but allow landing "/")
  if (isAuth && token) {
    const url = req.nextUrl.clone();
    const target = getDefaultPrivateRouteForRole(token.role);
    url.pathname = hasLocalePrefix ? `/${locale}${target}` : target;
    url.search = '';
    const response = NextResponse.redirect(url);
    response.cookies.set(appLocaleCookie, locale, { path: '/' });
    return response;
  }

  if (hasLocalePrefix && isPrivate) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-ameone-locale', locale);

    const rewrittenUrl = req.nextUrl.clone();
    rewrittenUrl.pathname = strippedPathname;

    const response = NextResponse.rewrite(rewrittenUrl, {
      request: { headers: requestHeaders },
    });
    response.cookies.set(appLocaleCookie, locale, { path: '/' });
    return response;
  }

  if (hasLocalePrefix) {
    const response = NextResponse.next();
    response.cookies.set(appLocaleCookie, locale, { path: '/' });
    return response;
  }

  // ✅ Landing "/" is always accessible (logged in or not)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
