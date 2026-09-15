/**
 * Internal id for a size, generated from its English label: "250 g" → "250g",
 * "11 pieces" → "11-pieces". Admins never type it; carts and orders reference it.
 */
export function variantKeyFrom(label) {
  return String(label ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/(\d)\s+(g|kg|ml|l)\b/g, '$1$2')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
