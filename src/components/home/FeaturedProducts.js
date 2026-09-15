'use client';

import { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import { PiArrowRight } from 'react-icons/pi';
import ButtonLink from '@/components/common/ButtonLink';
import Reveal from '@/components/common/Reveal';
import SectionHeading from '@/components/common/SectionHeading';
import ProductGrid from '@/components/product/ProductGrid';
import { useCatalog } from '@/context/CatalogContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useI18n } from '@/i18n/I18nProvider';
import { getStoreProducts } from '@/services/product';
import styles from './FeaturedProducts.module.css';

/** Query for one tab: featured products, everything, or one category — best sellers first. */
const tabQuery = (tab) => (tab === 'featured' ? { featured: true } : tab === 'all' ? {} : { category: tab });

/**
 * "Featured" (flagged in the admin) plus a tab for each of the first categories that have products.
 * The first tab is rendered on the server (`initial`); other tabs load from the products API.
 */
export default function FeaturedProducts({ initial }) {
  const { t, href, locale } = useI18n();
  const { categories } = useCatalog();
  const [tab, setTab] = useState('featured');
  // With nothing flagged as featured, the "Featured" tab shows the best sellers instead.
  const activeTab = tab === 'featured' ? initial.tab : tab;
  const products = useApiQuery(
    ['home-featured', activeTab, locale],
    () => getStoreProducts({ locale, sort: 'popularity', pageSize: 8, ...tabQuery(activeTab) }),
    { initialData: { items: initial.items } }
  );

  if (!initial.items.length) return null;

  const tabs = [
    { key: 'featured', label: t('home.featured.tabs.featured') },
    ...categories
      .filter((category) => category.count > 0)
      .slice(0, 3)
      .map((category) => ({ key: category.id, label: category.name })),
  ];
  const visible = products.data?.items ?? [];

  return (
    <section className="section bg-sand">
      <Container>
        <Reveal>
          <SectionHeading
            align="split"
            eyebrow={t('home.featured.eyebrow')}
            title={t('home.featured.title')}
            text={t('home.featured.text')}
            action={
              <ButtonLink href={href('/shop')} variant="ms-outline">
                {t('home.featured.cta')}
                <PiArrowRight className="btn-icon btn-icon-shift flip-rtl" aria-hidden="true" />
              </ButtonLink>
            }
          />
        </Reveal>

        {tabs.length > 1 && (
          <Nav as="div" role="tablist" activeKey={tab} onSelect={(key) => key && setTab(key)} className={styles.tabs}>
            {tabs.map((item) => (
              <Nav.Link
                key={item.key}
                as="button"
                type="button"
                role="tab"
                eventKey={item.key}
                aria-selected={tab === item.key}
                className={styles.tab}
              >
                {item.label}
              </Nav.Link>
            ))}
          </Nav>
        )}

        <div key={activeTab} className={styles.panel} role="tabpanel">
          <ProductGrid products={visible} />
        </div>
      </Container>
    </section>
  );
}
