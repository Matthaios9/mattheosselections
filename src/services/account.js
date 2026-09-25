import { GetApiData } from './api';

/** The signed-in customer's own account (Account page). All calls need the session cookie. */

/** Change the name. Resolves with the updated user. */
export const updateProfile = async ({ name }) => {
  const { data } = await GetApiData('/account/profile', 'PATCH', { name });
  return data.user;
};

/** Set a new password. Rejects with code 'wrong-password' when the current one doesn't match. */
export const changePassword = async ({ currentPassword, newPassword }) => {
  await GetApiData('/account/password', 'POST', { currentPassword, newPassword });
};

/** The customer's orders, newest first. */
export const getMyOrders = async () => {
  const { data } = await GetApiData('/account/orders', 'GET');
  return data.items;
};
