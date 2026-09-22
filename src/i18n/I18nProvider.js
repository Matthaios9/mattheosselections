'use client';

import { createContext, useContext } from 'react';
import { getLocaleConfig, localizePath } from './config';
import { createTranslator } from './translate';
import { formatEuro, formatPrice } from '@/utils/format';

const I18nContext = createContext(null);

/**
 * Receives only the active locale's dictionary from the server layout,
 * so the client bundle never ships the other languages.
 */
export function I18nProvider({ locale, dict, children }) {
  const value = {
    locale,
    dict,
    dir: getLocaleConfig(locale).dir,
    t: createTranslator(dict),
    href: (path) => localizePath(path, locale),
    price: (amount, options) => formatPrice(amount, locale, options),
    euro: (amount) => formatEuro(amount, locale),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Access translations in Client Components:
 *   const { t, href, price, euro, locale } = useI18n();
 *   t('cart.title'); href('/shop'); price(490); euro(490);
 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside <I18nProvider>');
  return context;
}
