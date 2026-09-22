import { NextResponse } from 'next/server';
import { isObsoleteParam, isTrackingParam, isWordPressPath, legacyRoute } from '@/config/redirects';
import { isLocale, LOCALE_COOKIE, localeCodes, defaultLocale, localizePath } from '@/i18n/config';
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

/** Permanent redirect to `path` with `query`. Built with new URL(): request.nextUrl would re-add a trailing slash. */
function moved(request, path, query) {
  const url = new URL(path, request.url);
  url.search = query.toString();
  return NextResponse.redirect(url, 301);
}

/**
 * The storefront's language-less pages (/, /about, /shop/ra-honung…) → the visitor's language, temporarily:
 * the destination depends on the cookie and Accept-Language (Vary). Crawlers, which send neither, get English.
 */
function toVisitorLocale(request, path) {
  const url = request.nextUrl.clone();
  url.pathname = localizePath(path, resolveLocale(request));
  const response = NextResponse.redirect(url, 307);
  response.headers.set('Vary', 'Accept-Language, Cookie');
  return response;
}
const STOREFRONT_PATH = /^\/(about|contact|wishlist|privacy-policy|terms-and-conditions|shop(\/[^/]+)?|product\/[^/]+)?$/;

const GONE_PAGE = `<!doctype html>
<html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>Sidan finns inte längre — Mattheos Selections</title></head>
<body style="max-width:560px;margin:15vh auto;padding:0 24px;font-family:Georgia,serif;line-height:1.6;color:#3e382f;background:#fbf8f3">
<h1 style="font-size:28px;color:#1c1915">Sidan finns inte längre</h1>
<p>Den här sidan fanns på vår gamla webbplats och har tagits bort. <a href="/sv/shop">Se våra produkter</a> eller gå till <a href="/sv">startsidan</a>.</p>
<p lang="en">This page was on our old website and has been removed. <a href="/en/shop">See our products</a> or go to the <a href="/en">home page</a>.</p>
</body></html>`;

/** 410 Gone: the old page was removed on purpose and has no equivalent, so search engines drop it. */
const gone = () =>
  new NextResponse(GONE_PAGE, { status: 410, headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex' } });

/**
 * Links from the old WordPress shop (Swedish at the root, English under /en/) → the new page in the same
 * language in one permanent redirect, or 410 Gone (src/config/redirects.js). `path` has no trailing slash.
 * Null for everything else, including old English URLs that are still valid as they are (/en/shop).
 */
function legacyResponse(request, path) {
  const locale = localeOf(path);
  if (locale && locale !== 'en') return null;
  const oldPath = locale ? path.slice(3) || '/' : path;
  const query = request.nextUrl.searchParams;
  const tracking = new URLSearchParams([...query].filter(([key]) => isTrackingParam(key)));

  // WordPress's search (/?s=honung) and product archive (/?post_type=product) → the shop.
  if (oldPath === '/' && (query.has('s') || query.get('post_type') === 'product')) {
    if (query.get('s')) tracking.set('q', query.get('s'));
    return moved(request, localizePath('/shop', locale ?? 'sv'), tracking);
  }

  const route = legacyRoute(oldPath);
  if (!route) return null;
  if (route.gone) return gone();
  if (route.sitemap) return moved(request, '/sitemap.xml', new URLSearchParams());
  const destination = localeOf(route.target) ? route.target : localizePath(route.target, locale ?? 'sv');
  return destination === path ? null : moved(request, destination, tracking);
}

export async function proxy(request) {
  const { pathname, searchParams } = request.nextUrl;
  // Files reach the proxy only for old WordPress paths (see the matcher); anything else is served as usual.
  if (/\.\w+$/.test(pathname) && !isWordPressPath(pathname)) return NextResponse.next();

  // Next.js's own trailing-slash redirect is off (next.config.mjs) so that old WordPress URLs, which all
  // end in "/", reach their new page in a single 301 instead of two redirects.
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') || '/' : pathname;

  const legacy = legacyResponse(request, path);
  if (legacy) return legacy;

  // One 301 to the clean address: no trailing slash, no WooCommerce parameters (?v=…, ?add-to-cart=…).
  const query = new URLSearchParams([...searchParams].filter(([key]) => !isObsoleteParam(key)));
  if (path !== pathname || query.size !== searchParams.size) return moved(request, path, query);

  if (path === '/admin' || path.startsWith('/admin/')) return guardAdmin(request);
  if (localeOf(path)) return NextResponse.next();
  if (STOREFRONT_PATH.test(path)) return toVisitorLocale(request, path);

  // Anything else without a language isn't a page: answer 404 right here (in the visitor's language)
  // instead of redirecting to a localized URL that doesn't exist either.
  const url = request.nextUrl.clone();
  url.pathname = `/${resolveLocale(request)}/page-not-found`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // Skip Next.js internals, API routes and any file with an extension (images, icons, fonts…)…
    '/((?!_next|api|.*\\..*).*)',
    // …except the old WordPress files and sitemaps, which are redirected or answered 410 Gone.
    '/(wp-.*)',
    '/(xmlrpc\\.php)',
    '/(.*sitemap.*\\.xml)',
  ],
};
