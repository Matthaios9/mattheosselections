/**
 * Links from the old WordPress/WooCommerce site, which served Swedish at the root (/product/ekhonung/)
 * and English under /en/ (/en/product/ekhonung/). The proxy redirects them permanently (301) to the new
 * page in the same language. Paths are compared without trailing slash or query string (?v=…).
 */

/** Old page → new locale-less path. */
const PAGES = {
  '/shop': '/shop',
  '/product': '/shop',
  '/cart': '/shop',
  '/checkout': '/shop',
  '/my-account': '/',
  '/about-us': '/about',
  '/contact-us': '/contact',
  '/terms-and-conditions': '/terms-and-conditions',
  '/privacy-policy': '/privacy-policy',
  '/cookie-policy-eu': '/privacy-policy',
  '/sample-page': '/',
  '/test': '/',
  '/coming-soon': '/',
  // The blog was not carried over; its articles were about bees, honey and our producers.
  '/blog': '/about',
  '/de-osynliga-hjaltarna-i-var-matforsorjning-binas-roll-i-livsmedelskedjan': '/about',
  '/hallbar-biodling-en-vag-till-att-skydda-bin-och-planeten': '/about',
  '/halsofordelarna-med-honung-naturens-gyllene-medicin': '/about',
  '/honey-in-traditional-medicine-swedens-natural-healer': '/about',
  '/pollineringens-betydelse-for-ekosystemet': '/about',
  '/skillnader-mellan-olika-typer-av-honun': '/about',
};

/** Old sections: anything below the prefix goes to one page. */
const SECTIONS = [
  ['/product-category/', '/shop'],
  ['/category/', '/about'], // blog categories
  ['/tag/', '/about'],
  ['/author/', '/about'],
];

/** WordPress-only paths with no equivalent: answered with 410 Gone so search engines drop them. */
export const GONE_PREFIXES = ['/wp-admin', '/wp-content', '/wp-includes', '/wp-json', '/feed', '/comments/feed'];

/** New locale-less path for an old one, or null. Products kept their WooCommerce slug (scripts/set-product-slugs.mjs). */
export function legacyTarget(path) {
  const product = path.match(/^\/product\/([^/]+)$/);
  if (product) return `/product/${product[1].toLowerCase()}`;
  if (PAGES[path]) return PAGES[path];
  return SECTIONS.find(([prefix]) => path.startsWith(prefix))?.[1] ?? null;
}
