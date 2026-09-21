import { NextResponse } from 'next/server';
import { GONE_PREFIXES, legacyTarget } from '@/config/redirects';
import { defaultLocale, isLocale, LOCALE_COOKIE, localeCodes, localizePath } from '@/i18n/config';
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
  // Only sessions from the Google admin sign-in; the panel re-checks that the account is still an admin.
  if (session?.admin) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = pathname === '/admin' ? '' : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

const localeOf = (pathname) => localeCodes.find((code) => pathname === `/${code}` || pathname.startsWith(`/${code}/`));

/**
 * Links from the old WordPress shop (Swedish at the root, English under /en/) → the new page in the
 * same language, permanently. Null for everything else, including old English URLs that are still
 * valid as they are (e.g. /en/shop, /en/product/ekhonung).
 */
function legacyRedirect(request) {
  const { pathname } = request.nextUrl;
  if (GONE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return new NextResponse(null, { status: 410, headers: { 'X-Robots-Tag': 'noindex' } });
  }
  const locale = localeOf(pathname);
  if (locale && locale !== 'en') return null;

  const path = (locale ? pathname.slice(3) : pathname).replace(/\/+$/, '') || '/';
  const target = legacyTarget(path);
  if (!target) return null;
  const destination = localizePath(target, locale ?? 'sv');
  if (destination === pathname) return null;

  const url = request.nextUrl.clone();
  url.pathname = destination;
  url.search = '';
  return NextResponse.redirect(url, 301);
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) return guardAdmin(request);

  const legacy = legacyRedirect(request);
  if (legacy) return legacy;

  // Redirect locale-less storefront URLs (e.g. "/" or "/shop") to their localized version.
  if (localeOf(pathname)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${resolveLocale(request)}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next.js internals, API routes and any file with an extension (images, icons, fonts…).
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
