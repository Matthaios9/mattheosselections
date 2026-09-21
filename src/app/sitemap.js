import { siteConfig } from '@/config/site';
import { localeAlternates } from '@/i18n/metadata';
import { locales } from '@/i18n/config';
import { getProductSlugs } from '@/server/domain/storefront';

// Refreshed when the catalogue changes (revalidateStorefront) and at least hourly.
export const revalidate = 3600;

const PAGES = ['/', '/shop', '/about', '/contact', siteConfig.termsPath, '/privacy-policy'];

/** Every page in every language, each listing its translations (hreflang) as Google recommends. */
export default async function sitemap() {
  const products = await getProductSlugs().catch((error) => {
    console.error('[sitemap] Could not list products:', error.message);
    return [];
  });
  const entries = [
    ...PAGES.map((path) => ({ path, priority: path === '/' ? 1 : 0.7 })),
    ...products.map(({ slug, updatedAt }) => ({ path: `/product/${slug}`, lastModified: updatedAt, priority: 0.8 })),
  ];
  const absolute = (path) => `${siteConfig.url}${path}`;

  return entries.flatMap(({ path, lastModified, priority }) =>
    locales.map(({ code }) => {
      const { canonical, languages } = localeAlternates(path, code);
      return {
        url: absolute(canonical),
        ...(lastModified && { lastModified }),
        priority,
        alternates: {
          languages: Object.fromEntries(Object.entries(languages).map(([lang, url]) => [lang, absolute(url)])),
        },
      };
    })
  );
}
