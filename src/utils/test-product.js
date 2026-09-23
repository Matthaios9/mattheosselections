/**
 * The product used to try real payments end to end: sold without VAT, and an order of only this
 * product ships free. It is recognised by its name, "Test Product" in any language (case and
 * surrounding spaces ignored), so renaming it in the admin makes it an ordinary product again.
 */
const TEST_PRODUCT_NAME = 'test product';

/** `name` is a product's localized name (`{ sv, en, el }`) or a plain string. */
export function isTestProduct(name) {
  const names = typeof name === 'string' ? [name] : Object.values(name ?? {});
  return names.some((value) => String(value ?? '').trim().toLowerCase() === TEST_PRODUCT_NAME);
}
