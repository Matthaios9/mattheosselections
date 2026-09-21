import { GetApiData } from './api';

/* Storefront (public) ---------------------------------------------------------- */

/**
 * Catalogue search, filtered and paginated on the server.
 * params: { locale, q, category, price, sizes[], stock: 'in', featured, sort, page, pageSize, facets }
 * → { items, total, page, pageSize, pages, facets? }
 */
export const getStoreProducts = async (params) => {
  const { data } = await GetApiData('/products', 'GET', params, false);
  return data;
};

/** Specific products (e.g. the ones in the cart) with live stock, localized. */
export const getStoreProductsByIds = async (ids, locale) => {
  if (!ids.length) return [];
  const { data } = await GetApiData('/products', 'GET', { ids, locale }, false);
  return data.items;
};

/* Admin ----------------------------------------------------------------------- */

/** params: { q, category, status, stock, page } → { items, total, page, pageSize, pages } */
export const getAllProducts = async (params) => {
  const { data } = await GetApiData('/admin/products', 'GET', params);
  return data;
};

export const getProductById = async (id) => {
  const { data } = await GetApiData(`/admin/products/${id}`, 'GET');
  return data;
};

export const createProduct = async (product) => {
  const { data } = await GetApiData('/admin/products', 'POST', product);
  return data;
};

export const updateProduct = async (id, product) => {
  const { data } = await GetApiData(`/admin/products/${id}`, 'PUT', product);
  return data;
};

/** Quick toggles from the product list: `{ featured }` and/or `{ status }`. */
export const updateProductFlags = async (id, flags) => {
  const { data } = await GetApiData(`/admin/products/${id}`, 'PATCH', flags);
  return data;
};

export const deleteProduct = async (id) => {
  await GetApiData(`/admin/products/${id}`, 'DELETE');
};

/** Products that can go into a pack, with their sizes and stock → [{ id, name, status, defaultVariant, variants }] */
export const getPackChoices = async () => {
  const { data } = await GetApiData('/admin/products/pack-choices', 'GET');
  return data;
};
