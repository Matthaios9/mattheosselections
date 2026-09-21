/** Replace `{name}` placeholders with values: interpolate('Hi {name}', { name: 'Anna' }) */
export function interpolate(template, values) {
  if (typeof template !== 'string' || !values) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match));
}

/**
 * Like `interpolate`, but the values may be React elements (e.g. links inside a sentence):
 * returns the pieces as an array to render.
 */
export function interpolateParts(template, values) {
  return String(template)
    .split(/\{(\w+)\}/g)
    .map((part, index) => (index % 2 === 1 && part in values ? values[part] : part));
}

/** Resolve a dotted key ('cart.title') against a dictionary. */
function resolve(dict, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict);
}

/**
 * Build a `t(key, values)` function for a dictionary. Works on both server and client.
 * Missing keys fall back to the key itself so gaps are visible during translation work.
 */
export function createTranslator(dict) {
  return function t(key, values) {
    const value = resolve(dict, key);
    if (value === undefined) {
      if (process.env.NODE_ENV !== 'production') console.warn(`[i18n] Missing translation: ${key}`);
      return key;
    }
    return typeof value === 'string' ? interpolate(value, values) : value;
  };
}
