'use client';

import ProgressBar from 'react-bootstrap/ProgressBar';
import { PiTruck, PiSealCheck } from 'react-icons/pi';
import { storeConfig } from '@/config/site';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './FreeShippingProgress.module.css';

/** Progress towards free shipping in Sweden (orders abroad have their own threshold, applied at checkout). */
export default function FreeShippingProgress({ subtotal }) {
  const { t, price } = useI18n();
  const threshold = storeConfig.shipping.domestic.freeOver;
  const remaining = Math.max(0, threshold - subtotal);
  const unlocked = remaining === 0;
  const percent = Math.min(100, Math.round((subtotal / threshold) * 100));

  return (
    <div className={`${styles.wrap} ${unlocked ? styles.unlocked : ''}`}>
      <p className={styles.message}>
        {unlocked ? <PiSealCheck aria-hidden="true" /> : <PiTruck aria-hidden="true" />}
        <span>
          {unlocked
            ? t('cart.freeShippingUnlocked')
            : t('cart.freeShippingRemaining', { amount: price(remaining) })}
        </span>
      </p>
      <ProgressBar now={percent} visuallyHidden aria-label={`${percent}%`} />
    </div>
  );
}
