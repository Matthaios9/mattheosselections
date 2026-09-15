'use client';

import { useId } from 'react';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import { storeConfig } from '@/config/site';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './SizeSelector.module.css';

/**
 * Pill-style size picker built on React-Bootstrap's ToggleButtonGroup. Sold-out sizes are disabled.
 * With `showStock`, each option also shows how many units of that size are available.
 */
export default function SizeSelector({ variants, value, onChange, label, soldOutLabel, size = 'sm', showStock = false }) {
  const name = useId();
  const { t } = useI18n();

  const stockText = (stock) => {
    if (stock <= 0) return soldOutLabel;
    if (stock <= storeConfig.lowStockThreshold) return t('product.lowStock', { count: stock });
    return t('product.stockCount', { count: stock });
  };

  return (
    <ToggleButtonGroup
      type="radio"
      name={name}
      value={value}
      onChange={onChange}
      className={`${styles.group} ${styles[size]} ${showStock ? styles.stacked : ''}`}
      aria-label={label}
    >
      {variants.map((variant) => {
        const soldOut = variant.stock <= 0;
        return (
          <ToggleButton
            key={variant.id}
            id={`${name}-${variant.id}`}
            value={variant.id}
            variant="ms-size"
            disabled={soldOut}
            className={`${styles.option} ${soldOut ? styles.soldOut : ''}`}
            title={soldOut ? soldOutLabel : undefined}
          >
            {showStock ? (
              <>
                <span className={styles.optionLabel}>{variant.label}</span>
                <span className={styles.optionStock}>{stockText(variant.stock)}</span>
              </>
            ) : (
              variant.label
            )}
          </ToggleButton>
        );
      })}
    </ToggleButtonGroup>
  );
}
