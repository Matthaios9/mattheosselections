import { defaultLocale } from '@/i18n/config';

/** Value of a `{ en, sv, el }` field in `locale`, falling back to English when missing. */
export function pickLocalized(field, locale) {
  if (field == null || typeof field !== 'object') return field;
  const value = field[locale];
  return value == null || value === '' ? field[defaultLocale] : value;
}
