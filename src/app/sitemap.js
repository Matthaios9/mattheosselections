import { siteConfig } from '@/config/site';
import { localeAlternates } from '@/i18n/metadata';
import { localeCodes } from '@/i18n/config';
import { getProductSlugs } from '@/server/domain/storefront';

// Refreshed when the catalogue changes (revalidateStorefront) and at least hourly.
export const revalidate = 3600;

const PAGES = ['/', '/shop', '/about', '/contact', siteConfig.termsPath, siteConfig.privacyPath];

/** Every page in every language, each listing its translations (hreflang) as Google recommends. */
export default async function sitemap() {
  const products = await getProductSlugs().catch((error) => {
    console.error('[sitemap] Could not list products:', error.message);
    return [];
  });
  const entries = [
    ...PAGES.map((path) => ({ path, priority: path === '/' ? 1 : 0.7 })),
    // A product only appears in the languages it has been translated into.
    ...products.map(({ slug, updatedAt, locales: available }) => ({
      path: `/product/${slug}`,
      lastModified: updatedAt,
      priority: 0.8,
      available,
    })),
  ];
  const absolute = (path) => `${siteConfig.url}${path}`;

  return entries.flatMap(({ path, lastModified, priority, available = localeCodes }) =>
    available.map((code) => {
      const { canonical, languages } = localeAlternates(path, code, available);
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
