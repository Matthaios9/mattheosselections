import 'server-only';
import { Resolver } from 'node:dns/promises';

/**
 * Can this address's domain receive email at all? Catches typos such as "gmail.con" or made-up
 * domains, which pass a format check but would never get our email.
 *
 * A domain qualifies with an MX record, or (per RFC 5321) an A/AAAA record when it has no MX.
 * Only a definite "no such domain / no mail servers" answer fails: if DNS itself is slow or
 * down, the address is let through rather than turning a customer away.
 */

const NO_RECORDS = new Set(['ENOTFOUND', 'ENODATA', 'ENONAME']);

const resolver = new Resolver({ timeout: 3000, tries: 1 });

/** The records `lookup` finds, or [] when DNS answers that there are none. Other failures throw. */
async function records(lookup) {
  try {
    return await lookup();
  } catch (error) {
    if (NO_RECORDS.has(error.code)) return [];
    throw error;
  }
}

export async function canReceiveEmail(email) {
  const domain = String(email).split('@').pop().trim().toLowerCase();
  if (!domain) return false;
  try {
    const mx = await records(() => resolver.resolveMx(domain));
    // A "null MX" (a single record with an empty exchange) means the domain accepts no email.
    if (mx.length) return !(mx.length === 1 && !mx[0].exchange);
    const [v4, v6] = await Promise.all([records(() => resolver.resolve4(domain)), records(() => resolver.resolve6(domain))]);
    return v4.length > 0 || v6.length > 0;
  } catch {
    return true;
  }
}
