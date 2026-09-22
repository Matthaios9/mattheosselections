import 'server-only';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getCurrentAdmin, getCurrentUser } from '@/server/auth/dal';
import { isDatabaseConfigured } from '@/server/db';
import { duplicateKeyField } from '@/server/utils';
import { fromSearchParams } from '@/utils/url';
import { ApiError, badRequest, forbidden, unauthorized, unavailable, validationError } from './errors';
import { enforceRateLimit } from './rate-limit';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const NO_STORE = { 'Cache-Control': 'no-store' };

export const json = (data, status = 200) => NextResponse.json(data, { status, headers: NO_STORE });
export const created = (data) => json(data, 201);

/** Changes may only come from this site (the session cookie is SameSite=Lax as a second line). */
function assertSameOrigin(request) {
  if (SAFE_METHODS.has(request.method)) return;
  const origin = request.headers.get('origin');
  if (!origin) return;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (new URL(origin).host !== host) throw forbidden('Cross-site request blocked.', 'cross-site');
}

/**
 * Secured routes need the session cookie *and* the X-Requested-With header that
 * the API client adds (services/api.js → AuthHeader). Browsers never send custom
 * headers cross-site without a CORS preflight, so this blocks CSRF.
 */
async function authenticate(request, auth) {
  if (auth === 'public') return null;
  if (!SAFE_METHODS.has(request.method) && request.headers.get('x-requested-with') !== 'XMLHttpRequest') {
    throw forbidden('Missing request header.', 'bad-client');
  }
  if (auth === 'admin') {
    const admin = await getCurrentAdmin();
    if (admin) return admin;
    throw (await getCurrentUser()) ? forbidden('Admin access is required.') : unauthorized();
  }
  const user = await getCurrentUser();
  if (!user) throw unauthorized();
  return user;
}

function errorResponse(error) {
  if (error instanceof ZodError) return errorResponse(validationError(error));
  if (error instanceof ApiError) {
    const body = { code: error.code, message: error.message };
    if (error.fieldErrors) body.fieldErrors = error.fieldErrors;
    if (error.details) body.details = error.details;
    return json({ error: body }, error.status);
  }
  const field = duplicateKeyField(error);
  if (field) {
    return json(
      { error: { code: 'duplicate', message: `That ${field} is already in use.`, fieldErrors: { [field]: 'Already in use' } } },
      409
    );
  }
  console.error('[api]', error);
  return json({ error: { code: 'server-error', message: 'Something went wrong. Please try again.' } }, 500);
}

/**
 * Wrap a Route Handler with the shared API behaviour:
 *   export const GET = withApi(async ({ query, params, user }) => data, { auth: 'admin' });
 *
 * - `auth`: 'public' | 'user' | 'admin' (checked against the database on every request)
 * - `rateLimit`: `{ name, limit, window }` — at most `limit` requests per IP per `window` seconds (429 above)
 * - the handler receives `{ request, params, query, user }` and returns plain data (→ 200 JSON)
 *   or a Response (e.g. `created(data)`); thrown ApiErrors become JSON error responses.
 */
export function withApi(handler, { auth = 'public', requireDatabase = true, rateLimit } = {}) {
  return async function route(request, context) {
    try {
      assertSameOrigin(request);
      if (requireDatabase && !isDatabaseConfigured()) throw unavailable('The database is not configured.');
      if (rateLimit && isDatabaseConfigured()) await enforceRateLimit(request, rateLimit);
      const user = await authenticate(request, auth);
      const params = (await context?.params) ?? {};
      const query = fromSearchParams(request.nextUrl.searchParams);
      const result = await handler({ request, params, query, user });
      return result instanceof Response ? result : json(result ?? { ok: true });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

/** The public origin of this request (honours proxy headers), e.g. for URLs sent to payment providers. */
export function requestOrigin(request) {
  const origin = request.headers.get('origin');
  if (origin) return origin;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  return `${request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')}://${host}`;
}

/** Read and validate a JSON body. Only `application/json` is accepted (HTML forms can't send it cross-site). */
export async function parseBody(request, schema) {
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
    throw new ApiError(415, 'unsupported-media-type', 'Send the request body as JSON.');
  }
  let body;
  try {
    body = await request.json();
  } catch {
    throw badRequest('The request body is not valid JSON.');
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw validationError(parsed.error);
  return parsed.data;
}
