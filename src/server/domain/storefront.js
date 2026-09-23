import 'server-only';
import { cache } from 'react';
import mongoose from 'mongoose';
import { storeConfig } from '@/config/site';
import { defaultLocale, isLocale, localeCodes } from '@/i18n/config';
import { DEFAULT_SORT, PRICE_RANGES, SORT_OPTIONS } from '@/constants/shop';
import { connectToDatabase, isDatabaseConfigured } from '@/server/db';
import { Category, Product } from '@/server/models';
import { accentInsensitiveRegex, searchWords } from '@/server/search';
import { isObjectId, pageParams, pageResult, toId, toIso } from '@/server/utils';
import { pickLocalized } from '@/utils/localize';
import { categorySlug } from '@/utils/slug';
import { splitList } from '@/utils/url';
import { isTestProduct } from '@/utils/test-product';
import { vatRateFor } from '@/utils/vat';

/**
 * Public catalogue: active products in visible categories, localized for one
 * language. Used by storefront Server Components (first render / SEO) and by
 * the public products API, so both always return identical data.
 */

const PLACEHOLDER_IMAGE = '/images/editorial/honeycomb-close.jpg';
export const MAX_PAGE_SIZE = 48;

// Every order lists available products first, sold-out ones last. "Best selling" and "Featured" then put
// products with the Bestseller badge on top.
const SORTS = {
  featured: { available: -1, bestseller: -1, featured: -1, soldCount: -1, createdAt: -1, _id: 1 },
  popularity: { available: -1, bestseller: -1, soldCount: -1, featured: -1, createdAt: -1, _id: 1 },
  newest: { available: -1, createdAt: -1, _id: 1 },
  'price-asc': { available: -1, price: 1, _id: 1 },
  'price-desc': { available: -1, price: -1, _id: 1 },
};

// `available` is worked out from the sizes' stock, exactly as the card's "Sold out" badge is, rather
// than the stored `inStock` flag, so a product shown as sold out can never sort among available ones.
const SORT_FIELDS = {
  $addFields: {
    available: { $anyElementTrue: [{ $map: { input: { $ifNull: ['$variants', []] }, as: 'v', in: { $gt: ['$$v.stock', 0] } } }] },
    bestseller: { $eq: ['$badge', 'bestseller'] },
  },
};

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

/** Visible categories + the filter every public product query starts from (cached per request). */
const loadVisibility = cache(async () => {
  await connectToDatabase();
  const [categories, hiddenIds] = await Promise.all([
    Category.find({ active: true }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
    Category.find({ active: false }).distinct('_id'),
  ]);
  return {
    categories,
    byId: new Map(categories.map((category) => [toId(category._id), category])),
    // Active products, except those filed under a hidden category. Uncategorised products are shown.
    base: { status: 'active', category: { $nin: hiddenIds } },
  };
});

/** Storefront product shape used by every product component (cards, quick view, cart…). */
function localizeProduct(doc, categoriesById, locale) {
  const image = doc.images?.[0]?.url ?? PLACEHOLDER_IMAGE;
  const category = categoriesById.get(toId(doc.category));
  const variants = (doc.variants ?? []).map((variant) => ({
    id: variant.key,
    label: pickLocalized(variant.label, locale),
    price: variant.price,
    stock: Math.max(0, variant.stock ?? 0),
    image: variant.image || image,
  }));
  const preferred = variants.find((variant) => variant.id === doc.defaultVariant);
  // Pre-select the default size, or the first size that is still in stock.
  const selected = preferred?.stock > 0 ? preferred : (variants.find((variant) => variant.stock > 0) ?? preferred ?? variants[0]);
  const testProduct = isTestProduct(doc.name);

  return {
    id: toId(doc._id),
    sku: doc.sku ?? '',
    slug: doc.slug ?? '',
    category: category ? toId(doc.category) : null,
    categorySlug: category ? categorySlug(category) : null,
    categoryName: category ? pickLocalized(category.name, locale) : '',
    price: doc.price,
    vatRate: testProduct ? 0 : vatRateFor(doc.standardVat),
    testProduct,
    image,
    variants,
    defaultVariant: selected?.id ?? '',
    inStock: variants.some((variant) => variant.stock > 0),
    badge: doc.badge || null,
    featured: Boolean(doc.featured),
    soldCount: doc.soldCount ?? 0,
    createdAt: toIso(doc.createdAt),
    name: pickLocalized(doc.name, locale),
    description: pickLocalized(doc.description, locale),
  };
}

/** Aggregation expression: does any size's price fall inside `range`? */
const anyVariantInRange = (range) => ({
  $anyElementTrue: [
    {
      $map: {
        input: '$variants',
        as: 'variant',
        in: {
          $and: [
            { $gte: ['$$variant.price', range.min ?? 0] },
            ...(range.max != null ? [{ $lt: ['$$variant.price', range.max] }] : []),
          ],
        },
      },
    },
  ],
});

/**
 * URL / API query params → `searchStoreProducts` options. Shared by the shop page
 * (first render) and GET /api/products, so both read filters the same way.
 * Params: locale, q, category, price, sizes (comma list), stock=in, featured=1, ids, sort, page, pageSize, facets=1
 */
export function storeQueryToOptions(query = {}) {
  const ids = query.ids !== undefined ? splitList(query.ids) : undefined;
  const flag = (value) => value === '1' || value === 'true' || value === true;
  return {
    locale: isLocale(query.locale) ? query.locale : 'en',
    q: String(query.q ?? '').slice(0, 100), // a search longer than this is not a real one
    category: query.category ?? '',
    price: query.price ?? '',
    sizes: splitList(query.sizes),
    inStock: query.stock === 'in',
    featured: flag(query.featured),
    ids,
    sort: query.sort,
    page: query.page,
    pageSize: ids ? ids.length || 1 : (query.pageSize ?? storeConfig.shopPageSize),
    facets: flag(query.facets),
  };
}

/** One MongoDB condition per active filter, keyed by filter name (so facets can leave one out). */
function buildConditions({ q, category, price, sizes, inStock, featured, ids }, { locale, categories }) {
  const conditions = {};

  const words = searchWords(q);
  if (words.length) {
    // Every word must appear in the name, description or category name (accent-insensitive).
    conditions.query = {
      $and: words.map((word) => {
        const pattern = accentInsensitiveRegex(word);
        const fields = [...new Set([`name.${locale}`, 'name.en', `description.${locale}`, 'description.en'])];
        const matchingCategories = categories
          .filter((item) => pattern.test(pickLocalized(item.name, locale)))
          .map((item) => item._id);
        const or = fields.map((field) => ({ [field]: pattern }));
        if (matchingCategories.length) or.push({ category: { $in: matchingCategories } });
        return { $or: or };
      }),
    };
  }
  if (category && category !== 'all') {
    // An unknown id matches nothing rather than everything.
    conditions.category = isObjectId(category) ? { category: toObjectId(category) } : { _id: null };
  }
  const range = PRICE_RANGES.find((item) => item.id === price);
  if (range) {
    conditions.price = {
      variants: { $elemMatch: { price: { $gte: range.min ?? 0, ...(range.max != null && { $lt: range.max }) } } },
    };
  }
  if (sizes?.length) conditions.sizes = { 'variants.key': { $in: sizes } };
  if (inStock) conditions.stock = { inStock: true };
  if (featured) conditions.featured = { featured: true };
  if (ids) conditions.ids = { _id: { $in: ids.filter(isObjectId).map(toObjectId) } };
  return conditions;
}

const matchAll = (conditions, except) => {
  const list = Object.entries(conditions)
    .filter(([key]) => key !== except)
    .map(([, condition]) => condition);
  return list.length ? { $and: list } : {};
};

/**
 * Filter, sort and paginate the public catalogue.
 *
 * Options: { locale, q, category, price, sizes[], inStock, featured, ids[], sort, page, pageSize, facets }
 * Returns `{ items, total, page, pageSize, pages }` plus, with `facets: true`, the number of
 * products each filter option would return given the other active filters, and the size options.
 */
export async function searchStoreProducts({
  locale = 'en',
  sort = DEFAULT_SORT,
  page = 1,
  pageSize = storeConfig.shopPageSize,
  facets = false,
  ...filters
} = {}) {
  const empty = pageResult([], 0, pageParams({ page, pageSize }));
  if (!isDatabaseConfigured()) return facets ? { ...empty, facets: emptyFacets() } : empty;

  const { categories, byId, base } = await loadVisibility();
  const conditions = buildConditions(filters, { locale, categories });
  const paging = pageParams({ page, pageSize: Math.min(Math.max(1, Number(pageSize) || 1), MAX_PAGE_SIZE) });
  const sortSpec = SORTS[SORT_OPTIONS.includes(sort) ? sort : DEFAULT_SORT];

  const facetStages = {
    results: [{ $match: matchAll(conditions) }, SORT_FIELDS, { $sort: sortSpec }, { $skip: paging.skip }, { $limit: paging.pageSize }],
    total: [{ $match: matchAll(conditions) }, { $count: 'count' }],
  };
  if (facets) {
    facetStages.categories = [
      { $match: matchAll(conditions, 'category') },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ];
    facetStages.prices = [
      { $match: matchAll(conditions, 'price') },
      {
        $group: {
          _id: null,
          any: { $sum: 1 },
          ...Object.fromEntries(
            PRICE_RANGES.map((range) => [range.id, { $sum: { $cond: [anyVariantInRange(range), 1, 0] } }])
          ),
        },
      },
    ];
    facetStages.sizes = [
      { $match: matchAll(conditions, 'sizes') },
      { $project: { keys: { $setUnion: ['$variants.key', []] } } },
      { $unwind: '$keys' },
      { $group: { _id: '$keys', count: { $sum: 1 } } },
    ];
    // Size filter options: any size offered by at least two products.
    facetStages.sizeOptions = [
      { $unwind: '$variants' },
      { $group: { _id: '$variants.key', label: { $first: '$variants.label' }, products: { $addToSet: '$_id' } } },
      { $match: { 'products.1': { $exists: true } } },
      { $project: { label: 1 } },
    ];
  }

  const [result] = await Product.aggregate([{ $match: base }, { $facet: facetStages }]);
  const output = pageResult(
    result.results.map((doc) => localizeProduct(doc, byId, locale)),
    result.total[0]?.count ?? 0,
    paging
  );
  if (!facets) return output;

  const categoryCounts = Object.fromEntries(result.categories.map((row) => [toId(row._id) ?? 'none', row.count]));
  categoryCounts.all = result.categories.reduce((sum, row) => sum + row.count, 0);
  const { _id: _ignored, ...priceCounts } = result.prices[0] ?? { any: 0 };

  return {
    ...output,
    facets: {
      category: categoryCounts,
      price: { any: 0, ...priceCounts },
      size: Object.fromEntries(result.sizes.map((row) => [row._id, row.count])),
      sizes: result.sizeOptions
        .map((row) => ({ id: row._id, label: pickLocalized(row.label, locale) }))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })),
    },
  };
}

function emptyFacets() {
  return { category: { all: 0 }, price: { any: 0 }, size: {}, sizes: [] };
}

/** Visible categories with the number of products in each, localized. */
export const getStoreCategories = cache(async (locale) => {
  if (!isDatabaseConfigured()) return [];
  try {
    const { categories, base } = await loadVisibility();
    const counts = await Product.aggregate([{ $match: base }, { $group: { _id: '$category', count: { $sum: 1 } } }]);
    const countById = new Map(counts.map((row) => [toId(row._id), row.count]));
    return categories.map((category) => ({
      ...localizeCategory(category, locale),
      count: countById.get(toId(category._id)) ?? 0,
    }));
  } catch (error) {
    console.error('[storefront] Database unavailable:', error.message);
    return [];
  }
});

function localizeCategory(category, locale) {
  return {
    id: toId(category._id),
    slug: categorySlug(category),
    image: category.image?.url ?? PLACEHOLDER_IMAGE,
    name: pickLocalized(category.name, locale),
    description: pickLocalized(category.description, locale),
    updatedAt: toIso(category.updatedAt),
  };
}

/**
 * One visible category by its page slug, localized, or null. Unlike getStoreCategories this
 * throws when the database is unreachable, so a category page fails (500) instead of answering 404.
 */
export const getStoreCategory = cache(async (slug, locale) => {
  if (!isDatabaseConfigured() || !slug) return null;
  const { categories, base } = await loadVisibility();
  const category = categories.find((item) => categorySlug(item) === slug);
  if (!category) return null;
  const count = await Product.countDocuments({ $and: [base, { category: category._id }] });
  return { ...localizeCategory(category, locale), count };
});

/** Slug and last change of every visible category that has products, for the sitemap. */
export async function getCategorySlugs() {
  if (!isDatabaseConfigured()) return [];
  const { categories, base } = await loadVisibility();
  const filled = new Set((await Product.distinct('category', base)).map(toId));
  return categories
    .filter((category) => filled.has(toId(category._id)))
    .map((category) => ({ slug: categorySlug(category), updatedAt: toIso(category.updatedAt) }));
}

/** Languages a product has been translated into (its name is filled in). English is always present. */
const translatedLocales = (doc) => localeCodes.filter((code) => code === defaultLocale || Boolean(doc.name?.[code]?.trim()));

/** One visible product by its page slug, localized, or null. `locales`: the languages it is translated into. */
export const getStoreProduct = cache(async (slug, locale) => {
  if (!isDatabaseConfigured() || !slug) return null;
  const { byId, base } = await loadVisibility();
  const doc = await Product.findOne({ $and: [base, { slug: String(slug) }] }).lean();
  return doc ? { ...localizeProduct(doc, byId, locale), updatedAt: toIso(doc.updatedAt), locales: translatedLocales(doc) } : null;
});

/** Up to `limit` other products from the same category, in stock first. */
export async function getRelatedProducts(product, locale, limit = 4) {
  if (!product.category) return [];
  const { items } = await searchStoreProducts({ locale, category: product.category, sort: 'popularity', pageSize: limit + 1 });
  return items.filter((item) => item.id !== product.id).slice(0, limit);
}

/** Slug, last change and translated languages of every visible product, for the sitemap and static generation. */
export async function getProductSlugs() {
  if (!isDatabaseConfigured()) return [];
  const { base } = await loadVisibility();
  const docs = await Product.find({ $and: [base, { slug: { $exists: true, $nin: ['', null] } }] }, { slug: 1, name: 1, updatedAt: 1 }).lean();
  return docs.map((doc) => ({ slug: doc.slug, updatedAt: toIso(doc.updatedAt), locales: translatedLocales(doc) }));
}

/**
 * Products highlighted in the storefront, chosen in the admin via badges:
 * "Signature" for the hero card and mega menu, "Gift favourite" for the gifting banner.
 */
export const getSpotlightProducts = cache(async (locale) => {
  if (!isDatabaseConfigured()) return { signature: null, gift: null };
  try {
    const { byId, base } = await loadVisibility();
    const available = { $and: [base, { inStock: true }] };
    const order = { soldCount: -1, createdAt: -1 };
    const signature =
      (await Product.findOne({ $and: [available, { badge: 'signature' }] }).sort(order).lean()) ??
      (await Product.findOne({ $and: [available, { featured: true }] }).sort(order).lean());
    const gift = await Product.findOne({
      $and: [available, { badge: 'gift' }, ...(signature ? [{ _id: { $ne: signature._id } }] : [])],
    })
      .sort(order)
      .lean();
    return {
      signature: signature ? localizeProduct(signature, byId, locale) : null,
      gift: gift ? localizeProduct(gift, byId, locale) : null,
    };
  } catch (error) {
    console.error('[storefront] Database unavailable:', error.message);
    return { signature: null, gift: null };
  }
});
