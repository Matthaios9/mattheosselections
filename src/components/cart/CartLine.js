'use client';

import Image from 'next/image';
import { PiTrash } from 'react-icons/pi';
import QuantityStepper from '@/components/common/QuantityStepper';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './CartLine.module.css';

export default function CartLine({ item, onQuantityChange, onRemove, compact = false }) {
  const { t, price } = useI18n();

  return (
    <li className={`${styles.line} ${compact ? styles.compact : ''}`}>
      <div className={styles.thumb}>
        {item.image && <Image src={item.image} alt="" fill sizes="96px" className={styles.image} />}
      </div>
      <div className={styles.info}>
        <div className={styles.top}>
          <div>
            <p className={styles.name}>{item.name}</p>
            {item.variantLabel && (
              <p className={styles.variant}>
                {item.variantLabel}
                {!compact && item.maxQuantity > 0 && item.quantity <= item.maxQuantity && (
                  <span className={styles.available}> · {t('product.stockCount', { count: item.maxQuantity })}</span>
                )}
              </p>
            )}
          </div>
          <span className={styles.total}>{price(item.itemTotal ?? item.price * item.quantity)}</span>
        </div>
        {!compact && item.quantity > item.maxQuantity && (
          <p className={styles.warning}>
            {item.maxQuantity > 0 ? t('cart.stockWarning', { count: item.maxQuantity }) : t('product.outOfStock')}
          </p>
        )}
        {compact ? (
          <p className={styles.qty}>
            {t('common.quantity')}: {item.quantity} × {price(item.price)}
          </p>
        ) : (
          <div className={styles.bottom}>
            <QuantityStepper
              value={item.quantity}
              onChange={onQuantityChange}
              min={0}
              max={Math.max(item.maxQuantity, 1)}
              size="sm"
            />
            <button type="button" className={styles.remove} onClick={onRemove}>
              <PiTrash aria-hidden="true" />
              {t('common.remove')}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
