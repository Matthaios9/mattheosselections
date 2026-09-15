'use client';

import { PiHeart, PiHeartFill } from 'react-icons/pi';
import { useWishlist } from '@/context/WishlistContext';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './WishlistButton.module.css';

export default function WishlistButton({ productId, className = '', variant = 'floating' }) {
  const { t } = useI18n();
  const wishlist = useWishlist();
  const active = wishlist.has(productId);
  const label = active ? t('common.removeFromWishlist') : t('common.addToWishlist');

  return (
    <button
      type="button"
      className={`${styles.button} ${styles[variant]} ${active ? styles.active : ''} ${className}`}
      onClick={() => wishlist.toggle(productId)}
      aria-pressed={active}
      aria-label={label}
      title={label}
    >
      {active ? <PiHeartFill /> : <PiHeart />}
    </button>
  );
}
