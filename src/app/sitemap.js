import { siteConfig } from '@/config/site';
import { absoluteUrl, localeAlternates } from '@/i18n/metadata';
import { localeCodes } from '@/i18n/config';
import { getCategorySlugs, getProductSlugs } from '@/server/domain/storefront';

// Refreshed when the catalogue changes (revalidateStorefront) and at least hourly.
export const revalidate = 3600;

const PAGES = ['/', '/shop', '/about', '/contact', siteConfig.termsPath, siteConfig.privacyPath];

/**
 * Every indexable page in every language, each listing its translations (hreflang) as Google recommends:
 * the fixed pages, the category pages that have products and every visible product.
 *
 * When the catalogue can't be read this throws instead of answering without products: a failed
 * refresh keeps serving the last complete sitemap, and a build without database access fails loudly.
 */
export default async function sitemap() {
  const [products, categories] = await Promise.all([getProductSlugs(), getCategorySlugs()]);
  const entries = [
    ...PAGES.map((path) => ({ path, priority: path === '/' ? 1 : 0.7 })),
    ...categories.map(({ slug, updatedAt }) => ({ path: `/shop/${slug}`, lastModified: updatedAt, priority: 0.8 })),
    // A product only appears in the languages it has been translated into.
    ...products.map(({ slug, updatedAt, locales: available }) => ({
      path: `/product/${slug}`,
      lastModified: updatedAt,
      priority: 0.8,
      available,
    })),
  ];

  return entries.flatMap(({ path, lastModified, priority, available = localeCodes }) =>
    available.map((code) => {
      const { canonical, languages } = localeAlternates(path, code, available);
      return {
        url: absoluteUrl(canonical),
        ...(lastModified && { lastModified }),
        priority,
        alternates: {
          languages: Object.fromEntries(Object.entries(languages).map(([lang, url]) => [lang, absoluteUrl(url)])),
        },
      };
    })
  );
}
