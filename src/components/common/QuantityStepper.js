'use client';

import { PiMinus, PiPlus } from 'react-icons/pi';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './QuantityStepper.module.css';

export default function QuantityStepper({ value, onChange, min = 1, max = 99, size = 'md' }) {
  const { t } = useI18n();

  return (
    <div className={`${styles.stepper} ${styles[size]}`} role="group" aria-label={t('common.quantity')}>
      <button
        type="button"
        className={styles.button}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={t('common.decrease')}
      >
        <PiMinus />
      </button>
      <span className={styles.value} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={styles.button}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={t('common.increase')}
      >
        <PiPlus />
      </button>
    </div>
  );
}
