'use client';

import Form from 'react-bootstrap/Form';
import { PiMagnifyingGlass, PiX } from 'react-icons/pi';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './ProductSearch.module.css';

export default function ProductSearch({ value, onChange, className = '' }) {
  const { t } = useI18n();

  return (
    <div className={`${styles.search} ${className}`} role="search">
      <PiMagnifyingGlass className={styles.icon} aria-hidden="true" />
      <Form.Control
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('shop.search.placeholder')}
        aria-label={t('shop.search.label')}
        className={styles.input}
      />
      {value && (
        <button type="button" className={styles.clear} onClick={() => onChange('')} aria-label={t('shop.search.clear')}>
          <PiX />
        </button>
      )}
    </div>
  );
}
