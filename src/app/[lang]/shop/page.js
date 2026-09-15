import { PiArrowCounterClockwise, PiPackage, PiTruck } from 'react-icons/pi';
import PageHero from '@/components/common/PageHero';
import ShopCatalog from '@/components/shop/ShopCatalog';
import { filtersFromParams, filtersToParams, sortFromParams } from '@/constants/shop';
import { localizePath } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { getStoreCategories, searchStoreProducts, storeQueryToOptions } from '@/server/domain/storefront';
import styles from './page.module.css';

const PERK_ICONS = [PiTruck, PiPackage, PiArrowCounterClockwise];

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const { dict } = await getDictionary(lang);
  return { title: dict.meta.shop.title, description: dict.meta.shop.description };
}

const EMPTY_RESULT = { items: [], total: 0, page: 1, pageSize: 0, pages: 1, facets: { category: {}, price: {}, size: {}, sizes: [] } };

/** First page of results for the requested filters, rendered on the server (SEO, no loading flash). */
async function loadFirstPage(locale, searchParams) {
  try {
    const categories = await getStoreCategories(locale);
    const parsed = filtersFromParams(searchParams);
    // Same rule as the client: an unknown category shows everything.
    const filters = categories.some((category) => category.id === parsed.category) ? parsed : { ...parsed, category: 'all' };
    const query = filtersToParams(filters, sortFromParams(searchParams));
    return await searchStoreProducts(storeQueryToOptions({ ...query, locale, facets: '1' }));
  } catch (error) {
    console.error('[shop] Could not load products:', error.message);
    return EMPTY_RESULT;
  }
}

export default async function ShopPage({ params, searchParams }) {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  const { dict } = await getDictionary(lang);
  const flat = Object.fromEntries(Object.entries(query).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  const initial = await loadFirstPage(lang, flat);

  return (
    <>
      <PageHero
        size="sm"
        image="/images/editorial/honeycomb-warm.jpg"
        eyebrow={dict.shop.hero.eyebrow}
        title={dict.shop.hero.title}
        text={dict.shop.hero.text}
        breadcrumbs={[{ label: dict.nav.home, href: localizePath('/', lang) }, { label: dict.nav.shop }]}
      >
        <ul className={styles.perks}>
          {dict.shop.perks.map((perk, index) => {
            const Icon = PERK_ICONS[index % PERK_ICONS.length];
            return (
              <li key={perk}>
                <Icon aria-hidden="true" /> {perk}
              </li>
            );
          })}
        </ul>
      </PageHero>
      {/* Keyed on the query so header search / mega-menu links start from the server-rendered results. */}
      <ShopCatalog key={JSON.stringify(flat)} initial={initial} />
    </>
  );
}
