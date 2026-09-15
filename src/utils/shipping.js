import { storeConfig } from '@/config/site';

/** Countries offered at checkout (ISO 3166-1 alpha-2). */
export const SHIPPING_COUNTRIES = ['SE', 'DK', 'FI', 'NO', 'DE', 'NL', 'FR', 'GR'];

/** Shared by the checkout preview (client) and order creation (server). */
export function calculateShipping(subtotal, country = 'SE') {
  const rule = country === 'SE' ? storeConfig.shipping.domestic : storeConfig.shipping.international;
  return subtotal >= rule.freeOver ? 0 : rule.fee;
}
