import { storeConfig } from '@/config/site';

/** Countries offered at checkout (ISO 3166-1 alpha-2) — the same as the WooCommerce shop. */
export const SHIPPING_COUNTRIES = ['BE', 'CZ', 'DK', 'FR', 'DE', 'GR', 'IE', 'IT', 'NL', 'NO', 'PL', 'PT', 'SK', 'ES', 'SE', 'CH', 'GB'];

/** Shared by the checkout preview (client) and order creation (server). */
export function calculateShipping(subtotal, country = 'SE') {
  const rule = country === 'SE' ? storeConfig.shipping.domestic : storeConfig.shipping.international;
  return subtotal >= rule.freeOver ? 0 : rule.fee;
}
