import 'server-only';
import { notFound } from 'next/navigation';
import { isLocale } from './config';
import { translations } from './translations';
import { createTranslator } from './translate';

/** Server-side access to a locale's dictionary. Unknown locales render the 404 page. */
export async function getDictionary(locale) {
  if (!isLocale(locale)) notFound();
  const dict = translations[locale];
  return { dict, t: createTranslator(dict) };
}
