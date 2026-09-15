/**
 * Turn anything thrown by an API call into a message for the UI.
 * API errors carry `{ code, message, fieldErrors }` (see services/api.js).
 */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
}

/** Field errors from a failed API validation (`{ 'name.en': 'Required' }`). */
export const getFieldErrors = (error) => error?.fieldErrors ?? {};

/** The machine-readable error code (e.g. 'email-taken'), used for translated storefront messages. */
export const getErrorCode = (error) => error?.code ?? 'unknown';
