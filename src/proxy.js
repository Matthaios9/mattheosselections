import { NextResponse } from 'next/server';
import { defaultLocale, isLocale, LOCALE_COOKIE, localeCodes } from '@/i18n/config';
import { decodeSession, SESSION_COOKIE } from '@/server/auth/session';

/** Pick a locale from the saved cookie, then the browser's Accept-Language header. */
function resolveLocale(request) {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;

  const header = request.headers.get('accept-language') ?? '';
  const preferred = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { lang: tag.toLowerCase().split('-')[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q)
    .find((entry) => localeCodes.includes(entry.lang));

  return preferred?.lang ?? defaultLocale;
}

/**
 * Optimistic admin gate: bounce requests without an admin session to the login page.
 * Pages and actions still verify the user against the database (src/server/auth/dal.js).
 */
async function guardAdmin(request) {
  const { pathname, search } = request.nextUrl;
  if (pathname === '/admin/login') return NextResponse.next();

  const session = await decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
  // Only sessions from the Google admin sign-in; the panel re-checks the account and ADMIN_EMAIL.
  if (session?.admin) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = pathname === '/admin' ? '' : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) return guardAdmin(request);

  // Redirect locale-less storefront URLs (e.g. "/" or "/shop") to their localized version.
  const hasLocale = localeCodes.some((code) => pathname === `/${code}` || pathname.startsWith(`/${code}/`));
  if (hasLocale) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${resolveLocale(request)}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next.js internals, API routes and any file with an extension (images, icons, fonts…).
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
