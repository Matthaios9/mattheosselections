import { storeConfig } from '@/config/site';

/** The VAT included in a price — all prices include VAT — in kr, rounded to öre. */
export function includedVat(amount, rate = storeConfig.vatRate) {
  return Math.round((amount * rate * 100) / (100 + rate)) / 100;
}

/**
 * The rate one product is sold at. Goods that aren't food — beeswax cream and other cosmetics,
 * ticked as "Standard VAT" in the admin — carry the standard rate; everything else the food rate.
 */
export const vatRateFor = (standardVat) => (standardVat ? storeConfig.standardVatRate : storeConfig.vatRate);

/**
 * Included VAT grouped by rate, for a cart or order that mixes them:
 *   vatBreakdown([{ amount: 300, rate: 6 }, { amount: 100, rate: 25 }]) → [{ rate: 6, … }, { rate: 25, … }]
 * Rates with nothing behind them are dropped, so an order of food alone still shows one VAT line.
 */
export function vatBreakdown(parts) {
  const byRate = new Map();
  for (const { amount, rate } of parts) {
    if (!amount) continue;
    const key = rate ?? storeConfig.vatRate;
    byRate.set(key, (byRate.get(key) ?? 0) + amount);
  }
  return [...byRate.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rate, amount]) => ({ rate, amount: includedVat(amount, rate) }));
}
