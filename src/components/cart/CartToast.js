'use client';

import Image from 'next/image';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import { PiCheckCircleFill, PiWarningCircleFill, PiX } from 'react-icons/pi';
import { useUI } from '@/context/UIContext';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './CartToast.module.css';

/** Confirmation after adding to cart (or a stock-limit notice), with a shortcut to the drawer. */
export default function CartToast() {
  const { t, price } = useI18n();
  const { toast, hideToast, openCart } = useUI();

  return (
    <ToastContainer position="bottom-end" className={styles.container} containerPosition="fixed">
      <Toast key={toast?.key} show={Boolean(toast)} onClose={hideToast} delay={4000} autohide className={styles.toast}>
        {toast && (
          <div className={styles.inner}>
            <div className={styles.thumb}>
              <Image src={toast.variant.image} alt="" fill sizes="64px" className="img-cover" />
            </div>
            <div className={styles.info}>
              {toast.limit ? (
                <span className={`${styles.status} ${styles.warning}`}>
                  <PiWarningCircleFill aria-hidden="true" /> {t('cart.limitTitle')}
                </span>
              ) : (
                <span className={styles.status}>
                  <PiCheckCircleFill aria-hidden="true" /> {t('cart.addedTitle')}
                </span>
              )}
              <span className={styles.name}>{toast.product.name}</span>
              <span className={styles.meta}>
                {toast.limit
                  ? t('cart.limitReached', { count: toast.available })
                  : `${toast.variant.label} · ${toast.quantity} × ${price(toast.variant.price)}`}
              </span>
              <button
                type="button"
                className={styles.view}
                onClick={() => {
                  hideToast();
                  openCart();
                }}
              >
                {t('cart.viewCart')}
              </button>
            </div>
            <button type="button" className={styles.close} onClick={hideToast} aria-label={t('common.close')}>
              <PiX />
            </button>
          </div>
        )}
      </Toast>
    </ToastContainer>
  );
}
