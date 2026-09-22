/** URL slug from any text: "Honung med ätbart guld" → "honung-med-atbart-guld". Non-Latin text gives ''. */
export function slugify(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}

/**
 * A category's page slug: its saved slug, else one from its Swedish (else English) name — the same
 * rule the model uses when it saves one, so the address doesn't change once the slug is stored.
 */
export function categorySlug(category) {
  return category.slug || slugify(category.name?.sv) || slugify(category.name?.en) || String(category._id);
}
