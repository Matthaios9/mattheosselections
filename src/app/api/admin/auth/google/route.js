import { startSession, toPublicUser } from '@/server/auth/dal';
import { adminEmails } from '@/server/auth/admins';
import { isGoogleConfigured, verifyGoogleIdToken } from '@/server/auth/google';
import { authenticateGoogleAdmin } from '@/server/domain/users';
import { forbidden, parseBody, unauthorized, unavailable, withApi } from '@/server/http';
import { googleCredentialInput } from '@/server/validation';

/**
 * POST /api/admin/auth/google — the only way into the admin panel.
 * Body: { credential } (the ID token from the Sign in with Google button).
 * The Google account must be verified, listed in ADMIN_EMAIL and belong to an active admin account.
 */
export const POST = withApi(async ({ request }) => {
  if (!isGoogleConfigured()) throw unavailable('Google sign-in is not configured.', 'google-not-configured');
  if (!adminEmails().length) throw unavailable('No admin email is configured (ADMIN_EMAIL).', 'admin-not-configured');

  const { credential } = await parseBody(request, googleCredentialInput);
  const google = await verifyGoogleIdToken(credential);
  if (!google) throw unauthorized('Google sign-in failed. Please try again.', 'invalid-google-token');

  const result = await authenticateGoogleAdmin(google.email);
  if (!result.ok && result.reason === 'disabled') throw forbidden('This admin account has been disabled.', 'disabled');
  if (!result.ok) {
    throw forbidden(`${google.email} is not associated with an admin account.`, 'not-associated');
  }

  await startSession(result.user, { admin: true });
  return { user: toPublicUser(result.user) };
});
