import { getLocaleConfig } from '@/i18n/config';
import { storeConfig } from '@/config/site';

/**
 * Formatting helpers shared by the storefront and the admin — the single place
 * where prices, dates, countries and names are turned into display strings.
 */

/**
 * Deterministic price formatting (e.g. "1,900 kr" / "1 900 kr" / "1.900 kr").
 * Intl output differs slightly between Node and browsers (narrow no-break spaces),
 * which would cause hydration mismatches, so grouping is done by hand.
 */
export function formatPrice(amount, locale) {
  const { groupSeparator } = getLocaleConfig(locale);
  const rounded = Math.round(Number(amount) || 0);
  const grouped = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
  return `${rounded < 0 ? '−' : ''}${grouped} ${storeConfig.currencySymbol}`;
}

/* Admin formatting (English, Stockholm time) ---------------------------------- */

export const money = (amount) => formatPrice(amount ?? 0, 'en');

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Europe/Stockholm',
});

const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Stockholm',
});

export const formatDate = (iso) => (iso ? dateFormat.format(new Date(iso)) : '—');
export const formatDateTime = (iso) => (iso ? dateTimeFormat.format(new Date(iso)) : '—');

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
export const countryName = (code) => {
  try {
    return code ? regionNames.of(code) : '';
  } catch {
    return code;
  }
};

/* People --------------------------------------------------------------------- */

/** "Anna Andersson" → "Anna" */
export const firstName = (name = '') => String(name).trim().split(/\s+/)[0] ?? '';

/** "anna" → "A" (avatar initials) */
export const initial = (name = '') => String(name).trim().charAt(0).toUpperCase();

/** "1 item" / "3 items" for admin copy. */
export const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
