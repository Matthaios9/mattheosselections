import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { connectToDatabase, isDatabaseConfigured } from '@/server/db';
import { User } from '@/server/models';
import { isAdminEmail } from './admins';
import { decodeSession, encodeSession, SESSION_COOKIE, SESSION_MAX_AGE, SESSION_MAX_AGE_REMEMBER } from './session';

/**
 * Data-access layer for authentication. Every admin page and API route goes
 * through here, so role/status changes take effect immediately
 * (the JWT alone is never trusted for authorization).
 */

export function toPublicUser(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

export const getSession = cache(async () => {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
});

/** The signed-in, active user (or null). Cached per request. */
export const getCurrentUser = cache(async () => {
  if (!isDatabaseConfigured()) return null;
  const session = await getSession();
  if (!session?.userId) return null;
  await connectToDatabase();
  const user = await User.findById(session.userId).lean();
  if (!user || user.status !== 'active') return null;
  return toPublicUser(user);
});

/**
 * The signed-in admin (or null). All three must hold on every request:
 * the session came from the Google admin sign-in, the account is an active admin,
 * and its email is still listed in ADMIN_EMAIL.
 */
export const getCurrentAdmin = cache(async () => {
  const session = await getSession();
  if (!session?.admin) return null;
  const user = await getCurrentUser();
  return user?.role === 'admin' && isAdminEmail(user.email) ? user : null;
});

/** For admin pages/layouts: redirect to the login screen unless an active admin is signed in. */
export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');
  return admin;
}

/** `admin: true` marks a session that may open the admin panel (Google admin sign-in only). */
export async function startSession(user, { remember = false, admin = false } = {}) {
  const maxAge = remember ? SESSION_MAX_AGE_REMEMBER : SESSION_MAX_AGE;
  const token = await encodeSession({ userId: user._id ?? user.id, role: user.role, admin }, maxAge);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
