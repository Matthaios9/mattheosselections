import axios from 'axios';
import { toQueryString } from '@/utils/url';

/**
 * Central HTTP client for the browser. Every client-side API call goes through
 * `GetApiData`, so the base URL, headers, credentials and error handling are
 * configured in exactly one place. Endpoints live in the service modules next
 * to this file (product.js, order.js, …).
 *
 * Server Components don't call the API over HTTP — they read through
 * src/server/domain, the same layer the API routes use.
 */

const client = axios.create({
  timeout: 20000,
  withCredentials: true,
  headers: { Accept: 'application/json' },
  paramsSerializer: { serialize: toQueryString },
});

/** Normalised API failure: `code` (machine-readable), `message`, optional `fieldErrors` / `details`. */
export class ApiError extends Error {
  constructor({ status = 0, code = 'unknown', message, fieldErrors, details }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.details = details;
  }
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    const status = error.response?.status ?? 0;
    const body = error.response?.data?.error;
    return Promise.reject(
      new ApiError({
        status,
        code: body?.code ?? (status ? 'http-error' : 'network-error'),
        message:
          body?.message ??
          (status ? 'Something went wrong. Please try again.' : 'Could not reach the server. Check your connection.'),
        fieldErrors: body?.fieldErrors,
        details: body?.details,
      })
    );
  }
);

/**
 * Headers for secured requests. The session token itself lives in an httpOnly
 * cookie that JavaScript can never read (so XSS can't steal it); this header
 * marks the request as coming from our own client, which the API requires on
 * secured routes (CSRF protection).
 */
export function AuthHeader() {
  return { 'X-Requested-With': 'XMLHttpRequest' };
}

/**
 * GetApiData(endpoint, method, payload, secured)
 *  - endpoint: path after `/api`, e.g. '/admin/products/123'
 *  - method:   'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' ('' = GET)
 *  - payload:  query params for GET requests, JSON body otherwise
 *  - secured:  pass `false` for public endpoints; otherwise the auth headers are sent
 * Resolves with the axios response; rejects with an `ApiError`.
 */
export const GetApiData = async (endpoint, method = 'GET', payload = null, secured = true) => {
  const headers = AuthHeader();
  const apiOptions = { url: `/api${endpoint}` };

  if (method !== '') apiOptions.method = method;
  if (payload != null) {
    if (!method || method.toUpperCase() === 'GET') apiOptions.params = payload;
    else apiOptions.data = payload;
  }
  if (secured !== false) apiOptions.headers = headers;

  return await client(apiOptions);
};
