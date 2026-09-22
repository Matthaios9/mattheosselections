import { notFound } from 'next/navigation';
import { PiPackage, PiSealCheck, PiTruck } from 'react-icons/pi';
import JsonLd from '@/components/common/JsonLd';
import PageHero from '@/components/common/PageHero';
import ShopCatalog from '@/components/shop/ShopCatalog';
import { sortFromParams } from '@/constants/shop';
import { localizePath } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { breadcrumbJsonLd, pageMetadata, shareImage } from '@/i18n/metadata';
import { interpolate } from '@/i18n/translate';
import { getStoreCategory, searchStoreProducts } from '@/server/domain/storefront';
import styles from '../page.module.css';

const PERK_ICONS = [PiTruck, PiPackage, PiSealCheck];

/**
 * A category's own page (/sv/shop/ra-honung): an indexable landing page with its own title,
 * description, heading and products, reached from the shop tabs, menus, footer and product
 * breadcrumbs. Sorting (?sort=) keeps this page as canonical.
 */
export async function generateMetadata({ params }) {
  const { lang, category: slug } = await params;
  const [{ dict }, category] = await Promise.all([getDictionary(lang), getStoreCategory(slug, lang)]);
  if (!category) return {};
  return {
    ...pageMetadata({
      dict,
      locale: lang,
      path: `/shop/${category.slug}`,
      title: category.name,
      description: category.description || interpolate(dict.meta.category.description, { category: category.name }),
      image: shareImage(category.image, category.name),
    }),
    // A category without products is kept out of search results (and the sitemap) until it has some.
    ...(category.count === 0 && { robots: { index: false, follow: true } }),
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const [{ lang, category: slug }, query] = await Promise.all([params, searchParams]);
  const [{ dict }, category] = await Promise.all([getDictionary(lang), getStoreCategory(slug, lang)]);
  if (!category) notFound();

  const sort = sortFromParams({ sort: Array.isArray(query.sort) ? query.sort[0] : query.sort });
  const initial = await searchStoreProducts({ locale: lang, category: category.id, sort });
  const breadcrumbs = [
    { label: dict.nav.home, href: localizePath('/', lang) },
    { label: dict.nav.shop, href: localizePath('/shop', lang) },
    { label: category.name },
  ];

  return (
    <>
      <PageHero
        size="sm"
        image="/images/editorial/honeycomb-warm.jpg"
        eyebrow={dict.shop.hero.eyebrow}
        title={category.name}
        text={category.description}
        breadcrumbs={breadcrumbs}
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
      <ShopCatalog key={`${category.id}:${sort}`} initial={initial} category={category} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbs, localizePath(`/shop/${category.slug}`, lang))} />
    </>
  );
}
