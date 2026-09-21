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
 * same language, permanently. `path` has no trailing slash. Null for everything else, including old
 * English URLs that are still valid as they are (e.g. /en/shop, /en/product/ekhonung).
 */
function legacyRedirect(request, path) {
  if (GONE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return new NextResponse(null, { status: 410, headers: { 'X-Robots-Tag': 'noindex' } });
  }
  const locale = localeOf(path);
  if (locale && locale !== 'en') return null;

  const target = legacyTarget(locale ? path.slice(3) || '/' : path);
  if (!target) return null;
  const destination = localizePath(target, locale ?? 'sv');
  if (destination === request.nextUrl.pathname) return null;

  // Built with new URL(): request.nextUrl would re-add the trailing slash of the old address.
  return NextResponse.redirect(new URL(destination, request.url), 301);
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  // Next.js's own trailing-slash redirect is off (next.config.mjs) so that old WordPress URLs, which all
  // end in "/", reach their new page in a single 301 instead of two redirects.
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') || '/' : pathname;

  const legacy = legacyRedirect(request, path);
  if (legacy) return legacy;

  if (path !== pathname) return NextResponse.redirect(new URL(`${path}${request.nextUrl.search}`, request.url), 301);

  if (path === '/admin' || path.startsWith('/admin/')) return guardAdmin(request);

  // Redirect locale-less storefront URLs (e.g. "/" or "/shop") to their localized version.
  if (localeOf(path)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${resolveLocale(request)}${path === '/' ? '' : path}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next.js internals, API routes and any file with an extension (images, icons, fonts…).
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
