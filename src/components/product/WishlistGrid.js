'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { PiHeartBreak } from 'react-icons/pi';
import ProductGrid from './ProductGrid';
import { useWishlist } from '@/context/WishlistContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useHydrated } from '@/hooks/useHydrated';
import { useI18n } from '@/i18n/I18nProvider';
import { getStoreProductsByIds } from '@/services/product';
import styles from './WishlistGrid.module.css';

/**
 * The saved products, read live from the catalogue so prices and stock are never stale.
 * The list itself lives in this browser (see WishlistContext), so nothing renders until
 * hydration — before that the ids simply aren't known yet.
 */
export default function WishlistGrid() {
  const { t, href, locale } = useI18n();
  const hydrated = useHydrated();
  const wishlist = useWishlist();

  const ids = hydrated ? [...wishlist.ids].sort() : [];
  const query = useApiQuery(['wishlist-products', ids, locale], () => getStoreProductsByIds(ids, locale), {
    enabled: ids.length > 0,
  });
  const products = ids.length ? (query.data ?? []) : [];
  const settled = ids.length === 0 || (!query.loading && !query.error && query.data !== undefined);

  // A saved product that has since been taken off sale never comes back from the catalogue.
  // Once that is certain, forget it, so the heart count can't keep counting something unshowable.
  const alive = products.map((product) => product.id);
  const stale = settled && ids.length > alive.length;
  const keep = alive.join(',');
  useEffect(() => {
    if (stale) wishlist.keepOnly(keep ? keep.split(',') : []);
  }, [stale, keep, wishlist]);

  if (!hydrated || (ids.length > 0 && !settled)) {
    return (
      <div className={styles.centre}>
        <Spinner animation="border" aria-label={t('wishlist.loading')} />
      </div>
    );
  }

  if (query.error) {
    return (
      <div className={styles.centre}>
        <p className={styles.text}>{t('wishlist.failed')}</p>
        <Button variant="ms-outline" onClick={query.refetch}>
          {t('wishlist.retry')}
        </Button>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className={styles.centre}>
        <span className={styles.icon}>
          <PiHeartBreak aria-hidden="true" />
        </span>
        <h2 className={styles.title}>{t('wishlist.emptyTitle')}</h2>
        <p className={styles.text}>{t('wishlist.emptyText')}</p>
        <Button as={Link} href={href('/shop')} variant="ms-dark" size="lg">
          {t('wishlist.emptyCta')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.count}>
          {t(products.length === 1 ? 'wishlist.countOne' : 'wishlist.count', { count: products.length })}
        </p>
        <button type="button" className={styles.clear} onClick={wishlist.clear}>
          {t('wishlist.clear')}
        </button>
      </div>
      <ProductGrid products={products} preloadCount={4} />
    </>
  );
}
