import { GetApiData } from './api';

/* Storefront (public) ---------------------------------------------------------- */

/** "Notify me when available": `{ productId, variantKey, email, locale }` — rejects with 'in-stock' or 'validation'. */
export const subscribeStockAlert = async (values) => {
  await GetApiData('/stock-alerts', 'POST', values, false);
};

/* Admin ----------------------------------------------------------------------- */

/** params: { status, q, product, page } → { items, total, page, pageSize, pages, waiting, emailConfigured } */
export const getStockAlerts = async (params) => {
  const { data } = await GetApiData('/admin/stock-alerts', 'GET', params);
  return data;
};

/** Email everyone whose size is back in stock now → { sent, failed, due, configured }. */
export const sendStockAlertEmails = async () => {
  const { data } = await GetApiData('/admin/stock-alerts', 'POST', {});
  return data;
};

export const deleteStockAlert = async (id) => {
  await GetApiData(`/admin/stock-alerts/${id}`, 'DELETE');
};
