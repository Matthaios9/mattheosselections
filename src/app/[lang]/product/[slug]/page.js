import { notFound } from 'next/navigation';
import Container from 'react-bootstrap/Container';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import SectionHeading from '@/components/common/SectionHeading';
import ProductDetails from '@/components/product/ProductDetails';
import ProductGrid from '@/components/product/ProductGrid';
import { siteConfig, storeConfig } from '@/config/site';
import { localizePath } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pageMetadata } from '@/i18n/metadata';
import { getProductSlugs, getRelatedProducts, getStoreProduct } from '@/server/domain/storefront';
import styles from './page.module.css';

export async function generateStaticParams() {
  try {
    return (await getProductSlugs()).map(({ slug }) => ({ slug }));
  } catch (error) {
    console.error('[product] Could not list products to prerender:', error.message);
    return [];
  }
}

/** First sentence(s) of the description, cut at a word boundary for the meta description. */
function summary(text, max = 160) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, clean.lastIndexOf(' ', max - 1))}…`;
}

const absolute = (url) => (url.startsWith('http') ? url : `${siteConfig.url}${url}`);

export async function generateMetadata({ params }) {
  const { lang, slug } = await params;
  const { dict } = await getDictionary(lang);
  const product = await getStoreProduct(slug, lang);
  if (!product) return {};
  return pageMetadata({
    dict,
    locale: lang,
    path: `/product/${product.slug}`,
    title: product.name,
    description: summary(product.description) || dict.meta.shop.description,
    image: absolute(product.image),
    available: product.locales,
  });
}

/** schema.org Product + BreadcrumbList, so search results can show price and availability. */
function structuredData(product, breadcrumbs, url) {
  const offers = product.variants.map((variant) => ({
    '@type': 'Offer',
    name: variant.label,
    url,
    price: variant.price.toFixed(2),
    priceCurrency: storeConfig.currency,
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: variant.price.toFixed(2),
      priceCurrency: storeConfig.currency,
      valueAddedTaxIncluded: true,
    },
    availability: variant.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
  }));
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description || undefined,
      image: [...new Set([product.image, ...product.variants.map((variant) => variant.image)])].map(absolute),
      sku: product.sku || undefined,
      category: product.categoryName || undefined,
      brand: { '@type': 'Brand', name: siteConfig.name },
      url,
      offers,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        item: item.href ? absolute(item.href) : url,
      })),
    },
  ];
}

export default async function ProductPage({ params }) {
  const { lang, slug } = await params;
  const { dict } = await getDictionary(lang);
  const product = await getStoreProduct(slug, lang);
  if (!product) notFound();

  const shop = localizePath('/shop', lang);
  const breadcrumbs = [
    { label: dict.nav.home, href: localizePath('/', lang) },
    { label: dict.nav.shop, href: shop },
    ...(product.category ? [{ label: product.categoryName, href: `${shop}?category=${product.category}` }] : []),
    { label: product.name },
  ];
  const related = await getRelatedProducts(product, lang).catch(() => []);
  const json = JSON.stringify(structuredData(product, breadcrumbs, absolute(localizePath(`/product/${product.slug}`, lang))));

  return (
    <>
      <section className={styles.wrap}>
        <Container>
          <Breadcrumbs items={breadcrumbs} className={styles.breadcrumbs} />
          <ProductDetails product={product} />
        </Container>
      </section>

      {related.length > 0 && (
        <section className="section bg-sand">
          <Container>
            <SectionHeading eyebrow={product.categoryName} title={dict.product.related} />
            <ProductGrid products={related} />
          </Container>
        </section>
      )}

      {/* "<" is escaped so product text can never close the script tag. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json.replace(/</g, '\\u003c') }} />
    </>
  );
}
