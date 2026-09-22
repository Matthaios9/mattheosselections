import { permanentRedirect } from 'next/navigation';
import { PiPackage, PiSealCheck, PiTruck } from 'react-icons/pi';
import PageHero from '@/components/common/PageHero';
import ShopCatalog from '@/components/shop/ShopCatalog';
import { filtersFromParams, filtersToParams, sortFromParams } from '@/constants/shop';
import { localizePath } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pageMetadata } from '@/i18n/metadata';
import { getStoreCategories, searchStoreProducts, storeQueryToOptions } from '@/server/domain/storefront';
import styles from './page.module.css';

const PERK_ICONS = [PiTruck, PiPackage, PiSealCheck];

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const { dict } = await getDictionary(lang);
  // Sorted and searched views all point at the plain shop page as canonical; categories have their own pages.
  return pageMetadata({ dict, locale: lang, path: '/shop', title: dict.meta.shop.title, description: dict.meta.shop.description });
}

const EMPTY_RESULT = { items: [], total: 0, page: 1, pageSize: 0, pages: 1 };

/** First page of results for the search and sort in the URL, rendered on the server (SEO, no loading flash). */
async function loadFirstPage(locale, searchParams) {
  try {
    const filters = { ...filtersFromParams(searchParams), category: 'all' };
    const query = filtersToParams(filters, sortFromParams(searchParams));
    return await searchStoreProducts(storeQueryToOptions({ ...query, locale }));
  } catch (error) {
    console.error('[shop] Could not load products:', error.message);
    return EMPTY_RESULT;
  }
}

export default async function ShopPage({ params, searchParams }) {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  const { dict } = await getDictionary(lang);
  const flat = Object.fromEntries(Object.entries(query).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  // Links from before categories had their own pages (/shop?category=<id>) → that category's page.
  if (flat.category) {
    const categories = await getStoreCategories(lang);
    const category = categories.find((item) => item.id === flat.category);
    if (category) {
      const { category: _id, ...rest } = flat;
      const search = new URLSearchParams(rest).toString();
      permanentRedirect(`${localizePath(`/shop/${category.slug}`, lang)}${search ? `?${search}` : ''}`);
    }
  }
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
