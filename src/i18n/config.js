/**
 * Central locale configuration.
 *
 * To add or replace a language:
 *  1. add an entry here (set `dir: 'rtl'` for right-to-left scripts such as Arabic),
 *  2. add a matching dictionary in `src/i18n/translations/`,
 *  3. products and categories are created in the admin panel with a field per language.
 */
export const locales = [
  {
    code: 'en',
    label: 'English',
    shortLabel: 'EN',
    dir: 'ltr',
    // Used for number grouping and decimals in prices (see src/utils/format.js)
    groupSeparator: ',',
    decimalSeparator: '.',
    ogLocale: 'en_GB',
  },
  {
    code: 'sv',
    label: 'Svenska',
    shortLabel: 'SV',
    dir: 'ltr',
    groupSeparator: ' ',
    decimalSeparator: ',',
    ogLocale: 'sv_SE',
  },
  {
    code: 'el',
    label: 'Ελληνικά',
    shortLabel: 'EL',
    dir: 'ltr',
    groupSeparator: '.',
    decimalSeparator: ',',
    ogLocale: 'el_GR',
  },
];

export const defaultLocale = 'en';

export const localeCodes = locales.map((locale) => locale.code);

/** Cookie used by the proxy to remember a visitor's language choice. */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function isLocale(value) {
  return localeCodes.includes(value);
}

export function getLocaleConfig(code) {
  return locales.find((locale) => locale.code === code) ?? locales[0];
}

/** Prefix an internal path with the active locale: localizePath('/shop', 'sv') -> '/sv/shop' */
export function localizePath(path, locale) {
  const clean = path === '/' ? '' : path;
  return `/${locale}${clean}`;
}
