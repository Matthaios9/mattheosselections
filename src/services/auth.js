import { GetApiData } from './api';

/** Authentication — the session is an httpOnly cookie set and cleared by these endpoints. */

/** Storefront sign-in. Rejects with code 'invalid' | 'disabled'. */
export const login = async ({ email, password, remember = false }) => {
  const { data } = await GetApiData('/auth/login', 'POST', { email, password, remember }, false);
  return data.user;
};

/** Create a customer account and sign it in. Rejects with code 'email-taken'. */
export const register = async ({ name, email, password }) => {
  const { data } = await GetApiData('/auth/register', 'POST', { name, email, password }, false);
  return data.user;
};

export const logout = async () => {
  await GetApiData('/auth/logout', 'POST', null, false);
};

/** The signed-in user or null. */
export const getCurrentUser = async () => {
  const { data } = await GetApiData('/auth/me', 'GET', null, false);
  return data.user ?? null;
};

/**
 * Admin panel sign-in with the ID token from the Sign in with Google button.
 * Rejects with code 'not-associated' when the Google account isn't an admin.
 */
export const adminGoogleLogin = async (credential) => {
  const { data } = await GetApiData('/admin/auth/google', 'POST', { credential }, false);
  return data.user;
};
