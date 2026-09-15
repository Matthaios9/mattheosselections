import { GetApiData } from './api';

/** params: { q, role, status, page } → { items, total, page, pageSize, pages } */
export const getAllUsers = async (params) => {
  const { data } = await GetApiData('/admin/users', 'GET', params);
  return data;
};

export const getUserById = async (id) => {
  const { data } = await GetApiData(`/admin/users/${id}`, 'GET');
  return data;
};

export const getUserOrders = async (id) => {
  const { data } = await GetApiData(`/admin/users/${id}/orders`, 'GET');
  return data.items;
};

/** values: { name, email, password, role } — rejects with 'email-taken'. */
export const createUser = async (values) => {
  await GetApiData('/admin/users', 'POST', values);
};

export const updateUserRole = async (id, role) => {
  const { data } = await GetApiData(`/admin/users/${id}`, 'PATCH', { role });
  return data;
};

export const updateUserStatus = async (id, status) => {
  const { data } = await GetApiData(`/admin/users/${id}`, 'PATCH', { status });
  return data;
};

export const deleteUser = async (id) => {
  await GetApiData(`/admin/users/${id}`, 'DELETE');
};
