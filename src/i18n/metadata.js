import { SHARE_IMAGE } from '@/config/photos';
import { siteConfig } from '@/config/site';
import { getLocaleConfig, localeCodes, locales, localizePath } from './config';

/**
 * x-default — the version for searchers whose language is none of en / sv / el — is the English
 * page: the shop sells to all of Europe, and English is the language those visitors most likely
 * read. (The locale-less "/" isn't used: it redirects by browser language, so it never answers 200.)
 * A page without an English version falls back to the first language it has.
 */
export const X_DEFAULT_LOCALE = 'en';

/** '/en/shop' → 'https://www.mattheosselections.com/en/shop' (absolute URLs are left as they are). */
export const absoluteUrl = (path) => (/^https?:\/\//.test(path) ? path : `${siteConfig.url}${path}`);

/**
 * A link-preview (Open Graph) image for a catalogue photo: Cloudinary photos are padded to the 1200×630
 * format that Facebook, LinkedIn and messengers show without cropping; others are used as they are.
 */
export function shareImage(url, alt) {
  const cloudinary = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/);
  if (!cloudinary) return { url: absoluteUrl(url), alt };
  return { url: `${cloudinary[1]}c_pad,b_white,w_1200,h_630,f_jpg,q_auto/${cloudinary[2]}`, width: 1200, height: 630, alt };
}

/**
 * Canonical URL and hreflang alternates for a page. `path` is locale-less ('/', '/shop',
 * '/product/ekhonung'); `available` lists the languages the page is translated into (all by default).
 */
export function localeAlternates(path, locale, available = localeCodes) {
  const fallback = available.includes(X_DEFAULT_LOCALE) ? X_DEFAULT_LOCALE : available[0];
  return {
    canonical: localizePath(path, locale),
    languages: {
      ...Object.fromEntries(available.map((code) => [code, localizePath(path, code)])),
      'x-default': localizePath(path, fallback),
    },
  };
}

/** schema.org BreadcrumbList for `[{ label, href? }]`; the last item (no href) is the page at `url`. */
export function breadcrumbJsonLd(items, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: absoluteUrl(item.href ?? url),
    })),
  };
}

/**
 * Metadata for a storefront page: title, description, canonical + hreflang and Open Graph.
 * `title` is either a string (the layout adds " — Mattheos Selections") or `{ absolute }`; `image` is
 * an Open Graph image (see shareImage), else the site's share image.
 * A page shown in a language it has no translation for (see `available`) is kept out of search results.
 */
export function pageMetadata({ dict, locale, path, title, description, image, type = 'website', available = localeCodes }) {
  const fullTitle = typeof title === 'string' ? `${title} — ${dict.meta.siteName}` : title.absolute;
  return {
    title,
    description,
    alternates: localeAlternates(path, locale, available),
    ...(!available.includes(locale) && { robots: { index: false, follow: true } }),
    openGraph: {
      type,
      siteName: dict.meta.siteName,
      locale: getLocaleConfig(locale).ogLocale,
      alternateLocale: locales.filter(({ code }) => code !== locale && available.includes(code)).map(({ ogLocale }) => ogLocale),
      url: localizePath(path, locale),
      title: fullTitle,
      description,
      images: [image ?? { url: SHARE_IMAGE, width: 1200, height: 630 }],
    },
  };
}
