/**
 * Give every product without one its product-page slug (/{lang}/product/{slug}).
 *
 *   npm run set-product-slugs -- [--dry-run]
 *
 * Products carried over from the WordPress shop get their old WooCommerce slug, so old links
 * (/product/ekhonung/, /en/product/ekhonung/) redirect straight to the matching product page.
 * They are matched on their English name; any other product gets a slug from its Swedish name.
 * Products that already have a slug are left alone, so the script can be re-run safely.
 */
import { createRequire } from 'node:module';
import mongoose from 'mongoose';

const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());
const { Product } = await import('../src/server/models/index.js');

const WORDPRESS_SLUGS = {
  'Fir Tree Honey': 'adelgrannshonung',
  'Honey with Hazelnuts': 'akesis-honey-with-hazelnut',
  'Beeswax Cream': 'bivaxkram',
  'Flower & Herbal Honey': 'blomster-orthonung',
  'Oak Honey': 'ekhonung',
  'Honey with Edible Gold': 'honung-med-guld',
  'Honey with Turmeric and Ginger': 'honung-med-gurkmeja-och-ingefara',
  'Strawberry Tree Honey': 'jordgubbstrad-honung',
  'Extra Virgin Olive Oil': 'jungfru-olivolja-extra-virgin-olive-oil',
  'Naturbox: Oak, Thyme & Pine Honey': 'naturbox-ek-timjan-tallhonung',
  'Naturbox: The Whole Experience 11-Piece Set': 'naturbox-hela-upplevelsen',
  'Naturbox Honey & Propolis Gift Set': 'naturbox-honung-och-propolis-mattheos-selections',
  'Naturbox – Powerful Honey Blend': 'naturbox-kraftfull-honungsblandning',
  'Naturbox Superfood Honey Blend': 'naturbox-superfoodblandning',
  'Naturbox: Flowers & Herbs Honey, Oregano Honey & Thyme Honey': 'natuthos-omalisk-honangstrin',
  'Oregano Honey': 'oreganohonung',
  'Natural Propolis Extract': 'propolis',
  'Pine Honey': 'tallhonung',
  'Thyme Honey': 'timjanhonung',
};

const dryRun = process.argv.includes('--dry-run');

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'mattheos' });
if (!dryRun) await Product.createIndexes(); // the unique slug index

const products = await Product.find({ $or: [{ slug: { $exists: false } }, { slug: '' }, { slug: null }] });
for (const product of products) {
  const legacy = WORDPRESS_SLUGS[product.name.en];
  if (legacy && !(await Product.exists({ slug: legacy }))) product.slug = legacy;
  // Without a slug, validation generates one from the name.
  await product.validate();
  console.log(`${dryRun ? '[dry run] ' : ''}${product.slug.padEnd(52)} ${product.name.en}${legacy ? '' : '  (generated)'}`);
  if (!dryRun) await product.save();
}
console.log(products.length ? `${products.length} product(s) ${dryRun ? 'would be updated' : 'updated'}.` : 'Every product already has a slug.');

await mongoose.disconnect();
