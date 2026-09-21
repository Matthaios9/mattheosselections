import { SHARE_IMAGE } from '@/config/photos';
import { defaultLocale, getLocaleConfig, localeCodes, locales, localizePath } from './config';

/**
 * Canonical URL and hreflang alternates for a page. `path` is locale-less ('/', '/shop',
 * '/product/ekhonung'); `available` lists the languages the page is translated into (all by default).
 * x-default is the English page.
 */
export function localeAlternates(path, locale, available = localeCodes) {
  return {
    canonical: localizePath(path, locale),
    languages: {
      ...Object.fromEntries(available.map((code) => [code, localizePath(path, code)])),
      'x-default': localizePath(path, defaultLocale),
    },
  };
}

/**
 * Metadata for a storefront page: title, description, canonical + hreflang and Open Graph.
 * `title` is either a string (the layout adds " — Mattheos Selections") or `{ absolute }`.
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
      images: [image ? { url: image } : { url: SHARE_IMAGE, width: 1200, height: 630 }],
    },
  };
}
