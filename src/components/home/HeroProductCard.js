'use client';

import CloudinaryImage from '@/components/common/CloudinaryImage';
import { PiPlus } from 'react-icons/pi';
import { useUI } from '@/context/UIContext';
import { useAddToCart } from '@/hooks/useAddToCart';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './HeroSection.module.css';

/** Floating "signature jar" card in the hero — quick add + quick view. */
export default function HeroProductCard({ product, label }) {
  const { t, price } = useI18n();
  const { openQuickView } = useUI();
  const addToCart = useAddToCart();

  return (
    <div className={styles.productCard}>
      <button
        type="button"
        className={styles.productThumb}
        onClick={() => openQuickView(product)}
        aria-label={`${t('common.quickView')}: ${product.name}`}
      >
        <CloudinaryImage src={product.image} alt="" fill sizes="72px" className="img-cover" />
      </button>
      <div className={styles.productInfo}>
        <span className={styles.productLabel}>{label}</span>
        <button type="button" className={styles.productName} onClick={() => openQuickView(product)}>
          {product.name}
        </button>
        <span className={styles.productPrice}>{price(product.price)}</span>
      </div>
      <button
        type="button"
        className={styles.productAdd}
        onClick={() => addToCart(product, product.defaultVariant)}
        aria-label={`${t('common.addToCart')}: ${product.name}`}
      >
        <PiPlus />
      </button>
    </div>
  );
}
