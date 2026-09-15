'use client';

import { PiX } from 'react-icons/pi';
import { useI18n } from '@/i18n/I18nProvider';
import { DEFAULT_FILTERS } from '@/constants/shop';
import styles from './ActiveFilters.module.css';

/** Removable chips summarising the active filters. */
export default function ActiveFilters({ filters, categories, sizes, onChange, onClear }) {
  const { t } = useI18n();
  const chips = [];

  if (filters.query) {
    chips.push({ key: 'query', label: t('shop.filters.searchChip', { query: filters.query }), patch: { query: '' } });
  }
  if (filters.category !== 'all') {
    const category = categories.find((item) => item.id === filters.category);
    chips.push({ key: 'category', label: category?.name ?? filters.category, patch: { category: 'all' } });
  }
  if (filters.priceRange !== 'any') {
    chips.push({
      key: 'price',
      label: t(`shop.filters.priceRanges.${filters.priceRange}`),
      patch: { priceRange: DEFAULT_FILTERS.priceRange },
    });
  }
  filters.sizes.forEach((size) => {
    chips.push({
      key: `size-${size}`,
      label: sizes.find((item) => item.id === size)?.label ?? size,
      patch: { sizes: filters.sizes.filter((item) => item !== size) },
    });
  });
  if (filters.inStockOnly) {
    chips.push({ key: 'stock', label: t('shop.filters.inStockOnly'), patch: { inStockOnly: false } });
  }

  if (!chips.length) return null;

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{t('shop.filters.active')}</span>
      {chips.map((chip) => (
        <button key={chip.key} type="button" className={styles.chip} onClick={() => onChange(chip.patch)}>
          {chip.label}
          <PiX aria-hidden="true" />
        </button>
      ))}
      <button type="button" className={styles.clear} onClick={onClear}>
        {t('shop.filters.clearAll')}
      </button>
    </div>
  );
}
