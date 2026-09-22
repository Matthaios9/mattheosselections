import { startSession, toPublicUser } from '@/server/auth/dal';
import { authenticate } from '@/server/domain/users';
import { forbidden, parseBody, unauthorized, withApi } from '@/server/http';
import { credentialsInput } from '@/server/validation';

/** POST /api/auth/login — storefront sign-in (sets the httpOnly session cookie). */
export const POST = withApi(async ({ request }) => {
  const { email, password, remember } = await parseBody(request, credentialsInput);
  const result = await authenticate(email, password);
  if (!result.ok && result.reason === 'disabled') throw forbidden('This account has been disabled.', 'disabled');
  if (!result.ok) throw unauthorized('Invalid email or password.', 'invalid');
  await startSession(result.user, { remember });
  return { user: toPublicUser(result.user) };
}, { rateLimit: { name: 'login', limit: 10, window: 600 } });
