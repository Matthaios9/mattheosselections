/**
 * Links from the old WordPress/WooCommerce site, which served Swedish at the root (/product/ekhonung/)
 * and English under /en/ (/en/product/ekhonung/). The proxy answers them in one step: a permanent
 * redirect (301) to the closest equivalent page in the same language, or 410 Gone when the content
 * has no equivalent on the new site. Paths are compared without trailing slash, without a trailing
 * WordPress page number (/page/2) and without query string (?v=…).
 *
 * The full old-URL → new-URL table, with the reason for each, is in docs/migration-qa/.
 * `npm run seo:audit` requests every entry and checks it lands on an indexable page in one hop.
 */

/** Old page → new locale-less path. */
const PAGES = {
  '/shop': '/shop',
  '/product': '/shop', // WooCommerce's product base on its own
  '/cart': '/shop', // the cart is now a drawer on every page
  '/checkout': '/shop', // checkout now opens from the cart
  '/my-account': '/', // accounts now open in a dialog from the header
  '/about-us': '/about',
  '/contact-us': '/contact',
  '/terms-and-conditions': '/terms-and-conditions',
  '/privacy-policy': '/privacy-policy',
  '/cookie-policy-eu': '/privacy-policy', // cookies are covered in the privacy policy
};

/** Old sections: anything below the prefix goes to one page. */
const SECTIONS = { '/checkout': '/shop', '/my-account': '/', '/cart': '/shop' };

/**
 * The old blog's articles, each with its closest equivalent. Articles about honey itself go to the
 * Raw Honey category page, which presents the honey varieties; articles on subjects the new site
 * doesn't cover are gone (410) rather than redirected to an unrelated page.
 * To be confirmed against Search Console (clicks, impressions, backlinks) — see docs/migration-qa/.
 */
export const ARTICLES = {
  '/skillnader-mellan-olika-typer-av-honun': '/shop/ra-honung', // differences between types of honey
  '/halsofordelarna-med-honung-naturens-gyllene-medicin': '/shop/ra-honung', // health benefits of honey
  '/honey-in-traditional-medicine-swedens-natural-healer': '/en/shop/ra-honung', // honey in traditional medicine (in English)
  '/hallbar-biodling-en-vag-till-att-skydda-bin-och-planeten': null, // sustainable beekeeping
  '/pollineringens-betydelse-for-ekosystemet': null, // pollination and the ecosystem
  '/de-osynliga-hjaltarna-i-var-matforsorjning-binas-roll-i-livsmedelskedjan': null, // bees in the food chain
};

/**
 * Old WooCommerce category slug → new category page slug (/{lang}/shop/{slug}). Old category URLs
 * not listed here go to the shop. Add the old slugs as they appear in Search Console.
 */
export const CATEGORIES = {
  'ra-honung': 'ra-honung',
  honungsskapelser: 'honungsskapelser',
  biprodukter: 'biprodukter',
  'naturliga-specialiteter': 'naturliga-specialiteter',
  presentforpackningar: 'presentforpackningar',
};

/** Old paths with no equivalent: the blog index and archives, and WordPress's own test pages. */
const GONE_PAGES = ['/blog', '/sample-page', '/test', '/test-2', '/coming-soon'];
const GONE_SECTIONS = ['/category/', '/tag/', '/author/'];

/** WordPress system paths: 410 Gone so search engines drop them. */
const WORDPRESS_PREFIXES = ['/wp-admin', '/wp-content', '/wp-includes', '/wp-json'];
const WORDPRESS_FILES = /^\/(xmlrpc\.php|wp-[\w-]+\.php)$/;
// RSS feeds of the site, its comments and of any post or product (/feed, /product/ekhonung/feed/rss2).
const FEED = /(^|\/)feed(\/[\w-]+)?$/;
// Yoast's and WordPress's sitemaps, which may still be registered in Search Console.
const OLD_SITEMAP = /^\/(sitemap_index|wp-sitemap[\w-]*|[\w-]+-sitemap\d*)\.xml$/;

/** WooCommerce query parameters that mean nothing on the new site; stripped with a 301. */
const OBSOLETE_PARAMS = ['v', 'add-to-cart', 'variation_id', 'orderby', 'paged', 'product-page', 'post_type', 'wc-ajax', 'replytocom', 'amp'];
const OBSOLETE_PARAM_PREFIXES = ['attribute_', 'filter_', 'query_type_'];

/** True for a query parameter the new site doesn't use (?v=…, ?add-to-cart=…, ?attribute_pa_size=…). */
export const isObsoleteParam = (key) => OBSOLETE_PARAMS.includes(key) || OBSOLETE_PARAM_PREFIXES.some((prefix) => key.startsWith(prefix));

/** Kept on every redirect so campaign links stay attributed (utm_*, click ids). */
export const isTrackingParam = (key) => key.startsWith('utm_') || ['gclid', 'fbclid', 'msclkid'].includes(key);

/** True for WordPress system paths, feeds and old sitemaps — also those with a file extension (see the proxy matcher). */
export function isWordPressPath(path) {
  return (
    WORDPRESS_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)) ||
    WORDPRESS_FILES.test(path) ||
    FEED.test(path) ||
    OLD_SITEMAP.test(path)
  );
}

/**
 * What an old locale-less path (no trailing slash) becomes:
 *   { target: '/shop' }       permanent redirect to that path in the old URL's language (or as given, if it has one)
 *   { gone: true }            410 Gone
 *   { sitemap: true }         permanent redirect to /sitemap.xml
 *   null                      not an old URL
 */
export function legacyRoute(path) {
  if (OLD_SITEMAP.test(path)) return { sitemap: true };
  if (isWordPressPath(path)) return { gone: true };

  // WordPress numbered its archive pages: /shop/page/2, /product-category/gavor/page/3.
  const base = path.replace(/\/page\/\d+$/, '') || '/';

  const product = base.match(/^\/product\/([^/]+)$/);
  if (product) return { target: `/product/${product[1].toLowerCase()}` };

  const category = base.match(/^\/product-category\/(?:[^/]+\/)*([^/]+)$/);
  if (category) {
    const slug = CATEGORIES[category[1].toLowerCase()];
    return { target: slug ? `/shop/${slug}` : '/shop' };
  }
  if (base.startsWith('/product-tag/')) return { target: '/shop' };

  if (PAGES[base]) return { target: PAGES[base] };
  // WooCommerce's sub-pages: /checkout/order-received/123, /my-account/orders, /my-account/lost-password.
  const section = Object.keys(SECTIONS).find((prefix) => base.startsWith(`${prefix}/`));
  if (section) return { target: SECTIONS[section] };
  if (base in ARTICLES) return ARTICLES[base] ? { target: ARTICLES[base] } : { gone: true };
  if (GONE_PAGES.includes(base) || GONE_SECTIONS.some((prefix) => base.startsWith(prefix))) return { gone: true };
  return null;
}
