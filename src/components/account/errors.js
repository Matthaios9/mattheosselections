/** API error code → translated message key for the account forms. */
export function accountErrorKey(code) {
  if (code === 'unauthorized') return 'account.errors.signedOut';
  if (code === 'rate-limited') return 'account.errors.tooMany';
  return 'account.errors.unavailable';
}
