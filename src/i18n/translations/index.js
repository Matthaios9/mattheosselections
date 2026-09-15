import en from './en';
import sv from './sv';
import el from './el';

/**
 * Every UI string lives here, keyed by locale code. Components never hardcode
 * copy — they read it through `useI18n()` (client) or `getDictionary()` (server).
 * Replacing the placeholder copy with the client's final translations only
 * touches these files.
 */
export const translations = { en, sv, el };
