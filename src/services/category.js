import { GetApiData } from './api';

/** Admin category management. Storefront pages receive their categories from the server. */

export const getAllCategories = async () => {
  const { data } = await GetApiData('/admin/categories', 'GET');
  return data;
};

export const createCategory = async (category) => {
  const { data } = await GetApiData('/admin/categories', 'POST', category);
  return data;
};

export const updateCategory = async (id, category) => {
  const { data } = await GetApiData(`/admin/categories/${id}`, 'PUT', category);
  return data;
};

/** Resolves with `{ uncategorised }` — how many products were left without a category. */
export const deleteCategory = async (id) => {
  const { data } = await GetApiData(`/admin/categories/${id}`, 'DELETE');
  return data;
};
