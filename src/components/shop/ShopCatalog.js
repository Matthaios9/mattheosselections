'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Offcanvas from 'react-bootstrap/Offcanvas';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Spinner from 'react-bootstrap/Spinner';
import { PiHandbagSimple, PiMagnifyingGlass, PiSlidersHorizontal, PiX } from 'react-icons/pi';
import ActiveFilters from './ActiveFilters';
import ProductFilters from './ProductFilters';
import ProductSearch from './ProductSearch';
import ProductSort from './ProductSort';
import ProductGrid from '@/components/product/ProductGrid';
import { storeConfig } from '@/config/site';
import { countActiveFilters, DEFAULT_FILTERS, DEFAULT_SORT, filtersFromParams, filtersToParams, sortFromParams } from '@/constants/shop';
import { useCatalog } from '@/context/CatalogContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useUrlParams } from '@/hooks/useUrlParams';
import { useI18n } from '@/i18n/I18nProvider';
import { getStoreProducts } from '@/services/product';
import styles from './ShopCatalog.module.css';

const PAGE_SIZE = storeConfig.shopPageSize;
const EMPTY_FACETS = { category: {}, price: {}, size: {}, sizes: [] };

/**
 * The shop: search, filters, sort and "load more". Filtering, sorting, option counts
 * and pagination all happen on the server (GET /api/products); the URL
 * (?q=&category=&price=&sizes=&stock=&sort=) is the source of truth, so views are shareable.
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

  const firstPage = useApiQuery(['shop', request], () => getStoreProducts({ ...request, facets: 1 }), {
    initialData: initial,
  });
  const result = firstPage.data;
  const facets = result?.facets ?? EMPTY_FACETS;

  // Pages added with "Load more" belong to one exact query; a new query starts again at page 1.
  const [more, setMore] = useState({ key: requestKey, items: [], page: 1 });
  const extra = more.key === requestKey ? more : { key: requestKey, items: [], page: 1 };
  const [loadingMore, setLoadingMore] = useState(false);
  const shown = [...(result?.items ?? []), ...extra.items];
  const total = result?.total ?? 0;
  const activeCount = countActiveFilters(filters);

  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState(filters.query);
  const debouncedSearch = useDebouncedValue(searchText, 300);

  const updateFilters = (patch) => {
    if ('query' in patch) setSearchText(patch.query);
    // Replace (not push): filter tweaks don't pile up in the browser history.
    setParams(filtersToParams({ ...filters, ...patch }, sort), { replace: true });
  };
  const updateSort = (value) => setParams({ sort: value === DEFAULT_SORT ? '' : value }, { replace: true });
  const clearAll = () => updateFilters({ ...DEFAULT_FILTERS });

  // Search as you type, once typing pauses.
  const syncSearch = useEffectEvent((text) => {
    if (text.trim() !== filters.query) setParams({ q: text.trim() }, { replace: true });
  });
  useEffect(() => {
    syncSearch(debouncedSearch);
  }, [debouncedSearch]);

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

  const filterPanel = (idPrefix) => (
    <ProductFilters
      filters={filters}
      onChange={updateFilters}
      categories={categories}
      sizes={facets.sizes}
      counts={facets}
      idPrefix={idPrefix}
    />
  );

  return (
    <section className={styles.shop}>
      <Container>
        {/* Category quick-links (tablet & mobile) */}
        {categories.length > 0 && (
          <div className={`d-lg-none ${styles.chips}`}>
            {[{ id: 'all', name: t('shop.filters.allCategories') }, ...categories].map((category) => (
              <button
                key={category.id}
                type="button"
                className={`${styles.chip} ${filters.category === category.id ? styles.chipActive : ''}`}
                onClick={() => updateFilters({ category: category.id })}
                aria-pressed={filters.category === category.id}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        <div className={styles.layout}>
          <aside className={`d-none d-lg-block ${styles.sidebar}`} aria-label={t('shop.filters.title')}>
            <div className={styles.sidebarHead}>
              <h2 className={styles.sidebarTitle}>{t('shop.filters.title')}</h2>
              {activeCount > 0 && (
                <button type="button" className={styles.clearLink} onClick={clearAll}>
                  {t('shop.filters.clearAll')}
                </button>
              )}
            </div>
            {filterPanel('sidebar')}
          </aside>

          <div className={styles.main}>
            <div className={styles.toolbar}>
              <ProductSearch value={searchText} onChange={setSearchText} className={styles.search} />
              <div className={styles.toolbarActions}>
                <Button
                  variant="ms-outline"
                  className={`d-lg-none ${styles.filterButton}`}
                  onClick={() => setShowFilters(true)}
                >
                  <PiSlidersHorizontal aria-hidden="true" />
                  {t('shop.toolbar.filters')}
                  {activeCount > 0 && <span className={styles.filterCount}>{activeCount}</span>}
                </Button>
                <ProductSort value={sort} onChange={updateSort} />
              </div>
            </div>

            <div className={styles.meta}>
              <p className={styles.count} aria-live="polite">
                {t('shop.toolbar.showing', { shown: shown.length, total })}
              </p>
              <ActiveFilters
                filters={filters}
                categories={categories}
                sizes={facets.sizes}
                onChange={updateFilters}
                onClear={clearAll}
              />
            </div>

            <div className={firstPage.loading ? styles.loading : undefined} aria-busy={firstPage.loading}>
              {total === 0 && activeCount === 0 && !firstPage.loading ? (
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
                    <PiMagnifyingGlass aria-hidden="true" />
                  </span>
                  <h3 className={styles.emptyTitle}>{t('shop.empty.title')}</h3>
                  <p className={styles.emptyText}>{t('shop.empty.text')}</p>
                  <Button variant="ms-dark" className="btn-block-mobile" onClick={clearAll}>
                    {t('shop.empty.cta')}
                  </Button>
                </div>
              ) : (
                <>
                  <ProductGrid products={shown} layout="three" preloadCount={3} />
                  <div className={styles.pagination}>
                    <p className={styles.paginationText}>{t('shop.toolbar.showing', { shown: shown.length, total })}</p>
                    <ProgressBar
                      now={(shown.length / total) * 100}
                      className={styles.progress}
                      aria-label={`${shown.length} / ${total}`}
                    />
                    {shown.length < total ? (
                      <Button variant="ms-outline" size="lg" onClick={loadMore} disabled={loadingMore}>
                        {loadingMore && <Spinner animation="border" size="sm" aria-hidden="true" />}
                        {t('shop.loadMore')}
                      </Button>
                    ) : (
                      <p className={styles.allLoaded}>{t('shop.allLoaded')}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Container>

      <Offcanvas show={showFilters} onHide={() => setShowFilters(false)} placement="start" className={styles.offcanvas}>
        <div className={styles.offcanvasHead}>
          <h2 className={styles.sidebarTitle}>{t('shop.filters.title')}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowFilters(false)}
            aria-label={t('common.close')}
          >
            <PiX />
          </button>
        </div>
        <Offcanvas.Body className={styles.offcanvasBody}>{filterPanel('drawer')}</Offcanvas.Body>
        <div className={styles.offcanvasFoot}>
          <Button variant="ms-outline" onClick={clearAll} disabled={activeCount === 0}>
            {t('shop.filters.clearAll')}
          </Button>
          <Button variant="ms-dark" onClick={() => setShowFilters(false)}>
            {t('shop.filters.apply', { count: total })}
          </Button>
        </div>
      </Offcanvas>
    </section>
  );
}
