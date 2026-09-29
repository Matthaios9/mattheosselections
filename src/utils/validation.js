/** True when the text holds a digit, in any script — names are letters only. */
export const hasDigit = (value) => /\p{Nd}/u.test(String(value));

/** Longest values the contact form accepts — shared by the form and the API so they never disagree. */
export const NAME_MAX_LENGTH = 60;
export const CONTACT_SUBJECT_MAX_LENGTH = 200;
export const CONTACT_MESSAGE_MAX_LENGTH = 5000;

/**
 * Letters in any script (with accents), plus the spaces, apostrophes, hyphens and dots
 * real names use ("Anne-Marie", "O'Brien", "J. Smith"). Must start with a letter.
 */
export const isPersonName = (value) => /^\p{L}[\p{L}\p{M}' ’.-]*$/u.test(String(value).trim().replace(/\s+/g, ' '));

export const PASSWORD_MIN_LENGTH = 8;

/**
 * At least PASSWORD_MIN_LENGTH characters with an uppercase letter, a lowercase letter,
 * a number and a symbol — e.g. "Strong@2026". Shared by the forms and the API.
 */
export const isStrongPassword = (value) => {
  const text = String(value);
  return (
    text.length >= PASSWORD_MIN_LENGTH &&
    /\p{Lu}/u.test(text) &&
    /\p{Ll}/u.test(text) &&
    /\p{Nd}/u.test(text) &&
    /[^\p{L}\p{N}\s]/u.test(text)
  );
};

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
export const maxLength = (length, key) => (value) => (String(value).trim().length <= length ? null : key);
export const minLength = (length, key) => (value) => (String(value).trim().length >= length ? null : key);
/** Must equal another field, e.g. `matches('password', 'auth.errors.passwordMatch')` for a confirmation. */
export const matches = (otherField, key) => (value, values) => (value === values[otherField] ? null : key);
/** Password strength (see `isStrongPassword`). */
export const strongPassword = (key) => (value) => (isStrongPassword(value) ? null : key);
/** No digits allowed, e.g. in a person's name. */
export const noDigits = (key) => (value) => (hasDigit(value) ? key : null);
/** Only the characters a person's name uses (see `isPersonName`). */
export const personName = (key) => (value) => (isPersonName(value) ? null : key);
