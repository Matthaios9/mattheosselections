import { SHARE_IMAGE } from '@/config/photos';
import { defaultLocale, getLocaleConfig, locales, localizePath } from './config';

/**
 * Canonical URL and hreflang alternates for a page that exists in every language.
 * `path` is locale-less ('/', '/shop', '/product/ekhonung'). x-default is the English page.
 */
export function localeAlternates(path, locale) {
  return {
    canonical: localizePath(path, locale),
    languages: {
      ...Object.fromEntries(locales.map(({ code }) => [code, localizePath(path, code)])),
      'x-default': localizePath(path, defaultLocale),
    },
  };
}

/**
 * Metadata for a storefront page: title, description, canonical + hreflang and Open Graph.
 * `title` is either a string (the layout adds " — Mattheos Selections") or `{ absolute }`.
 */
export function pageMetadata({ dict, locale, path, title, description, image, type = 'website' }) {
  const fullTitle = typeof title === 'string' ? `${title} — ${dict.meta.siteName}` : title.absolute;
  return {
    title,
    description,
    alternates: localeAlternates(path, locale),
    openGraph: {
      type,
      siteName: dict.meta.siteName,
      locale: getLocaleConfig(locale).ogLocale,
      alternateLocale: locales.filter(({ code }) => code !== locale).map(({ ogLocale }) => ogLocale),
      url: localizePath(path, locale),
      title: fullTitle,
      description,
      images: [image ? { url: image } : { url: SHARE_IMAGE, width: 1200, height: 630 }],
    },
  };
}
