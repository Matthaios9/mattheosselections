'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '@/services/auth';
import { getErrorCode } from '@/utils/errors';

const AuthContext = createContext(null);

/**
 * Storefront customer session. Credentials are checked by the auth API (bcrypt +
 * httpOnly JWT cookie); the current user is restored from /api/auth/me so pages
 * stay statically renderable.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;
    authService
      .getCurrentUser()
      .then((current) => {
        if (active) setUser(current);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  /** Resolves to `{ ok: true, user }` or `{ ok: false, error: code }` for translated messages. */
  const attempt = async (request) => {
    try {
      const signedIn = await request();
      setUser(signedIn);
      return { ok: true, user: signedIn };
    } catch (error) {
      return { ok: false, error: getErrorCode(error) };
    }
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    login: (values) => attempt(() => authService.login(values)),
    signup: (values) => attempt(() => authService.register(values)),
    /** Finish a "forgot password" link: sets the new password and signs the customer in. */
    resetPassword: (values) => attempt(() => authService.resetPassword(values)),
    logout: async () => {
      setUser(null);
      await authService.logout().catch(() => {});
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
