import 'server-only';
import { escapeRegex } from './utils';

/** Every accented form a plain letter should match ("a" also finds "å", "ά"…). */
const LETTER_VARIANTS = {
  a: 'aàáâãäåāą',
  c: 'cçćč',
  e: 'eèéêëēęě',
  i: 'iìíîïī',
  n: 'nñń',
  o: 'oòóôõöøō',
  s: 'sśš',
  u: 'uùúûüūů',
  y: 'yýÿ',
  z: 'zźżž',
  α: 'αά',
  ε: 'εέ',
  η: 'ηή',
  ι: 'ιίϊΐ',
  ο: 'οό',
  υ: 'υύϋΰ',
  ω: 'ωώ',
  σ: 'σς',
};

export const normalizeText = (value) =>
  String(value ?? '')
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/** Search words of a query: lower-cased, accents removed ("Θυμαρίσιο  μέλι" → ["θυμαρισιο", "μελι"]). */
export const searchWords = (query) => normalizeText(query).trim().split(/\s+/).filter(Boolean);

/**
 * Case- and accent-insensitive "contains" regex for one search word, usable in
 * MongoDB queries and in JS: "θυμαρισιο" matches "Θυμαρίσιο", "honung" matches "Honung".
 */
export function accentInsensitiveRegex(word) {
  const pattern = [...normalizeText(word)]
    .map((char) => (LETTER_VARIANTS[char] ? `[${LETTER_VARIANTS[char]}]` : escapeRegex(char)))
    .join('');
  return new RegExp(pattern, 'i');
}
