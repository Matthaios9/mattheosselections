'use client';

import { useState } from 'react';
import Image from 'next/image';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import { PiBellSimpleRinging, PiEye, PiHandbagSimple } from 'react-icons/pi';
import SizeSelector from './SizeSelector';
import WishlistButton from './WishlistButton';
import { storeConfig } from '@/config/site';
import { useUI } from '@/context/UIContext';
import { useAddToCart } from '@/hooks/useAddToCart';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './ProductCard.module.css';

export default function ProductCard({ product, imageSizes, preload = false }) {
  const { t, price } = useI18n();
  const { openQuickView } = useUI();
  const addToCart = useAddToCart();
  const [variantId, setVariantId] = useState(product.defaultVariant);

  const variant = product.variants.find((item) => item.id === variantId) ?? product.variants[0];
  const hasOptions = product.variants.length > 1;
  const soldOut = variant.stock <= 0;
  const lowStock = !soldOut && variant.stock <= storeConfig.lowStockThreshold;
  const openDetails = () => openQuickView(product, variant.id);

  return (
    <Card as="article" className={`${styles.card} ${product.inStock ? '' : styles.unavailable}`}>
      <div className={styles.media}>
        <button
          type="button"
          className={styles.imageButton}
          onClick={openDetails}
          aria-label={`${t('common.quickView')}: ${product.name}`}
        >
          <Image
            key={variant.image}
            src={variant.image}
            alt={product.name}
            fill
            preload={preload}
            sizes={imageSizes ?? '(min-width: 1200px) 25vw, (min-width: 768px) 33vw, 50vw'}
            className={styles.image}
          />
        </button>

        <div className={styles.badges}>
          {!product.inStock ? (
            <Badge bg="" className={`${styles.badge} ${styles.badgeMuted}`}>
              {t('common.soldOut')}
            </Badge>
          ) : (
            product.badge && (
              <Badge bg="" className={`${styles.badge} ${styles[`badge-${product.badge}`] ?? ''}`}>
                {t(`badges.${product.badge}`)}
              </Badge>
            )
          )}
        </div>

        <WishlistButton productId={product.id} className={styles.wishlist} />

        <button type="button" className={styles.quickView} onClick={openDetails} tabIndex={-1}>
          <PiEye aria-hidden="true" />
          {t('common.quickView')}
        </button>
      </div>

      <Card.Body className={styles.body}>
        <div className={styles.meta}>
          {product.categoryName && <span className={styles.category}>{product.categoryName}</span>}
          {!soldOut && (
            <span className={lowStock ? styles.lowStock : styles.stock}>
              {t(lowStock ? 'product.lowStock' : 'product.stockCount', { count: variant.stock })}
            </span>
          )}
        </div>

        <Card.Title as="h3" className={styles.name}>
          <button type="button" onClick={openDetails}>
            {product.name}
          </button>
        </Card.Title>

        <div className={styles.options}>
          {hasOptions ? (
            <SizeSelector
              variants={product.variants}
              value={variant.id}
              onChange={setVariantId}
              label={t('common.size')}
              soldOutLabel={t('common.soldOut')}
            />
          ) : (
            <span className={styles.sizeLabel}>{variant.label}</span>
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.price}>{price(variant.price)}</span>
          {soldOut ? (
            // Sold out: open the quick view, where the customer can ask to be notified when it is back.
            <Button
              variant="ms-outline"
              size="sm"
              className={styles.addButton}
              onClick={openDetails}
              aria-label={`${t('product.backInStock.title')}: ${product.name}${hasOptions ? `, ${variant.label}` : ''}`}
            >
              <PiBellSimpleRinging className="btn-icon" aria-hidden="true" />
              <span className={styles.addLabel}>{t('common.notifyMe')}</span>
            </Button>
          ) : (
            <Button
              variant="ms-dark"
              size="sm"
              className={styles.addButton}
              onClick={() => addToCart(product, variant.id)}
              aria-label={`${t('common.addToCart')}: ${product.name}${hasOptions ? `, ${variant.label}` : ''}`}
            >
              <PiHandbagSimple className="btn-icon" aria-hidden="true" />
              <span className={styles.addLabel}>{t('common.add')}</span>
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
