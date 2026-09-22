import { getLocaleConfig } from '@/i18n/config';
import { storeConfig } from '@/config/site';

/**
 * Formatting helpers shared by the storefront and the admin — the single place
 * where prices, dates, countries and names are turned into display strings.
 */

/**
 * Deterministic price formatting (e.g. "1,900 kr" / "1 900 kr" / "1.900 kr"; with `decimals: 2`
 * "10.19 kr" / "10,19 kr"). Intl output differs slightly between Node and browsers (narrow no-break
 * spaces), which would cause hydration mismatches, so grouping is done by hand.
 */
export function formatPrice(amount, locale, { decimals = 0 } = {}) {
  return `${formatNumber(amount, locale, decimals)} ${storeConfig.currencySymbol}`;
}

/**
 * The approximate euro price shown under a kr price, as on the old WordPress shop: a flat
 * kr ÷ 10, with cents only when there are any (250 kr → "€25", 399 kr → "€39.90").
 */
export function formatEuro(amountSek, locale) {
  const euros = Math.round(((Number(amountSek) || 0) / storeConfig.sekPerEuro) * 100) / 100;
  return `€${formatNumber(euros, locale, Number.isInteger(euros) ? 0 : 2)}`;
}

function formatNumber(amount, locale, decimals) {
  const { groupSeparator, decimalSeparator } = getLocaleConfig(locale);
  const factor = 10 ** decimals;
  const scaled = Math.round((Number(amount) || 0) * factor);
  const whole = String(Math.floor(Math.abs(scaled) / factor)).replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
  const fraction = decimals ? `${decimalSeparator}${String(Math.abs(scaled) % factor).padStart(decimals, '0')}` : '';
  return `${scaled < 0 ? '−' : ''}${whole}${fraction}`;
}

/* Admin formatting (English, Stockholm time) ---------------------------------- */

export const money = (amount, options) => formatPrice(amount ?? 0, 'en', options);

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
