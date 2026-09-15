import { GetApiData } from './api';

/** Dashboard figures: revenue, order/customer/product totals, 14-day series, top products, stock alerts. */
export const getDashboardStats = async () => {
  const { data } = await GetApiData('/admin/stats', 'GET');
  return data;
};

/** Orders per status: `{ all, pending, processing, … }` (tabs and the sidebar badge). */
export const getOrderCounts = async () => {
  const { data } = await GetApiData('/admin/stats/orders', 'GET');
  return data;
};
