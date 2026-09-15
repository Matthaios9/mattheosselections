import { GetApiData } from './api';

/** params: { q, status, page } → { items, total, page, pageSize, pages } */
export const getAllOrders = async (params) => {
  const { data } = await GetApiData('/admin/orders', 'GET', params);
  return data;
};

export const getOrderById = async (id) => {
  const { data } = await GetApiData(`/admin/orders/${id}`, 'GET');
  return data;
};

/** Cancelling returns the items to stock; reopening takes them again (fails with 'insufficient-stock'). */
export const updateOrderStatus = async (id, { status, note = '' }) => {
  const { data } = await GetApiData(`/admin/orders/${id}`, 'PATCH', { status, note });
  return data;
};

export const updatePaymentStatus = async (id, paymentStatus) => {
  const { data } = await GetApiData(`/admin/orders/${id}`, 'PATCH', { paymentStatus });
  return data;
};

export const updateAdminNote = async (id, adminNote) => {
  const { data } = await GetApiData(`/admin/orders/${id}`, 'PATCH', { adminNote });
  return data;
};
