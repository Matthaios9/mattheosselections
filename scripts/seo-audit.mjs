/**
 * SEO and migration audit. Requests the site the way a search engine does (no cookies, no
 * Accept-Language, redirects followed one hop at a time) and writes CSV reports and a summary.
 *
 *   npm run build && npm start                                        # then, in another terminal:
 *   npm run seo:audit                                                 # audits http://localhost:3000
 *   npm run seo:audit -- --base https://www.mattheosselections.com --hosts   # audits production
 *
 *   --base    server to audit (default http://localhost:3000)
 *   --site    canonical origin every page must declare (default https://www.mattheosselections.com)
 *   --legacy  CSV of old WordPress URLs, `url,type,source` (default docs/migration-qa/legacy-urls.csv).
 *             Paste URLs from Search Console exports into it to check them too.
 *   --out     report directory (default docs/migration-qa/results)
 *   --hosts   also check the http/https × www/non-www variants (production only)
 *
 * Reports: legacy-redirects.csv, pages.csv, links.csv, sitemap.csv, structured-data.csv,
 * status-codes.csv and summary.md. Exits with code 1 when it finds problems.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((arg, i, all) => (arg.startsWith('--') ? [[arg.slice(2), all[i + 1]?.startsWith('--') ? true : (all[i + 1] ?? true)]] : []))
);
const BASE = new URL(args.base ?? 'http://localhost:3000').origin;
const SITE = new URL(args.site ?? 'https://www.mattheosselections.com').origin;
const OUT = args.out ?? 'docs/migration-qa/results';
const LEGACY = args.legacy ?? 'docs/migration-qa/legacy-urls.csv';
const LOCALES = ['en', 'sv', 'el'];
const MAX_PAGES = 2000;
const UA = 'MattheosSelections-SEO-Audit/1.0';

/* HTTP ---------------------------------------------------------------------- */

const responses = new Map();

/** One request, redirects not followed. Cached per URL (and per extra headers). */
function get(url, headers = {}) {
  const key = `${url} ${JSON.stringify(headers)}`;
  if (!responses.has(key)) {
    responses.set(
      key,
      (async () => {
        for (let attempt = 1; ; attempt += 1) {
          try {
            const res = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': UA, ...headers } });
            const type = res.headers.get('content-type') ?? '';
            const body = /html|xml|json|text/.test(type) ? await res.text() : (await res.arrayBuffer(), '');
            return {
              url,
              status: res.status,
              location: res.headers.get('location') ? new URL(res.headers.get('location'), url).href : null,
              type,
              robotsHeader: res.headers.get('x-robots-tag') ?? '',
              vary: res.headers.get('vary') ?? '',
              body,
            };
          } catch (error) {
            if (attempt === 3) return { url, status: `error: ${error.cause?.code ?? error.message}`, location: null, type: '', robotsHeader: '', vary: '', body: '' };
          }
        }
      })()
    );
  }
  return responses.get(key);
}

/** Follow redirects hop by hop: `{ hops: [{ url, status, location }], final }`. */
async function follow(url, headers) {
  const hops = [];
  let current = url;
  for (let i = 0; i < 10; i += 1) {
    const res = await get(current, headers);
    if (!res.location || typeof res.status !== 'number' || res.status < 300 || res.status > 399) return { hops, final: res };
    hops.push({ url: current, status: res.status, location: res.location });
    if (hops.some((hop) => hop.url === toBase(res.location))) return { hops, final: { ...res, status: 'redirect loop' } };
    current = toBase(res.location);
  }
  return { hops, final: { url: current, status: 'too many redirects' } };
}

/** A canonical-host URL → the same URL on the audited server (identity in production). */
function toBase(url) {
  const u = new URL(url, BASE);
  return u.origin === SITE || u.origin === BASE ? `${BASE}${u.pathname}${u.search}` : u.href;
}
/** A URL on the audited server → how it reads on the canonical host (for reports). */
function toSite(url) {
  if (!url) return '';
  const u = new URL(url, BASE);
  return u.origin === BASE ? `${SITE}${u.pathname}${u.search}` : u.href;
}
const isInternal = (url) => [BASE, SITE].includes(new URL(url).origin);

async function pool(items, size, task) {
  const results = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await task(items[index], index);
      }
    })
  );
  return results;
}

/* HTML ---------------------------------------------------------------------- */

const decode = (text) =>
  String(text ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));

function attributes(source) {
  const out = {};
  for (const [, key, value] of source.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) out[key.toLowerCase()] = decode(value);
  return out;
}

const textOf = (html) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

function parsePage(html) {
  const tags = [...html.matchAll(/<(meta|link)\b([^>]*)>/gi)].map(([, tag, attrs]) => ({ tag: tag.toLowerCase(), ...attributes(attrs) }));
  const meta = (key, value) => tags.find((tag) => tag.tag === 'meta' && tag[key]?.toLowerCase() === value)?.content ?? '';
  const withoutSvg = html.replace(/<svg[\s\S]*?<\/svg>/gi, '');
  const jsonLd = [];
  for (const [, json] of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      jsonLd.push(...[JSON.parse(json)].flat());
    } catch {
      jsonLd.push({ '@type': 'INVALID JSON' });
    }
  }
  return {
    title: textOf(withoutSvg.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ''),
    description: meta('name', 'description'),
    robots: meta('name', 'robots'),
    h1: [...withoutSvg.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => textOf(match[1])),
    canonical: tags.find((tag) => tag.tag === 'link' && tag.rel === 'canonical')?.href ?? '',
    alternates: Object.fromEntries(tags.filter((tag) => tag.tag === 'link' && tag.rel === 'alternate' && tag.hreflang).map((tag) => [tag.hreflang, tag.href])),
    ogUrl: meta('property', 'og:url'),
    ogTitle: meta('property', 'og:title'),
    ogImage: meta('property', 'og:image'),
    links: [...html.matchAll(/<a\b([^>]*)>/gi)].map((match) => attributes(match[1]).href).filter(Boolean),
    jsonLd,
    // The price shown on a product page ("1 900 kr", "249 kr").
    shownPrice: Number(html.match(/class="[^"]*price[^"]*"[^>]*>\s*([\d\s., ]+?)\s*kr/)?.[1]?.replace(/[^\d]/g, '') || NaN),
  };
}

const isNoindex = (res, page) => /noindex/i.test(res.robotsHeader) || /noindex/i.test(page?.robots ?? '');

/* Reports ------------------------------------------------------------------- */

const csvCell = (value) => {
  const text = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
async function writeCsv(name, rows) {
  if (!rows.length) return writeFile(`${OUT}/${name}`, '');
  const columns = Object.keys(rows[0]);
  const lines = [columns.join(','), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(','))];
  await writeFile(`${OUT}/${name}`, `${lines.join('\n')}\n`);
}

function parseCsv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/).slice(1)) {
    if (!line.trim()) continue;
    const cells = [...line.matchAll(/("([^"]|"")*"|[^,]*)(,|$)/g)].map((match) => match[1].replace(/^"|"$/g, '').replace(/""/g, '"'));
    rows.push({ url: cells[0], type: cells[1] ?? '', source: cells[2] ?? '' });
  }
  return rows;
}

const problems = [];
const problem = (area, message) => problems.push({ area, message });

/* 1. Site crawl --------------------------------------------------------------- */

async function crawl() {
  const pages = new Map(); // url → { res, page }
  const linkSources = new Map(); // url → Set of pages linking to it
  const seen = new Set();
  let queue = LOCALES.map((code) => `${BASE}/${code}`);
  queue.forEach((url) => seen.add(url));

  while (queue.length && pages.size < MAX_PAGES) {
    const found = [];
    await pool(queue, 6, async (url) => {
      const res = await get(url);
      const page = res.status === 200 && res.type.includes('html') ? parsePage(res.body) : null;
      pages.set(url, { res, page });
      if (res.location && isInternal(res.location)) found.push(toBase(res.location));
      for (const href of page?.links ?? []) {
        if (/^(mailto|tel|javascript):|^#/.test(href)) continue;
        const target = new URL(href, url);
        target.hash = '';
        if (!isInternal(target.href) || /^\/(api|admin|_next)(\/|$)/.test(target.pathname)) continue;
        const link = toBase(target.href);
        if (!linkSources.has(link)) linkSources.set(link, new Set());
        linkSources.get(link).add(url);
        found.push(link);
      }
    });
    queue = [...new Set(found)].filter((url) => !seen.has(url));
    queue.forEach((url) => seen.add(url));
  }
  return { pages, linkSources };
}

/* 2. Page checks ------------------------------------------------------------------ */

async function checkPages(pages) {
  const rows = [];
  const indexable = [];
  for (const [url, { res, page }] of pages) {
    if (!page) continue;
    const issues = [];
    const self = toSite(url);
    const noindex = isNoindex(res, page);
    const canonical = page.canonical ? toSite(page.canonical) : '';
    const isCanonical = canonical === self;
    const status = { indexable: !noindex && isCanonical, noindex, canonical };

    if (!page.title) issues.push('missing title');
    if (!page.description) issues.push('missing meta description');
    if (page.h1.length === 0) issues.push('no H1');
    if (page.h1.length > 1) issues.push(`${page.h1.length} H1s`);
    if (!page.canonical) issues.push('no canonical');
    else if (!page.canonical.startsWith(`${SITE}/`)) issues.push(`canonical not on ${SITE}`);
    if (page.canonical && !isCanonical) {
      const target = await follow(toBase(page.canonical));
      if (target.hops.length || target.final.status !== 200) issues.push(`canonical → ${target.hops[0]?.status ?? target.final.status}`);
      const [, selfLocale] = new URL(self).pathname.split('/');
      const [, canonicalLocale] = new URL(canonical).pathname.split('/');
      if (selfLocale !== canonicalLocale) issues.push('canonical points to another language');
    }
    if (status.indexable) {
      for (const code of LOCALES) if (!page.alternates[code]) issues.push(`hreflang ${code} missing`);
      if (!page.alternates['x-default']) issues.push('hreflang x-default missing');
      for (const [lang, href] of Object.entries(page.alternates)) {
        if (!href.startsWith(`${SITE}/`)) issues.push(`hreflang ${lang} not on ${SITE}`);
        const target = await follow(toBase(href));
        if (target.hops.length || target.final.status !== 200) {
          issues.push(`hreflang ${lang} → ${target.hops[0]?.status ?? target.final.status}`);
          continue;
        }
        const alternate = parsePage(target.final.body);
        if (toSite(alternate.canonical) !== toSite(href)) issues.push(`hreflang ${lang} page is not self-canonical`);
        if (!Object.values(alternate.alternates).some((back) => toSite(back) === self)) issues.push(`hreflang ${lang} does not link back`);
      }
      if (page.ogUrl && toSite(new URL(page.ogUrl, SITE).href) !== self) issues.push('og:url differs from canonical');
      if (!page.ogImage) issues.push('no og:image');
      else if (!/^https?:\/\//.test(page.ogImage)) issues.push('og:image not absolute');
      else {
        const image = await follow(toBase(page.ogImage));
        if (image.final.status !== 200) issues.push(`og:image → ${image.final.status}`);
      }
      indexable.push({ url: self, page });
    }
    for (const issue of issues) problem('pages', `${self}: ${issue}`);
    rows.push({
      url: self,
      status: res.status,
      indexability: status.indexable ? 'indexable' : noindex ? 'noindex' : `canonicalised to ${canonical}`,
      title: page.title,
      title_length: page.title.length,
      description: page.description,
      description_length: page.description.length,
      h1_count: page.h1.length,
      h1: page.h1,
      canonical,
      hreflang: Object.entries(page.alternates).map(([lang, href]) => `${lang}=${toSite(href)}`),
      og_url: page.ogUrl ? toSite(new URL(page.ogUrl, SITE).href) : '',
      og_title: page.ogTitle,
      og_image: page.ogImage,
      issues,
    });
  }

  // Duplicates among indexable pages.
  for (const field of ['title', 'description']) {
    const groups = new Map();
    for (const { url, page } of indexable) {
      if (!page[field]) continue;
      groups.set(page[field], [...(groups.get(page[field]) ?? []), url]);
    }
    for (const [value, urls] of groups) if (urls.length > 1) problem('pages', `duplicate ${field} on ${urls.length} pages: "${value}" (${urls.join(', ')})`);
  }
  return { rows, indexable };
}

/* 3. Internal links --------------------------------------------------------------- */

function checkLinks(pages, linkSources) {
  const rows = [];
  for (const [link, sources] of linkSources) {
    const { res } = pages.get(link) ?? {};
    const status = res?.status ?? 'not crawled';
    const ok = status === 200;
    if (!ok) problem('links', `${toSite(link)} → ${status}${res?.location ? ` (${toSite(res.location)})` : ''}, linked from ${sources.size} page(s), e.g. ${toSite([...sources][0])}`);
    rows.push({
      link: toSite(link),
      status,
      redirects_to: res?.location ? toSite(res.location) : '',
      linked_from_pages: sources.size,
      example_sources: [...sources].slice(0, 3).map(toSite),
    });
  }
  return rows.sort((a, b) => String(a.status).localeCompare(String(b.status)) || a.link.localeCompare(b.link));
}

/* 4. Sitemap ---------------------------------------------------------------------- */

async function checkSitemap(pages, indexable) {
  const res = await get(`${BASE}/sitemap.xml`);
  if (res.status !== 200) {
    problem('sitemap', `/sitemap.xml → ${res.status}`);
    return [];
  }
  const entries = [...res.body.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) => ({
    loc: decode(block.match(/<loc>([\s\S]*?)<\/loc>/)?.[1] ?? '').trim(),
    alternates: Object.fromEntries([...block.matchAll(/<xhtml:link\b([^>]*)\/?>/g)].map(([, attrs]) => attributes(attrs)).map((a) => [a.hreflang, a.href])),
  }));
  const rows = await pool(entries, 6, async ({ loc, alternates }) => {
    const issues = [];
    if (!loc.startsWith(`${SITE}/`)) issues.push(`not on ${SITE}`);
    if (new URL(loc).search) issues.push('has a query string');
    const target = await follow(toBase(loc));
    const page = target.final.status === 200 ? parsePage(target.final.body) : null;
    if (target.hops.length) issues.push(`redirects (${target.hops[0].status})`);
    else if (target.final.status !== 200) issues.push(`HTTP ${target.final.status}`);
    if (page && isNoindex(target.final, page)) issues.push('noindex');
    if (page && toSite(page.canonical) !== loc) issues.push(`canonical is ${page.canonical}`);
    if (page) {
      const onPage = Object.fromEntries(Object.entries(page.alternates).map(([lang, href]) => [lang, toSite(href)]));
      if (JSON.stringify(Object.entries(onPage).sort()) !== JSON.stringify(Object.entries(alternates).sort())) issues.push('hreflang differs from the page');
    }
    for (const issue of issues) problem('sitemap', `${loc}: ${issue}`);
    return { loc, status: target.hops[0]?.status ?? target.final.status, canonical: page ? toSite(page.canonical) : '', hreflang: Object.keys(alternates), issues };
  });

  const locs = rows.map((row) => row.loc);
  for (const loc of new Set(locs)) if (locs.filter((item) => item === loc).length > 1) problem('sitemap', `${loc}: listed more than once`);
  for (const { url } of indexable) if (!locs.includes(url)) problem('sitemap', `${url}: indexable page missing from the sitemap`);

  // Every visible product must be in the sitemap, in every language it is translated into.
  const api = await get(`${BASE}/api/products?locale=en&pageSize=1`);
  const total = api.status === 200 ? JSON.parse(api.body).total : null;
  for (const code of LOCALES) {
    const count = locs.filter((loc) => new URL(loc).pathname.startsWith(`/${code}/product/`)).length;
    summary.sitemapProducts[code] = count;
    if (total !== null && count !== total) problem('sitemap', `${count} ${code} product URLs, but the catalogue has ${total} visible products`);
  }
  summary.catalogueProducts = total;
  summary.sitemapUrls = rows.length;
  return rows;
}

/* 5. Structured data (product and category pages) -------------------------------- */

async function checkStructuredData(indexable) {
  const rows = [];
  for (const { url, page } of indexable) {
    const product = page.jsonLd.find((item) => item['@type'] === 'Product');
    const breadcrumbs = page.jsonLd.find((item) => item['@type'] === 'BreadcrumbList');
    if (!product && !breadcrumbs) continue;
    const issues = [];
    if (page.jsonLd.some((item) => item['@type'] === 'INVALID JSON')) issues.push('invalid JSON-LD');
    const offers = [product?.offers ?? []].flat();
    if (product) {
      for (const field of ['name', 'description', 'image', 'sku', 'brand', 'url', 'offers']) if (!product[field]) issues.push(`Product.${field} missing`);
      if (product.url !== url) issues.push(`Product.url is ${product.url}`);
      for (const image of [product.image ?? []].flat()) {
        const res = await get(image);
        if (res.status !== 200) issues.push(`image ${image} → ${res.status}`);
      }
      for (const offer of offers) {
        for (const field of ['price', 'priceCurrency', 'availability', 'itemCondition', 'url']) if (!offer[field]) issues.push(`Offer.${field} missing`);
        if (offer.url && offer.url !== url) issues.push(`Offer.url is ${offer.url}`);
      }
      if (!Number.isNaN(page.shownPrice) && !offers.some((offer) => Number(offer.price) === page.shownPrice)) {
        issues.push(`shown price ${page.shownPrice} kr is not among the offer prices`);
      }
    }
    const crumbs = breadcrumbs?.itemListElement ?? [];
    for (const crumb of crumbs) {
      if (!String(crumb.item).startsWith(`${SITE}/`)) issues.push(`breadcrumb ${crumb.name} not on ${SITE}`);
      const target = await follow(toBase(crumb.item));
      if (target.hops.length || target.final.status !== 200) issues.push(`breadcrumb ${crumb.name} → ${target.hops[0]?.status ?? target.final.status}`);
      else if (toSite(parsePage(target.final.body).canonical) !== crumb.item) issues.push(`breadcrumb ${crumb.name} is not a canonical URL`);
    }
    if (crumbs.length && crumbs.at(-1).item !== url) issues.push('last breadcrumb is not the page itself');
    for (const issue of issues) problem('structured data', `${url}: ${issue}`);
    rows.push({
      url,
      type: [product && 'Product', breadcrumbs && 'BreadcrumbList'].filter(Boolean),
      name: product?.name ?? '',
      sku: product?.sku ?? '',
      brand: product?.brand?.name ?? '',
      category: product?.category ?? '',
      images: [product?.image ?? []].flat().length,
      offers: offers.map((offer) => `${offer.name ?? ''} ${offer.price} ${offer.priceCurrency} ${String(offer.availability).split('/').pop()} ${String(offer.itemCondition).split('/').pop()}`),
      shown_price: Number.isNaN(page.shownPrice) ? '' : page.shownPrice,
      breadcrumb: crumbs.map((crumb) => `${crumb.name} (${crumb.item})`),
      issues,
    });
  }
  return rows;
}

/* 6. Legacy URLs ------------------------------------------------------------------- */

async function checkLegacy() {
  const list = parseCsv(await readFile(LEGACY, 'utf8'));
  return pool(list, 6, async ({ url, type }) => {
    const u = new URL(url, SITE);
    const { hops, final } = await follow(`${BASE}${u.pathname}${u.search}`);
    const page = final.status === 200 && final.type?.includes('html') ? parsePage(final.body) : null;
    const canonical = page?.canonical ? toSite(page.canonical) : '';
    const finalUrl = toSite(final.url);
    const indexable = page && !isNoindex(final, page) && canonical === finalUrl;
    let result;
    if (typeof final.status !== 'number') result = `PROBLEM: ${final.status}`;
    else if (hops.length > 1) result = `PROBLEM: ${hops.length} redirects in a row`;
    else if (hops.length === 1 && ![301, 308].includes(hops[0].status) && u.pathname !== '/') result = `PROBLEM: temporary redirect (${hops[0].status})`;
    else if (final.status === 200 && final.type?.includes('xml') && new URL(final.url).pathname === '/sitemap.xml') result = 'OK: redirected to the new sitemap';
    else if (final.status === 200 && page && new URL(finalUrl).search && canonical === finalUrl.split('?')[0] && !isNoindex(final, page)) {
      result = 'OK: one permanent redirect to a search/sorted view whose canonical is the plain page';
    }
    else if (final.status === 200 && !indexable) result = 'PROBLEM: lands on a page that is not indexable/canonical';
    else if (final.status === 200) result = hops.length ? 'OK: one permanent redirect to an indexable page' : 'OK: valid as it is';
    else if (final.status === 410) result = 'OK: 410 Gone (no equivalent)';
    else if (final.status === 404) result = hops.length ? 'PROBLEM: redirects to a 404' : 'CHECK: 404';
    else result = `PROBLEM: HTTP ${final.status}`;
    if (u.pathname === '/' && !u.search && hops[0]?.status === 307) result = 'OK: language redirect (307, varies by visitor)';
    if (result.startsWith('PROBLEM') || result.startsWith('CHECK')) problem('legacy', `${url}: ${result}`);
    return {
      old_url: url,
      old_type: type,
      new_url: hops.length ? finalUrl : '',
      redirect_status: hops[0]?.status ?? '',
      hops: hops.length,
      final_status: final.status,
      canonical,
      indexability: page ? (indexable ? 'indexable' : isNoindex(final, page) ? 'noindex' : 'not canonical') : final.status === 410 ? 'gone' : '',
      result,
    };
  });
}

/* 7. Status codes, root and hosts ------------------------------------------------- */

async function checkStatusCodes() {
  const probes = [
    ['/en/this-page-does-not-exist', 404, 'random page'],
    ['/this-page-does-not-exist', 404, 'random page without language'],
    ['/sv/product/finns-inte', 404, 'nonexistent product'],
    ['/sv/shop/finns-inte', 404, 'nonexistent category'],
    ['/de/shop', 404, 'unsupported language'],
    ['/wp-admin/admin-ajax.php', 410, 'WordPress admin'],
    ['/wp-content/uploads/2024/05/honung.jpg', 410, 'WordPress upload'],
    ['/wp-json/wc/v3/products', 410, 'WordPress REST API'],
    ['/feed', 410, 'feed'],
    ['/xmlrpc.php', 410, 'XML-RPC'],
    ['/robots.txt', 200, 'robots.txt'],
    ['/sitemap.xml', 200, 'sitemap'],
  ];
  const rows = await pool(probes, 4, async ([path, expected, label]) => {
    const res = await get(`${BASE}${path}`);
    const page = res.type.includes('html') && res.body ? parsePage(res.body) : null;
    const noindex = res.status === 200 ? '' : isNoindex(res, page) ? 'noindex' : 'no noindex';
    if (res.status !== expected) problem('status codes', `${path} (${label}): HTTP ${res.status}, expected ${expected}`);
    return { path, what: label, expected, status: res.status, redirect: res.location ? toSite(res.location) : '', robots: noindex };
  });

  // The language-less home page: visitors go to their language, crawlers (no Accept-Language) to English.
  const root = [
    ['no cookie, no Accept-Language (crawler)', {}, '/en'],
    ['Accept-Language: sv-SE', { 'Accept-Language': 'sv-SE,sv;q=0.9' }, '/sv'],
    ['Accept-Language: el', { 'Accept-Language': 'el-GR,el;q=0.9,en;q=0.5' }, '/el'],
    ['Accept-Language: de (unsupported)', { 'Accept-Language': 'de-DE,de;q=0.9' }, '/en'],
    ['cookie NEXT_LOCALE=sv', { Cookie: 'NEXT_LOCALE=sv', 'Accept-Language': 'en' }, '/sv'],
  ];
  for (const [label, headers, expected] of root) {
    const res = await get(`${BASE}/`, headers);
    const to = res.location ? new URL(res.location).pathname : '';
    if (res.status === 403) {
      problem('root', `/ with ${label}: 403 — blocked by the hosting firewall, not answered by the site; run the audit from an allowed IP`);
      rows.push({ path: '/', what: `home, ${label}`, expected: `307 → ${expected}`, status: res.status, redirect: '', robots: '' });
      continue;
    }
    if (res.status !== 307 || to !== expected) problem('root', `/ with ${label}: ${res.status} → ${to}, expected 307 → ${expected}`);
    rows.push({ path: '/', what: `home, ${label}`, expected: `307 → ${expected}`, status: res.status, redirect: to, robots: `Vary: ${res.vary}` });
  }

  const robots = await get(`${BASE}/robots.txt`);
  const sitemapLine = robots.body.match(/^Sitemap:\s*(\S+)/im)?.[1] ?? '';
  if (sitemapLine !== `${SITE}/sitemap.xml`) problem('robots.txt', `Sitemap line is "${sitemapLine}", expected ${SITE}/sitemap.xml`);
  summary.robots = robots.body.trim();
  return rows;
}

async function checkHosts() {
  const host = new URL(SITE).hostname.replace(/^www\./, '');
  const rows = [];
  for (const path of ['/', '/sv/shop', '/product/ekhonung/']) {
    for (const origin of [`http://${host}`, `https://${host}`, `http://www.${host}`, `https://www.${host}`]) {
      const { hops, final } = await follow(`${origin}${path}`);
      const chain = [...hops.map((hop) => `${hop.status} → ${hop.location}`), String(final.status)].join(' ⟶ ');
      // Host hops may only upgrade to HTTPS on the same host (Vercel always does that first, as HSTS requires)
      // or move to the canonical host; anything else, or a final answer elsewhere than 200 on it, is a problem.
      const hostHops = hops.filter((hop) => new URL(hop.location).host !== new URL(hop.url).host || new URL(hop.url).protocol === 'http:');
      const detour = hostHops.some((hop) => {
        const to = new URL(hop.location);
        return to.origin !== SITE && !(to.protocol === 'https:' && to.host === new URL(hop.url).host);
      });
      rows.push({ url: `${origin}${path}`, chain, final_url: final.url, final_status: final.status, host_hops: hostHops.length });
      if (final.status !== 200 || !String(final.url).startsWith(SITE) || detour) problem('hosts', `${origin}${path}: ${chain}`);
    }
  }
  return rows;
}

/* Run ---------------------------------------------------------------------------- */

const summary = { sitemapProducts: {} };

await mkdir(OUT, { recursive: true });
console.log(`Auditing ${BASE} as ${SITE}…`);
const { pages, linkSources } = await crawl();
console.log(`Crawled ${pages.size} URLs`);
const { rows: pageRows, indexable } = await checkPages(pages);
const linkRows = checkLinks(pages, linkSources);
const sitemapRows = await checkSitemap(pages, indexable);
const dataRows = await checkStructuredData(indexable);
const legacyRows = await checkLegacy();
const statusRows = await checkStatusCodes();
const hostRows = args.hosts ? await checkHosts() : [];

await writeCsv('pages.csv', pageRows);
await writeCsv('links.csv', linkRows);
await writeCsv('sitemap.csv', sitemapRows);
await writeCsv('structured-data.csv', dataRows);
await writeCsv('legacy-redirects.csv', legacyRows);
await writeCsv('status-codes.csv', statusRows);
if (hostRows.length) await writeCsv('hosts.csv', hostRows);

const count = (rows, predicate) => rows.filter(predicate).length;
const byArea = Object.groupBy(problems, (item) => item.area);
const report = `# SEO audit — ${BASE}

Run ${new Date().toISOString()} · canonical host ${SITE}

| Check | Result |
| --- | --- |
| URLs crawled from /en, /sv, /el | ${pages.size} |
| HTML pages · indexable | ${pageRows.length} · ${indexable.length} |
| Internal links · not answering 200 directly | ${linkRows.length} · ${count(linkRows, (row) => row.status !== 200)} |
| Sitemap URLs · with problems | ${summary.sitemapUrls ?? 0} · ${count(sitemapRows, (row) => row.issues.length)} |
| Product URLs in the sitemap (en / sv / el) · visible products in the catalogue | ${LOCALES.map((code) => summary.sitemapProducts[code] ?? 0).join(' / ')} · ${summary.catalogueProducts ?? '?'} |
| Pages with structured data · with problems | ${dataRows.length} · ${count(dataRows, (row) => row.issues.length)} |
| Legacy URLs checked · OK | ${legacyRows.length} · ${count(legacyRows, (row) => row.result.startsWith('OK'))} |
| Status-code probes · as expected | ${statusRows.length} · ${statusRows.length - (byArea['status codes']?.length ?? 0) - (byArea.root?.length ?? 0)} |
${hostRows.length ? `| Host variants · reaching ${SITE} with 200 | ${hostRows.length} · ${hostRows.length - (byArea.hosts?.length ?? 0)} |\n` : ''}
## Problems (${problems.length})

${problems.length ? Object.entries(byArea).map(([area, items]) => `### ${area}\n\n${items.map((item) => `- ${item.message}`).join('\n')}`).join('\n\n') : 'None.'}

## robots.txt

\`\`\`
${summary.robots ?? ''}
\`\`\`
`;
await writeFile(`${OUT}/summary.md`, report);
console.log(report.split('## robots.txt')[0]);
process.exitCode = problems.length ? 1 : 0;
