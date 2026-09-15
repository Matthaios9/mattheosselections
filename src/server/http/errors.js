import 'server-only';

/**
 * Errors thrown inside API route handlers. `withApi` turns them into
 * `{ error: { code, message, fieldErrors? } }` JSON with the matching HTTP status.
 * `code` is machine-readable (the storefront translates it), `message` is for the admin UI.
 */
export class ApiError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = extra.fieldErrors;
    this.details = extra.details;
  }
}

/** Flatten zod issues into `{ 'name.en': 'message' }` for form field errors. */
export function toFieldErrors(zodError) {
  const out = {};
  for (const issue of zodError.issues) {
    const key = issue.path.join('.');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export const badRequest = (message = 'Invalid request.', code = 'bad-request', extra) =>
  new ApiError(400, code, message, extra);

export const unauthorized = (message = 'Please sign in to continue.', code = 'unauthorized') =>
  new ApiError(401, code, message);

export const forbidden = (message = 'You are not allowed to do this.', code = 'forbidden') =>
  new ApiError(403, code, message);

export const notFound = (message = 'Not found.', code = 'not-found') => new ApiError(404, code, message);

export const conflict = (message, code = 'conflict', extra) => new ApiError(409, code, message, extra);

export const unavailable = (message = 'This service is not available right now.', code = 'unavailable') =>
  new ApiError(503, code, message);

export const validationError = (zodError, message = 'Please fix the highlighted fields.') =>
  new ApiError(422, 'validation', message, { fieldErrors: toFieldErrors(zodError) });
