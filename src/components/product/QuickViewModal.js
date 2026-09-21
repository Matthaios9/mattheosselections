'use client';

import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { PiX } from 'react-icons/pi';
import ProductDetails from './ProductDetails';
import { useUI } from '@/context/UIContext';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './QuickViewModal.module.css';

export default function QuickViewModal() {
  const { t } = useI18n();
  const { quickView, closeQuickView } = useUI();
  // Keep the last product mounted while the modal animates out.
  const [lastView, setLastView] = useState(quickView);
  if (quickView && quickView !== lastView) setLastView(quickView);
  const view = quickView ?? lastView;

  return (
    <Modal
      show={Boolean(quickView)}
      onHide={closeQuickView}
      size="xl"
      centered
      scrollable
      aria-labelledby="quick-view-title"
      dialogClassName={styles.dialog}
    >
      <button type="button" className={styles.close} onClick={closeQuickView} aria-label={t('common.close')}>
        <PiX />
      </button>
      <Modal.Body className={styles.body}>
        {view && (
          <ProductDetails
            key={`${view.product.id}-${view.variantId}`}
            product={view.product}
            initialVariant={view.variantId}
            onClose={closeQuickView}
            variant="modal"
            titleId="quick-view-title"
          />
        )}
      </Modal.Body>
    </Modal>
  );
}
