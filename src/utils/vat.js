import { storeConfig } from '@/config/site';

/** The VAT included in a price — all prices include VAT — in kr, rounded to öre. */
export function includedVat(amount, rate = storeConfig.vatRate) {
  return Math.round((amount * rate * 100) / (100 + rate)) / 100;
}
