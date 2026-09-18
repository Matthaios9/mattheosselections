'use client';

import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import { PiHandbagSimple, PiMagnifyingGlass, PiX } from 'react-icons/pi';
import ProductSort from './ProductSort';
import ProductGrid from '@/components/product/ProductGrid';
import { storeConfig } from '@/config/site';
import { DEFAULT_SORT, filtersFromParams, filtersToParams, sortFromParams } from '@/constants/shop';
import { useCatalog } from '@/context/CatalogContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useUrlParams } from '@/hooks/useUrlParams';
import { useI18n } from '@/i18n/I18nProvider';
import { getStoreProducts } from '@/services/product';
import styles from './ShopCatalog.module.css';

const PAGE_SIZE = storeConfig.shopPageSize;

/**
 * The shop: category tabs (All Products by default), sorting and "load more" — kept simple for a
 * small collection. Results are filtered and paginated on the server (GET /api/products); the URL
 * (?category=&sort=, plus ?q= from the header search) is the source of truth, so views are shareable.
 * `initial` is the first page rendered on the server for the same URL.
 */
export default function ShopCatalog({ initial }) {
  const { t, locale } = useI18n();
  const { categories } = useCatalog();
  const [params, setParams] = useUrlParams();

  const parsed = filtersFromParams(params);
  // Links to a category that is no longer visible fall back to "all".
  const filters = categories.some((category) => category.id === parsed.category) ? parsed : { ...parsed, category: 'all' };
  const sort = sortFromParams(params);
  const request = { locale, ...filtersToParams(filters, sort), pageSize: PAGE_SIZE };
  const requestKey = JSON.stringify(request);

  const firstPage = useApiQuery(['shop', request], () => getStoreProducts(request), { initialData: initial });
  const result = firstPage.data;

  // Pages added with "Load more" belong to one exact query; a new query starts again at page 1.
  const [more, setMore] = useState({ key: requestKey, items: [], page: 1 });
  const extra = more.key === requestKey ? more : { key: requestKey, items: [], page: 1 };
  const [loadingMore, setLoadingMore] = useState(false);
  const shown = [...(result?.items ?? []), ...extra.items];
  const total = result?.total ?? 0;
  const filtered = filters.category !== 'all' || Boolean(filters.query);

  // Replace (not push): switching tabs doesn't pile up in the browser history.
  const updateFilters = (patch) => setParams(filtersToParams({ ...filters, ...patch }, sort), { replace: true });
  const updateSort = (value) => setParams({ sort: value === DEFAULT_SORT ? '' : value }, { replace: true });

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = await getStoreProducts({ ...request, page: extra.page + 1 });
      setMore({ key: requestKey, items: [...extra.items, ...next.items], page: extra.page + 1 });
    } catch {
      // Keep the current list; the button stays available to retry.
    } finally {
      setLoadingMore(false);
    }
  };

  const tabs = [{ id: 'all', name: t('shop.filters.allCategories') }, ...categories];

  return (
    <section className={styles.shop}>
      <Container>
        <div className={styles.toolbar}>
          {categories.length > 0 && (
            <nav className={styles.tabs} aria-label={t('shop.toolbar.categories')}>
              {tabs.map((category) => {
                const active = filters.category === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    className={`${styles.tab} ${active ? styles.tabActive : ''}`}
                    onClick={() => updateFilters({ category: category.id })}
                    aria-pressed={active}
                  >
                    {category.name}
                  </button>
                );
              })}
            </nav>
          )}
          <ProductSort value={sort} onChange={updateSort} />
        </div>

        {filters.query && (
          <button
            type="button"
            className={styles.searchChip}
            onClick={() => updateFilters({ query: '' })}
            aria-label={`${t('shop.filters.clearSearch')}: ${filters.query}`}
          >
            <PiMagnifyingGlass aria-hidden="true" />
            {t('shop.filters.searchChip', { query: filters.query })}
            <PiX aria-hidden="true" />
          </button>
        )}

        <div className={firstPage.loading ? styles.loading : undefined} aria-busy={firstPage.loading}>
          {total === 0 && !filtered && !firstPage.loading ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>
                <PiHandbagSimple aria-hidden="true" />
              </span>
              <h3 className={styles.emptyTitle}>{t('shop.emptyCatalog.title')}</h3>
              <p className={styles.emptyText}>{t('shop.emptyCatalog.text')}</p>
            </div>
          ) : total === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>
                <PiHandbagSimple aria-hidden="true" />
              </span>
              <h3 className={styles.emptyTitle}>{t('shop.empty.title')}</h3>
              <p className={styles.emptyText}>{t('shop.empty.text')}</p>
              <Button variant="ms-dark" className="btn-block-mobile" onClick={() => updateFilters({ query: '', category: 'all' })}>
                {t('shop.empty.cta')}
              </Button>
            </div>
          ) : (
            <>
              <ProductGrid products={shown} preloadCount={4} />
              {shown.length < total && (
                <div className={styles.pagination}>
                  <Button variant="ms-outline" size="lg" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore && <Spinner animation="border" size="sm" aria-hidden="true" />}
                    {t('shop.loadMore')}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
