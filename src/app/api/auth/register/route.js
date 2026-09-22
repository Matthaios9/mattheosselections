import { startSession, toPublicUser } from '@/server/auth/dal';
import { createUser } from '@/server/domain/users';
import { conflict, created, parseBody, withApi } from '@/server/http';
import { registerInput } from '@/server/validation';

/** POST /api/auth/register — create a customer account and sign it in. */
export const POST = withApi(async ({ request }) => {
  const data = await parseBody(request, registerInput);
  const result = await createUser({ ...data, role: 'customer' });
  if (!result.ok) {
    throw conflict('An account with this email already exists.', 'email-taken', {
      fieldErrors: { email: 'An account with this email already exists' },
    });
  }
  await startSession(result.user);
  return created({ user: toPublicUser(result.user) });
}, { rateLimit: { name: 'register', limit: 5, window: 3600 } });
