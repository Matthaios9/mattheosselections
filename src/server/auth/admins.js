import 'server-only';

/**
 * Admin allow-list from the environment: ADMIN_EMAIL (comma-separate several).
 * Admin panel access needs a Google sign-in with one of these emails *and* an
 * active admin account with that email in the database.
 */
export function adminEmails() {
  return (process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export const isAdminEmail = (email) => Boolean(email) && adminEmails().includes(String(email).toLowerCase());
