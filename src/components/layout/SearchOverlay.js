'use client';

import { useRef, useState } from 'react';
import CloudinaryImage from '@/components/common/CloudinaryImage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Container from 'react-bootstrap/Container';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { PiArrowRight, PiArrowUpRight, PiMagnifyingGlass, PiX } from 'react-icons/pi';
import { useCatalog } from '@/context/CatalogContext';
import { useUI } from '@/context/UIContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useI18n } from '@/i18n/I18nProvider';
import { getStoreProducts } from '@/services/product';
import styles from './SearchOverlay.module.css';

export default function SearchOverlay() {
  const { t, href, price, locale } = useI18n();
  const router = useRouter();
  const { searchOpen, closeSearch, openQuickView } = useUI();
  const { categories } = useCatalog();
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const trimmed = query.trim();
  const term = useDebouncedValue(trimmed, 250);
  // Search runs on the server (accent-insensitive, name / description / category).
  const search = useApiQuery(['search', term, locale], () => getStoreProducts({ locale, q: term, pageSize: 4 }), {
    enabled: searchOpen && Boolean(term),
  });
  // Before typing: featured products (managed in the admin) as "Trending now".
  const trending = useApiQuery(
    ['trending', locale],
    () => getStoreProducts({ locale, featured: true, stock: 'in', sort: 'popularity', pageSize: 4 }),
    { enabled: searchOpen }
  );

  const total = search.data?.total ?? 0;
  const shown = trimmed ? (search.data?.items ?? []) : (trending.data?.items ?? []);
  const noResults = Boolean(trimmed) && term === trimmed && !search.loading && search.data !== undefined && total === 0;
  const shopHref = `${href('/shop')}?q=${encodeURIComponent(trimmed)}`;

  const submit = (event) => {
    event.preventDefault();
    if (!trimmed) return;
    closeSearch();
    router.push(shopHref);
  };

  const openProduct = (product) => {
    closeSearch();
    openQuickView(product);
  };

  return (
    <Offcanvas
      show={searchOpen}
      onHide={closeSearch}
      onEntered={() => inputRef.current?.focus()}
      onExited={() => setQuery('')}
      placement="top"
      className={styles.overlay}
      aria-label={t('search.label')}
    >
      <Container className={styles.inner}>
        <div className={styles.top}>
          <p className={styles.title}>{t('search.title')}</p>
          <button type="button" className="icon-btn" onClick={closeSearch} aria-label={t('common.close')}>
            <PiX />
          </button>
        </div>

        <form role="search" className={styles.form} onSubmit={submit}>
          <PiMagnifyingGlass className={styles.formIcon} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search.placeholder')}
            aria-label={t('search.label')}
            className={styles.input}
            autoComplete="off"
          />
          {trimmed && (
            <button type="submit" className={styles.submit} aria-label={t('search.viewAll')}>
              <PiArrowRight className="flip-rtl" />
            </button>
          )}
        </form>

        {!trimmed && categories.length > 0 && (
          <div className={styles.popular}>
            <span className={styles.label}>{t('search.popularTitle')}</span>
            {categories.slice(0, 6).map((category) => (
              <button key={category.id} type="button" className={styles.chip} onClick={() => setQuery(category.name)}>
                {category.name}
              </button>
            ))}
          </div>
        )}

        {(trimmed || shown.length > 0) && (
          <div className={styles.results}>
            <div className={styles.resultsHead}>
              <span className={styles.label}>{trimmed ? t('search.resultsTitle') : t('search.trendingTitle')}</span>
              {trimmed && total > 0 && (
                <Link href={shopHref} className="btn-link-ms" onClick={closeSearch}>
                  {t('search.viewAll')} ({total}) <PiArrowRight className="btn-icon" aria-hidden="true" />
                </Link>
              )}
            </div>

            {noResults ? (
              <p className={styles.empty}>{t('search.noResults', { query: trimmed })}</p>
            ) : (
              <ul className={styles.grid}>
                {shown.map((product) => (
                  <li key={product.id}>
                    <button type="button" className={styles.result} onClick={() => openProduct(product)}>
                      <span className={styles.thumb}>
                        <CloudinaryImage src={product.image} alt="" fill sizes="80px" className="img-cover" />
                      </span>
                      <span className={styles.info}>
                        <span className={styles.category}>{product.categoryName}</span>
                        <span className={styles.name}>{product.name}</span>
                        <span className={styles.price}>
                          {product.variants.length > 1 && `${t('common.from')} `}
                          {price(product.price)}
                        </span>
                      </span>
                      <PiArrowUpRight className={`${styles.arrow} flip-rtl`} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Container>
    </Offcanvas>
  );
}
