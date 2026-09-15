export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());

/**
 * Tiny rule-based validator: rules = { field: [(value, values) => errorKey | null] }.
 * Returns `{ field: errorKey }` for every failing field.
 */
export function validate(values, rules) {
  const errors = {};
  for (const [field, checks] of Object.entries(rules)) {
    for (const check of checks) {
      const error = check(values[field] ?? '', values);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }
  return errors;
}

export const required = (key) => (value) => (String(value).trim() ? null : key);
export const email = (key) => (value) => (isEmail(value) ? null : key);
export const minLength = (length, key) => (value) => (String(value).trim().length >= length ? null : key);
/** Must equal another field, e.g. `matches('password', 'auth.errors.passwordMatch')` for a confirmation. */
export const matches = (otherField, key) => (value, values) => (value === values[otherField] ? null : key);
