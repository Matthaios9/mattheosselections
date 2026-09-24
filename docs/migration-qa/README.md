# Mattheos Selections — migration and technical QA

Response to the "Final Technical Audit & Required Actions Before Project Approval" list, point by point.
For each point: what the issue was, what changed and where, why it is correct, how it was tested, the result,
and what is still open.

## How this was verified

- **Automated audit.** I built an audit tool, `scripts/seo-audit.mjs` (run with `npm run seo:audit`), so that nothing
  here rests on opening a few pages by hand. It requests the site the way a search engine does: no cookies, no
  `Accept-Language`, and redirects followed one hop at a time. It checks:
  - every legacy URL in [`legacy-urls.csv`](legacy-urls.csv);
  - every page reachable by links from `/en`, `/sv` and `/el`, and every internal link on those pages;
  - every sitemap entry, every hreflang return link, and the structured data;
  - a set of 404/410 probes.

  It writes CSV reports and a summary, and exits with an error if anything fails. Anyone can re-run it against
  production.
- **Where it ran.**
  - **`results/local/`** is the corrected code: a production build (`next build && next start`) reading the live
    product database.
  - **`results/production-before-deploy/`** is the live site as it is today, before these corrections. It is kept
    as the baseline and as evidence of the problems described below.
- **Result.**
  - On the corrected build every check passes: 90 pages, 90 internal links, 90 sitemap URLs, 72 pages with
    structured data, 107 legacy URLs and 17 status-code probes. There are 0 problems.
  - On the live site the same audit finds 447 problems. Almost all of them come from point 1: every canonical,
    hreflang, sitemap and Open Graph URL points to the non-www host, which redirects.
- **Still to do:**
  - **Deploy, then re-crawl production.** The changes are not deployed yet. After deployment the same command is
    run against production and the report goes in `results/production/`.
  - **Search Console.** Points 17 and 18 need Search Console data, which I don't have access to.
  - **Live payment tests.** The end-to-end payment tests in point 23 need Kustom's playground from an EU network
    (see Appendix C).

## Summary

| # | Point | Status |
| --- | --- | --- |
| 1 | Canonical host | **Fixed.** www everywhere; verified locally. Production re-crawl after deploy. |
| 2 | Legacy URL inventory | **Fixed.** Rules cover every WordPress/WooCommerce URL pattern; 107 URLs verified. Inventory to be completed with Search Console data. |
| 3 | Blog articles → /about | **Changed.** Each article has its own destination or is 410 Gone. To be confirmed against Search Console. |
| 4 | Category landing pages | **Built.** Every category has its own indexable page. |
| 5 | Sitemap | **Fixed.** Fails loudly instead of dropping products; contents validated. |
| 6 | robots.txt | **Fixed** (www host); nothing needed for rendering is blocked. |
| 7 | Hreflang | **Verified** on all 90 pages, including return links; x-default documented. |
| 8 | Root language detection | **Verified and documented;** `Vary` header added. |
| 9 | Structured data | **Fixed** (host, SKU, breadcrumbs); validated on all 57 product pages. Google Rich Results Test after deploy. |
| 10 | Breadcrumb category URLs | **Fixed.** Breadcrumbs point to the canonical category pages. |
| 11 | Product slugs | **Unchanged**, as requested. |
| 12 | 404 / 410 | **Fixed** (WordPress files and feeds returned 404 or a redirect chain); verified at HTTP level. |
| 13 | Legacy query parameters | **Fixed:** removed in the same single 301. |
| 14 | Redirect chains / loops | **Fixed and automated:** 0 chains, 0 loops. |
| 15 | Internal links | **Verified:** 0 internal links through redirects or errors. |
| 16 | Metadata | **Crawled site-wide:** 0 missing or duplicate titles/descriptions, exactly one H1 per page. |
| 17 | Search Console | **Needs your access** (see "What I need from you"). |
| 18 | Organic data for legacy URLs | **Needs Search Console export.** |
| 19 | Performance | **Measured; main issues fixed.** Production re-measurement after deploy. |
| 20 | Images / media | **Verified; share images fixed.** |
| 21 | Deployment | **Needs Vercel access** to confirm. |
| 22 | "Confirm with client/accountant" | **Inventory below (Appendix B):** 12 decisions needed. |
| 23 | E-commerce end-to-end | **Code verified; 6 bugs fixed.** Live payment tests listed in Appendix C. |
| 24 | Security | **Reviewed; gaps fixed** (rate limiting, spam protection, headers, a leaked credential). |

---

## 1. Canonical domain — www vs non-www

- **Issue:**
  - Production serves `https://www.mattheosselections.com`. Vercel already redirects the non-www host there with a
    308.
  - The code built every absolute URL from `https://mattheosselections.com`. So on the live site every canonical,
    hreflang, sitemap URL, robots.txt sitemap line, `og:url` and JSON-LD URL points to a URL that redirects.
  - The before-deploy crawl shows all 90 pages with "canonical → 308" and all 75 sitemap URLs "redirects (308)".
- **Changed:** `siteConfig.url` is now `https://www.mattheosselections.com`. Every absolute URL is built from this
  one value:
  - canonical and hreflang (`src/i18n/metadata.js`);
  - `metadataBase` (`src/app/[lang]/layout.js`);
  - the sitemap and robots.txt;
  - Open Graph;
  - Product and Breadcrumb JSON-LD (through a new shared `absoluteUrl()`);
  - emails.
- **Files:** `src/config/site.js`, `src/i18n/metadata.js`, `src/app/sitemap.js`, `src/app/robots.js`,
  `src/app/[lang]/product/[slug]/page.js`.
- **Why it is correct:**
  - There is now one canonical host, and it matches the host production actually serves (verified with `curl`).
  - No absolute URL in the application is written by hand any more.
- **How tested:** the audit checks that every canonical, hreflang, `og:url`, sitemap `<loc>`, robots.txt sitemap line,
  JSON-LD `url` and breadcrumb URL starts with `https://www.mattheosselections.com/` and answers 200 directly.
- **Result:** 0 problems locally, against 447 on the live site.
- **The four host variants:** these are served by Vercel, not the code. Measured today:

  | Request | Chain |
  | --- | --- |
  | `https://www.mattheosselections.com/sv/shop` | 200 |
  | `http://www.mattheosselections.com/sv/shop` | 308 → https://www… → 200 |
  | `https://mattheosselections.com/sv/shop` | 308 → https://www… → 200 |
  | `http://mattheosselections.com/sv/shop` | 308 → https://mattheosselections.com… → 308 → https://www… → 200 |

  **Why the last one takes two hops:**
  - Vercel always upgrades HTTP to HTTPS on the same host first. HSTS requires this; the site sends
    `Strict-Transport-Security`.
  - It then applies the domain redirect. This cannot be merged into one hop on Vercel.
  - Browsers that have seen the site once skip the first hop because of HSTS.
  - It is the only host variant that takes two hops; all 12 host checks are recorded in `hosts.csv`.
- **Outstanding:** deploy, then run `npm run seo:audit -- --base https://www.mattheosselections.com --hosts`.

## 2. Legacy URL inventory

- **Issue:**
  - The redirect rules covered a fixed list of paths.
  - The before-deploy crawl found old URLs that fell through: WooCommerce pagination (`/shop/page/2/`),
    `/my-account/…` and `/checkout/order-received/…` sub-pages, product tags, `/test-2/`, per-post feeds, and Yoast
    sitemaps. Most went 301 → 307 → **404**; the Yoast sitemaps and WordPress files returned 404 directly.
  - Common Crawl's index of the live WordPress site (August 2026) contains `/shop/page/2/` and `/test-2/`, so these
    URLs were being crawled.
- **Changed:** `src/config/redirects.js` was rewritten as an explicit rule set, one rule per WordPress/WooCommerce
  URL type, each with a stated reason. It covers:
  - products (with case and `?v=` variants);
  - product categories, including pagination and nested categories;
  - product tags;
  - shop and blog pagination;
  - cart, checkout and account sub-pages;
  - pages;
  - blog articles, categories, tags and author archives;
  - WordPress search (`/?s=`);
  - feeds;
  - Yoast and WordPress sitemaps (301 to `/sitemap.xml`);
  - WordPress system paths.

  Old Swedish root-level URLs map to `/sv/…`, and old `/en/…` URLs to `/en/…`.
- **Files:** `src/config/redirects.js`, `src/proxy.js`, `docs/migration-qa/legacy-urls.csv`.
- **Why it is correct:**
  - Every rule sends the old URL, in one response, to the closest equivalent page in the same language, or answers
    410 Gone when there is none (see point 3).
  - No catch-all remains: unknown paths are a real 404.
- **How tested:** each URL in `legacy-urls.csv` (107 rows) was requested and every hop recorded. That includes all 19
  WooCommerce product slugs in Swedish and English, trailing-slash and parameter variants, and one or more examples of
  every rule above.
- **Result:** 107/107 OK. The table is [`results/local/legacy-redirects.csv`](results/local/legacy-redirects.csv), in
  exactly the requested form: OLD URL · OLD CONTENT TYPE · NEW URL · REDIRECT STATUS · HOPS · FINAL STATUS · CANONICAL ·
  INDEXABILITY.
  - 77: one 301 to an indexable 200 page.
  - 23: 410 Gone.
  - 4: old sitemaps → `/sitemap.xml`.
  - 2: WordPress searches → shop search (canonical `/shop`).
  - 1: `/`, the language redirect (point 8).
- **Outstanding:**
  - I could not get a *complete* list of the old site's URLs. The WordPress site is gone, the Wayback Machine was
    offline during this work, and search engines block automated queries.
  - The authoritative list is in Search Console. Export **Pages** (all indexed and not-indexed URLs) and
    **Performance → Pages** (last 16 months), paste the URLs into `legacy-urls.csv`, and re-run the audit. Any URL
    not covered by a rule shows up as a problem.

## 3. Old blog articles

- **Issue:** six articles and the blog index were redirected to `/about` whatever their subject.
- **Changed:** each article now has its own entry in `ARTICLES` (`src/config/redirects.js`):

  | Old article | Now |
  | --- | --- |
  | skillnader-mellan-olika-typer-av-honun (types of honey) | 301 → `/sv/shop/ra-honung`, the Raw Honey page, which presents the honey varieties |
  | halsofordelarna-med-honung-naturens-gyllene-medicin (health benefits of honey) | 301 → `/sv/shop/ra-honung` |
  | honey-in-traditional-medicine-swedens-natural-healer (English article) | 301 → `/en/shop/ra-honung` |
  | hallbar-biodling-en-vag-till-att-skydda-bin-och-planeten (sustainable beekeeping) | 410 Gone |
  | pollineringens-betydelse-for-ekosystemet (pollination) | 410 Gone |
  | de-osynliga-hjaltarna-i-var-matforsorjning-binas-roll-i-livsmedelskedjan (bees in the food chain) | 410 Gone |
  | /blog, /category/…, /tag/…, /author/… | 410 Gone |

  The 410 response is a short page (Swedish and English) with links to the shop and home page, plus
  `X-Robots-Tag: noindex`.
- **Why:**
  - The honey articles have a relevant destination.
  - The bee and pollination articles have none on the new site, so, as you asked, they are no longer redirected to
    an unrelated page.
- **Outstanding — your decision, based on data:**
  - This is my interim proposal. If Search Console or backlink data shows an article carried traffic or links, the
    better outcome is to recreate that article on the new site and 301 the old URL to it.
  - Changing a destination is one line in `ARTICLES`.

## 4. Category landing pages

- **Issue:**
  - WooCommerce had a crawlable page per product category.
  - The new site had only `/shop?category=<id>` filters, which canonicalise to `/shop`, so the category layer of
    indexable pages was gone.
  - Old `/product-category/…` URLs all went to `/shop`.
- **Changed:** every category now has its own page, **`/{lang}/shop/{slug}`**, for example `/sv/shop/presentforpackningar`
  and `/en/shop/ra-honung`. Each page has:
  - a stable permanent URL;
  - a unique title (the category name) and meta description (the category description, or a translated fallback);
  - the category name as its only H1;
  - the category's intro text;
  - its products, server-rendered, with sorting;
  - a self-referencing canonical and full hreflang;
  - BreadcrumbList structured data;
  - an entry in the sitemap.

  An empty category is `noindex` and left out of the sitemap until it has products.

  Everything that linked to categories now links to these pages:
  - the shop's category tabs, which are now real links instead of buttons;
  - the mega menu, mobile menu, footer, home category cards and the gift banner;
  - product breadcrumbs.

  Old links:
  - Old `/shop?category=<id>` links (used by the new site until now) 308 to the category page.
  - Old `/product-category/<slug>/` URLs 301 to the category page listed in `CATEGORIES` (`src/config/redirects.js`),
    otherwise to `/shop`.

  The URL slug is generated from the Swedish name, like product slugs. It can be edited under Admin → Categories, and
  it is kept when the name changes.
- **Files:**
  - Page and data: `src/app/[lang]/shop/[category]/page.js` (new), `src/server/domain/storefront.js`,
    `src/server/models/Category.js`, `src/utils/slug.js`.
  - Admin: `src/server/domain/categories.js`, `src/server/validation.js`, `src/components/admin/categories/CategoryManager.js`.
  - Links: `src/components/shop/ShopCatalog.js`, `src/app/[lang]/shop/page.js`, and the menu, footer and home components.
- **How tested:**
  - All 15 category pages (5 categories × 3 languages) crawled: status, title, description, H1, canonical, hreflang
    and breadcrumb JSON-LD, all OK.
  - The old filter URL redirect checked with `curl`.
  - Screenshots on desktop and mobile.
- **Outstanding:**
  - **Old category slugs.** I don't know the old WooCommerce category slugs; they are not in any file I have. If the
    Search Console export shows `/product-category/<old-slug>/` URLs, add each one to `CATEGORIES`, or give the
    category that slug in the admin.
  - **Category descriptions.** These are now each category page's intro and meta description, and some read like
    internal notes, for example Bee Products: "…other bee derived products we may add in the future". Please rewrite
    them for customers in Admin → Categories, in all three languages. The Greek name of Raw Honey is also written in
    lower case ("ακατέργαστο μέλι").

## 5. Sitemap

- **Issue:**
  - If the product query failed, `sitemap.js` logged the error and returned a sitemap *without products*, and that
    sitemap was then cached for an hour.
  - All its URLs used the non-www host (point 1).
- **Changed:**
  - A failed catalogue query now throws. On a scheduled refresh the last complete sitemap keeps being served, and a
    build without database access fails loudly.
  - Category pages were added.
  - Only indexable, canonical URLs are listed, each with its hreflang alternates. A product is listed only in the
    languages it is translated into.
- **Files:** `src/app/sitemap.js`, `src/server/domain/storefront.js`.
- **How tested:** the audit fetches `/sitemap.xml` and checks every entry:
  - it is on the www host;
  - it has no query string;
  - it answers 200 without a redirect;
  - it is not noindex;
  - it has a self-canonical;
  - its hreflang matches the page;
  - it is not a duplicate.

  It also checks that every indexable crawled page is in the sitemap, and compares the number of product URLs per
  language with the number of visible products reported by the public catalogue API.
- **Result:**
  - 90 URLs, 0 problems.
  - 19 product URLs in each of en / sv / el, matching 19 visible products.
  - No redirects, 404s, 410s, noindex pages, old WordPress URLs, wrong hosts, duplicates or parameter URLs.

## 6. robots.txt

- **Changed:** nothing beyond point 1. The sitemap line is now `Sitemap: https://www.mattheosselections.com/sitemap.xml`,
  and the audit checks it.
- **Blocked paths:**
  - Blocked: only `/admin` and `/api/`. `/api/` serves JSON for the cart, filters and checkout. Product listings,
    product pages and all text are server-rendered into the HTML, so Google needs nothing from `/api/` to render or
    index a page.
  - Not blocked: CSS, JS (`/_next/`), images and fonts.

## 7. Hreflang (EN, SV, EL)

- **Verified:** the audit checks, on every indexable page (homepage, shop, 5 categories, 4 information pages and 19
  products, each in 3 languages):
  - that `en`, `sv`, `el` and `x-default` are present;
  - that each alternate is on the www host and answers 200 directly;
  - that each alternate is itself self-canonical;
  - that each alternate links back to the page (reciprocal return link).

  Result: 90/90 pass.
- **Products not translated into every language:**
  - All 19 current products have a name in all three languages, so each has all three alternates.
  - The code handles a missing translation: that language is left out of the hreflang set and the sitemap, and the
    fallback page is `noindex`.
  - `x-default` now falls back to an available language instead of always English.
- **x-default is deliberately English** (documented in `src/i18n/metadata.js`):
  - It is the version for searchers whose language is none of the three. The shop sells across Europe, and English
    is the language those visitors are most likely to read.
  - The language-less `/` is not used as x-default because it redirects by visitor (point 8) and never answers 200.
    If you would rather make Swedish the default, it is one constant (`X_DEFAULT_LOCALE`).

## 8. Root `/` language detection

- **Behaviour (verified):**

  | Request to `/` | Response |
  | --- | --- |
  | no cookie, no `Accept-Language` (Googlebot and most crawlers) | **307 → `/en`** |
  | `Accept-Language: sv-SE` | 307 → `/sv` |
  | `Accept-Language: el-GR` | 307 → `/el` |
  | unsupported language (de) | 307 → `/en` |
  | cookie `NEXT_LOCALE=sv` (the visitor chose Swedish) | 307 → `/sv`, whatever the browser language |

- **Why this is predictable for search engines:**
  - `/en`, `/sv` and `/el` are permanent, crawlable, indexable URLs, each self-canonical with full hreflang.
  - `/` itself is never indexed.
  - The redirect is 307 (temporary) because its target depends on the visitor. It now also sends
    `Vary: Accept-Language, Cookie`, which says exactly that.
  - Crawlers are not detected or treated specially, so there is no cloaking.
  - Other language-less pages behave the same way: `/about` → `/{lang}/about`. A language-less path that isn't a page
    now answers **404 directly**, instead of 307 → a localized 404.
- **Files:** `src/proxy.js`.

## 9. Structured data

- **Changed:**
  - All URLs now use the www host.
  - `sku` is always present. No product has an SKU in the admin yet, so the product's slug (unique and stable) stands
    in, with `<slug>-<size>` per offer. A real SKU entered in the admin replaces it.
  - Breadcrumbs use canonical category URLs (point 10).
  - The JSON-LD markup is now shared code (`JsonLd`, `breadcrumbJsonLd`).
- **Verified on all 57 product pages** (19 products × 3 languages):
  - present: name, description, image(s) (absolute, each answering 200), SKU, brand, category, url;
  - one Offer per size: price, currency SEK, availability, `NewCondition`, url;
  - the displayed price is one of the offer prices;
  - every breadcrumb URL is canonical and answers 200.

  Report: [`results/local/structured-data.csv`](results/local/structured-data.csv). Availability comes from the same
  stock value that shows "Sold out" on the page.
- **Outstanding:**
  - Run 2–3 products through Google's Rich Results Test after deploy (it needs a public URL).
  - Google will likely *warn*, not error, about the optional `shippingDetails` and `hasMerchantReturnPolicy`. I have
    not added them because their values depend on the open shipping and returns questions in Appendix B.

## 10. Breadcrumb category URLs

- **Issue:** the product BreadcrumbList linked to `/shop?category=<id>`, a URL whose canonical is `/shop`.
- **Changed:** product breadcrumbs (visible and JSON-LD) now link to the canonical category page `/{lang}/shop/{slug}`.
- **Tested:** the audit resolves every breadcrumb item and checks it is self-canonical and answers 200: 72 pages, 0 problems.

## 11. Product slugs

- **Nothing changed**, as requested.
  - The 19 WooCommerce slugs (e.g. `ekhonung`) are kept in all three languages.
  - Old `/product/<slug>/` and `/en/product/<slug>/` URLs 301 straight to them.
  - The audit covers all 38.

## 12. 404 and 410 at the HTTP level

- **Issue found:**
  - The proxy skipped every path containing a dot. So `/wp-login.php`, `/xmlrpc.php`, `/wp-content/uploads/…jpg`,
    `/wp-admin/admin-ajax.php` and the Yoast sitemaps returned 404, not 410.
  - Per-post feeds (`/product/ekhonung/feed/`) went through two redirects to a 404.
  - Unknown language-less URLs went through a 307 to a 404.
- **Changed:**
  - The proxy now also runs for WordPress files and old sitemaps.
  - Feeds at any depth are 410.
  - Unknown paths answer 404 directly.
  - 410 responses carry `X-Robots-Tag: noindex`, and Next.js's 404 page carries `<meta name="robots" content="noindex">`.
- **Verified** ([`results/local/status-codes.csv`](results/local/status-codes.csv)):

  | Request | Status |
  | --- | --- |
  | random page (with and without language) | 404 |
  | nonexistent product | 404 |
  | nonexistent category | 404 |
  | unsupported language `/de/shop` | 404 |
  | `/wp-admin/…`, `/wp-content/…`, `/wp-json/…`, `/xmlrpc.php`, `/feed` | 410 |

## 13. Legacy query parameters

- **Changed:**
  - WooCommerce parameters are removed with a 301, and on an old URL in the same 301 as the path redirect: `v`,
    `add-to-cart`, `variation_id`, `orderby`, `paged`, `product-page`, `post_type`, `wc-ajax`, `replytocom`, `amp`,
    `attribute_*`, `filter_*`, `query_type_*` and the BerqWP cache plugin's `berqwp_*`.
  - Campaign parameters (`utm_*`, `gclid`, `fbclid`, `msclkid`) are kept, so attribution survives.
  - Any other parameter leaves the page's canonical unchanged.
- **Verified:**

  | Request | Result |
  | --- | --- |
  | `/product/ekhonung/?v=…` | 301 → `/sv/product/ekhonung` |
  | `/en/product/ekhonung?v=1&utm_source=newsletter` | 301 → `/en/product/ekhonung?utm_source=newsletter` |
  | `/en/product/ekhonung/?add-to-cart=2694` | 301 → `/en/product/ekhonung` |
  | `/shop/?orderby=price` | 301 → `/sv/shop` |
  | `/en?berqwp_request_cache&v=efad7abb323e&add-to-cart=179` | 301 → `/en` |

  Each ends in 200 with a self-canonical.

## 14. Redirect chains and loops

- **Automated:** `npm run seo:audit` follows every legacy URL hop by hop (up to 10) and fails on:
  - more than one redirect;
  - any temporary redirect (other than `/`);
  - any loop;
  - any redirect ending in anything but an indexable 200, or a deliberate 410.
- **Result:** 0 chains, 0 loops across the 107 URLs.
  - Before deploy: 7 two-hop chains (all ending in a 404), 2 single redirects to a 404, and 8 direct 404s where a
    410 or a redirect was due.
  - The trailing slash, the path and the parameter clean-up now happen in one 301.

## 15. Internal links

- **Verified:** the crawl follows every `<a href>` on every page: navigation, footer, product cards, breadcrumbs,
  related products, category tabs, the language switcher and information pages.
- **Result:** 90 distinct internal URLs, all answering 200 directly, with 0 links through redirects and 0 links to
  4xx/5xx pages ([`results/local/links.csv`](results/local/links.csv)). The category links that used to point at
  canonicalised filter URLs now point at category pages (point 4).

## 16. Metadata site-wide

- **Export:** [`results/local/pages.csv`](results/local/pages.csv), one row per page (90). Columns: URL, status,
  indexability, title and length, description and length, H1 count and text, canonical, hreflang, `og:url`,
  `og:title`, `og:image`.
- **Checks:**
  - no missing or duplicate titles or descriptions;
  - exactly one H1 per page;
  - no canonicals to redirects or 404s;
  - no cross-language canonicals;
  - no missing hreflang return links;
  - no wrong host.

  All 0.
- **Notes:**
  - Titles are 26–92 characters. 12 are over 60 characters: the home page in the 3 languages, and 9 product pages
    whose names are long (e.g. "Naturbox: Flowers & Herbs Honey, Oregano Honey & Thyme Honey"). Google shortens
    those in results. Shorter names are a content decision; I have not changed product names.
  - Descriptions are 65–160 characters. The two shortest are category descriptions (see point 4).

## 17. Google Search Console

- **Needs your access.** I can't see the property. After deploy, please either give me access (Full user) or do this:
  1. Sitemaps: remove any old WordPress/Yoast sitemap, then submit
     `https://www.mattheosselections.com/sitemap.xml`. Old sitemap URLs also 301 to it now.
  2. Make sure the property covers the www host (a Domain property covers both).
  3. After about 1–2 weeks, export Page indexing (all reasons listed in your point 17) and Performance → Pages. I
     will go through them: every "Not found (404)", "Page with redirect" and "Duplicate…" URL goes into
     `legacy-urls.csv` and gets a rule or an explanation.

## 18. Legacy URLs against organic data

- **Needs the Search Console export** (point 17), plus backlink data if you have it.
  - The article decisions (point 3) and the old category slugs (point 4) are set up so that this data changes one
    line each.
  - I have not guessed traffic or backlinks.

## 19. Performance and Core Web Vitals

- **Measured (before these changes):**
  - Google's PageSpeed API refused keyless requests, so Lighthouse 13.5 ran locally with the same simulated
    throttling PSI uses.
  - Mobile scores: home 71, shop 60, product 72, with LCP about 5.4–5.5 s. Desktop: 96–99.
  - CLS was 0 on every page, and there are no third-party scripts on storefront pages.
  - Field data (CrUX) was not available without an API key.
- **Fixed:**
  - **Fonts:** every page preloaded 9 font files (383 KB), including Greek and Latin Extended. It now preloads only
    3 Latin files. Greek pages still get the Greek fonts through their `unicode-range`; I checked this in the built
    CSS. (`src/app/fonts.js`)
  - **Main image priority:** the main image (hero slide, page banner, product image) now has `fetchPriority="high"`
    and eager loading. Shop product cards are no longer preloaded, because they compete with the banner on mobile.
  - **Product image fade-in:** the product image faded in from invisible, so Chrome did not count it as the main
    content (LCP). It now shows at once, and only a size change fades. (`ProductDetails`)
  - **Image cache:** optimised local images got `max-age=0` from Vercel. Browsers may now cache them for 31 days
    (`next.config.mjs`).
- **Recommended next (not done; worthwhile but bigger changes):**
  - Load the login, quick-view and search overlays on demand.
  - Build Bootstrap from Sass with only the components used; 92% of its CSS is unused.
  - Render the shop's first page statically. It is rendered per request today; product and home pages are already
    static and cached.
  - Send only the translation strings client components use.
- **Outstanding:** re-measure on production after deploy. Please add a PageSpeed API key or enable Vercel Speed
  Insights so field data (LCP/CLS/INP at p75) can be reported.

## 20. Images and product media

- **Verified:**
  - Product images use the product name as alt text; decorative duplicates use `alt=""`.
  - Every `fill` image sits in a sized box (CLS 0).
  - Sizes are served per viewport, off-screen images are lazy, and product images come from Cloudinary.
  - No image or page depends on the old WordPress site: 0 `wp-content` URLs in the database, in the live HTML of the
    home, shop and product pages, or in the code (apart from the redirect rules that answer them).
  - JSON-LD images are absolute and answer 200.
- **Fixed:** product and category link previews used the square 1000×1000 original, with no size or alt text, so it
  was cropped in large previews. They now use a 1200×630 padded version from Cloudinary with
  `og:image:width`/`height`/`alt`.

## 21. Deployment

- **Needs Vercel access or a check on your side.** I have no Vercel access from here, and during the production crawl
  Vercel's firewall started challenging my IP (`x-vercel-mitigated: challenge`; verified search-engine bots are
  exempt). What I can confirm:
  - The live site still builds URLs from the non-www host, so it runs code from before this change.
  - GitHub `main` is at `2326721`.
- **To confirm after deploy (Vercel → Project → Deployments):**
  - the production deployment's commit is the one containing these changes, from branch `main`;
  - its environment variables are `MONGODB_URI`, `MONGODB_DB`, `KUSTOM_*`, `SMTP_*`, `ADMIN_EMAIL` and
    `GOOGLE_CLIENT_ID`;
  - Domains: `www.mattheosselections.com` is primary and `mattheosselections.com` redirects to it with 308.

  Then run the audit against production (point 1). `curl` tests showed that nothing else at the CDN or proxy level
  changes redirects or canonicals.

## 22. "Confirm with client/accountant" — see Appendix B

## 23. E-commerce end-to-end

- **Reviewed and tested:**
  - I traced the full flow in the code: product → size → stock → cart → quantity → shipping → VAT → Kustom checkout
    → payment → order → emails. Each scenario you listed is in Appendix C.
  - I ran the shipping, VAT, order-line and capture calculations on representative carts: single and multiple items,
    the 798 / 799 / 800 kr boundary, international orders, and 6% rounding. VAT per Kustom line was within Kustom's
    rounding rule on 30,000 generated lines.
- **Bugs found and fixed:**
  1. **Cart showed an old price.** After a price change in the admin, the cart and "Place order" button showed the
     price from when the item was added; Kustom charged the new one. The cart now uses the live price.
     (`src/context/CartContext.js`, `CartLine.js`)
  2. **An interrupted order was never finished.** If the server stopped between creating the order and taking its
     items out of stock, the order stayed "pending": stock was never deducted and no emails were sent.
     - Now an interrupted order is completed by Kustom's next push or confirmation. Exactly one request can claim it,
       after a 15-minute lease.
     - Stock taken part-way through a failed reservation is put back.

     (`src/server/domain/payments.js`, `inventory.js`, `Order` model)
  3. **Wrong free-shipping message.** The cart said "You have unlocked free shipping!" from 799 kr for every country,
     but abroad the threshold is different. The text now says "free shipping in Sweden", in all 3 languages.
  4. **A cancelled Kustom order could be shipped without payment.** An order whose payment reservation had been
     released could be reopened and marked shipped with no charge. This is now refused. The Kustom payment status can
     no longer be changed by hand either, since it follows the order status. (`settlement.js`, `orders.js`, admin
     order page)
  5. **The payment dialog could be closed by mistake.** A tap outside it or Esc during payment (e.g. while in Swish or
     BankID) closed it. Now only the close button does.
  6. **Validation:**
     - prices are limited to 2 decimals, since a third made Kustom's authorised and captured amounts disagree by 1 öre;
     - size keys are limited to 39 characters, to fit Kustom's 64-character line reference;
     - the checkout language only accepts en / sv / el;
     - a Kustom amount that differs from our total is flagged on the order for the admin.
- **Outstanding:** the live payment tests in Appendix C. They need a Vercel preview with Kustom's playground, opened
  from an EU network, because Kustom refuses requests from outside its supported regions.

## 24. Error handling and security

| Check | Verdict | Evidence / change |
| --- | --- | --- |
| Secrets client-side | **Fixed** | No `NEXT_PUBLIC_` secrets, and every server module is `server-only`. But the untracked `.env.example`, which `.gitignore` lets you commit, contained the **real SMTP and MongoDB credentials**. They are now blanked; they were never committed. I recommend changing the mailbox password as a precaution. |
| Admin/API access control | OK | All 33 route files checked: every `/api/admin/*` route requires an admin, re-checked against the database on every request; admin sign-in is Google-only. |
| Server-side validation | OK, tightened | Every body is validated with zod. Checkout language is restricted, search length capped, and the Kustom push id checked. |
| Price manipulation | OK | The browser sends only product ids and quantities. Prices, stock and totals come from the database, and Kustom's order lines are built from them. |
| Server-side amounts | OK | The order comes from the server-side checkout snapshot; capture uses the stored total; a mismatch with Kustom is now flagged on the order. |
| Rate limiting | **Added** | New `rateLimit` option on API routes, counted per IP in MongoDB (works across serverless instances). Login 10 / 10 min, register 5 / h, checkout 20 / 10 min, stock alerts 10 / h, contact and newsletter 5 / 10 min. It fails open, so a limiter problem never blocks an order. |
| Spam protection | **Extended** | Honeypot on contact and newsletter, now also on "notify me when back in stock" (which sends email). Plus the rate limits. |
| Inventory not trusted from the browser | OK | Stock is re-checked on the server and taken atomically (no overselling), and Kustom's last check before payment re-checks it again. |
| Production errors | OK | Unknown errors return a generic 500 and are logged on the server; Kustom errors become a generic 503. |
| Other | **Added** | `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, no `X-Powered-By`. Failed logins now take the same time whether or not the email exists, so response times no longer reveal registered emails. |

---

## Appendix A — migration table

[`results/local/legacy-redirects.csv`](results/local/legacy-redirects.csv): every old URL checked, with its content
type, new URL, redirect status, number of hops, final status, canonical, indexability and verdict.
[`results/production-before-deploy/legacy-redirects.csv`](results/production-before-deploy/legacy-redirects.csv) is
the same list against the live site today, for comparison.

## Appendix B — open business decisions (point 22)

| File → location | Outstanding question | Current behaviour | Decision required |
| --- | --- | --- | --- |
| `src/config/site.js` → `storeConfig.shipping.international` | Shipping outside Sweden | 290 kr, free from 2,000 kr. **The terms and FAQ say 25 EUR, free over 179 EUR** (≈ 250 kr / 1,790 kr). | The fee and free-shipping threshold in SEK. Code or terms are then aligned. |
| same → `shipping.domestic` | Is exactly 799 kr free? | 798 kr → 69 kr shipping; 799 kr → free. The copy says "over 799 kr". | Keep "from 799" (and change the copy to "from"), or require more than 799. |
| `src/utils/shipping.js` → `SHIPPING_COUNTRIES` | Which countries are sold to | 16 countries besides Sweden, including non-EU Norway, Switzerland and the UK, all at the international rate. | Confirm the list, and whether to sell to NO/CH/GB (customs, VAT on import). |
| `src/config/site.js` → `vatRate` | VAT on food | 6% on every order, fixed. The comment says 6% only from 1 Apr 2026 to 31 Dec 2027 (12% before and after), but **the code does not switch by date**. | Accountant: confirm 6%, and approve an automatic switch to 12% from 1 Jan 2028. |
| `src/server/domain/payments.js` → shipping line | VAT on shipping | Shipping is sent to Kustom at 6%. | Accountant: VAT rate for shipping. |
| `Product` model (no VAT field) | Non-food products | Everything is 6%, including beeswax cream and propolis. If a cosmetic is 25%, the VAT declared on a 199 kr item is 11.26 kr instead of 39.80 kr. | The VAT rate of each product. A per-product rate is needed if any is not 6%. |
| `src/content/terms.js` → VAT section | VAT abroad | The terms say 6% for all customers abroad, and mention a VAT number for companies. The shop charges Swedish 6% everywhere and never asks for a VAT number. | Accountant: EU One-Stop-Shop, 0% on exports to NO/CH/GB, reverse charge for EU companies. |
| `src/config/site.js` → `sekPerEuro` | Euro display | Prices show "Approx. €" as kr ÷ 10, as on the WordPress site. | Keep the flat 10 (yes/no). |
| `src/content/privacy.js` header | Privacy policy | Written from what the site does; published. | Legal review / your sign-off. |
| `src/i18n/translations/*` | UI wording | Swedish and Greek wording is live. | Your approval of the sv/el text. |
| `src/components/auth/ForgotPasswordForm.js` | Password reset | **The form tells the customer a reset link is on its way but sends nothing.** | Build password reset (email is now configured), or hide the link. |
| README → Kustom B2B | Company checkout | If B2B is not activated on the Kustom account, company customers fall back to buying as private customers. | Has B2B been requested from Kustom? |
| Admin → Categories | Category text | Descriptions are now public intro and meta text (point 4). | Rewrite them for customers. |

## Appendix C — e-commerce scenarios (point 23)

| Scenario | How it is handled | Verdict |
| --- | --- | --- |
| Product → size | Only active products and existing sizes can be ordered; the server rejects others with the item named. | OK |
| Prices | Recalculated from the database on the server; the browser's prices are ignored. | OK |
| Cart price after a price change | Now the live price (was the price when added). | **Fixed** |
| Quantity vs stock | Capped when adding and in the cart; the server re-checks the whole cart, including pack contents. | OK |
| Out of stock | Warning in the cart, checkout disabled, "notify me" form. | OK |
| Final unit, two buyers at once | Stock is taken with an atomic conditional update; the second buyer's payment reservation is cancelled automatically and the order recorded as cancelled. | OK (needs a live test) |
| Sold out while paying | Kustom's last check before payment re-checks stock. | OK (needs a live test) |
| Multiple products | Lines priced and stocked together; all or nothing. | OK |
| Invalid input | Rejected by zod on the server with field errors. | OK, tightened |
| Payment declined or cancelled | Nothing is reserved before payment; Kustom expires the checkout. | OK (needs a live test) |
| Duplicate submission | One order per Kustom order, enforced by a unique index; the confirmation page and Kustom's push can arrive in any order; emails sent once. | OK |
| Interrupted order | Now completed by the next confirmation or push. | **Fixed** |
| Shipping rules | 69 kr in Sweden, free from 799 kr; 290 kr abroad, free from 2,000 kr (see Appendix B). | As configured |
| VAT | 6% per line, included in prices; within Kustom's rounding rule. | OK (see Appendix B) |
| Order totals / capture | The captured amount equals the authorised amount. New prices are limited to 2 decimals; all 32 current prices already are. | **Fixed** |
| Languages | Kustom in Swedish for sv, English otherwise (Kustom has no Greek). Emails in the customer's language. | OK |
| Mobile | The payment dialog no longer closes on stray taps. | **Fixed** (needs a live test) |

**Live tests to run** (Vercel preview + Kustom playground, from an EU network):

1. Pay with a test card, Swish and Klarna. The order should appear as "authorized". Ship → captured; cancel →
   released or refunded.
2. Close the tab before the confirmation page. The order and emails should still arrive via Kustom's push.
3. Set stock to 0 while the checkout is open, then pay. Payment should be refused.
4. Two browsers buy the last unit at the same time. Expect one order, and one automatically cancelled order.
5. Go back to the confirmation URL. Expect no second order and no second email.
6. Decline a payment, and close the dialog during payment. Expect no order and no stock change.
7. On iOS Safari and Android Chrome, switch to Swish or BankID and back.
8. Delivery to DE, NO and GB: check the shipping fee and which payment methods are offered.
9. Buy as a company.
10. Check emails in sv, en and el.

---

## What I need from you

1. **Deploy approval.** After deployment I run the production audit and add `results/production/`.
2. **Search Console access** (or the exports in point 17) to finish points 2, 3, 4 (old category slugs), 17 and 18.
3. **Decisions in Appendix B.** Shipping abroad and VAT are the urgent ones.
4. **Category descriptions** rewritten in the admin (point 4).
5. **A PageSpeed API key or Vercel Speed Insights,** for field Core Web Vitals.
6. **A change of the info@ mailbox password,** as a precaution (point 24).
