'use client';

import Dropdown from 'react-bootstrap/Dropdown';
import { PiArrowsDownUp, PiCheck } from 'react-icons/pi';
import { useI18n } from '@/i18n/I18nProvider';
import { SORT_OPTIONS } from '@/constants/shop';
import styles from './ProductSort.module.css';

export default function ProductSort({ value, onChange }) {
  const { t } = useI18n();

  return (
    <Dropdown align="end" onSelect={(key) => key && onChange(key)} className={styles.sort}>
      <Dropdown.Toggle variant="ms-outline" className={styles.toggle}>
        <PiArrowsDownUp aria-hidden="true" />
        <span className={styles.prefix}>{t('shop.toolbar.sortBy')}:</span>
        <span className={styles.value}>{t(`shop.sort.${value}`)}</span>
      </Dropdown.Toggle>
      <Dropdown.Menu className={styles.menu}>
        {SORT_OPTIONS.map((option) => (
          <Dropdown.Item key={option} eventKey={option} active={option === value} as="button" className={styles.item}>
            {t(`shop.sort.${option}`)}
            {option === value && <PiCheck aria-hidden="true" />}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
