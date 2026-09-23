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
    // Nothing to show for an empty amount, or for the test product, which is sold without VAT.
    if (!amount || rate === 0) continue;
    const key = rate ?? storeConfig.vatRate;
    // Each line's VAT is rounded on its own and the rounded figures are added up — the order Kustom
    // works in (total_tax_amount per order line). Adding first and rounding once would leave the VAT
    // shown here an öre away from the payment provider's figure on some orders.
    byRate.set(key, Math.round((byRate.get(key) ?? 0) * 100 + includedVat(amount, key) * 100) / 100);
  }
  return [...byRate.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rate, amount]) => ({ rate, amount }));
}
