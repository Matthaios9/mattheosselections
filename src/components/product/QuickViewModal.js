'use client';

import { useState } from 'react';
import Image from 'next/image';
import Accordion from 'react-bootstrap/Accordion';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { PiCheckCircle, PiHandbagSimple, PiX } from 'react-icons/pi';
import QuantityStepper from '@/components/common/QuantityStepper';
import SizeSelector from './SizeSelector';
import WishlistButton from './WishlistButton';
import { storeConfig } from '@/config/site';
import { useStoreCart } from '@/context/CartContext';
import { useUI } from '@/context/UIContext';
import { useAddToCart } from '@/hooks/useAddToCart';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './QuickViewModal.module.css';

function QuickViewContent({ product, initialVariant, onClose }) {
  const { t, price } = useI18n();
  const addToCart = useAddToCart();
  const { availableToAdd, quantityInCart } = useStoreCart();
  const [variantId, setVariantId] = useState(initialVariant ?? product.defaultVariant);
  const [quantity, setQuantity] = useState(1);

  const variant = product.variants.find((item) => item.id === variantId) ?? product.variants[0];
  const hasOptions = product.variants.length > 1;
  const available = availableToAdd(product, variant.id);
  const soldOut = variant.stock <= 0;
  const lowStock = !soldOut && variant.stock <= storeConfig.lowStockThreshold;
  const qty = Math.max(1, Math.min(quantity, available));
  const gallery = [...new Map(product.variants.map((item) => [item.image, item])).values()];

  const inCart = quantityInCart(product.id, variant.id);

  let stockMessage = t('product.inStock', { count: variant.stock });
  if (soldOut) stockMessage = t('product.outOfStock');
  else if (available === 0) stockMessage = t('cart.limitReached', { count: inCart });
  else if (lowStock) stockMessage = t('product.lowStock', { count: variant.stock });
  if (!soldOut && available > 0 && inCart > 0) stockMessage += ` · ${t('product.inCart', { count: inCart })}`;

  const handleAdd = () => {
    addToCart(product, variant.id, qty);
    onClose();
  };

  return (
    <div className={styles.layout}>
      <div className={styles.gallery}>
        <div className={styles.galleryInner}>
          <div className={styles.mainImage}>
            <Image
              key={variant.image}
              src={variant.image}
              alt={product.name}
              fill
              sizes="(min-width: 992px) 440px, 100vw"
              className={styles.image}
            />
            {product.badge && product.inStock && (
              <Badge bg="" className={styles.badge}>
                {t(`badges.${product.badge}`)}
              </Badge>
            )}
          </div>
          {gallery.length > 1 && (
            <div className={styles.thumbs}>
              {gallery.map((item) => (
                <button
                  key={item.image}
                  type="button"
                  className={`${styles.thumb} ${item.image === variant.image ? styles.thumbActive : ''}`}
                  onClick={() => setVariantId(item.id)}
                  aria-label={`${product.name} ${item.label}`}
                >
                  <Image src={item.image} alt="" fill sizes="80px" className={styles.image} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.details}>
        {product.categoryName && <span className="eyebrow">{product.categoryName}</span>}
        <h2 className={styles.title} id="quick-view-title">
          {product.name}
        </h2>
        <p className={styles.price}>{price(variant.price)}</p>
        {product.description && <p className={styles.description}>{product.description}</p>}

        <div className={styles.purchase}>
          <span className={styles.optionLabel}>
            {t('common.size')}: <strong>{variant.label}</strong>
          </span>
          {hasOptions && (
            <SizeSelector
              variants={product.variants}
              value={variant.id}
              onChange={(id) => {
                setVariantId(id);
                setQuantity(1);
              }}
              label={t('common.size')}
              soldOutLabel={t('common.soldOut')}
              size="md"
              showStock
            />
          )}
          <div className={styles.actions}>
            <QuantityStepper value={qty} onChange={setQuantity} max={Math.max(1, available)} />
            <Button variant="ms-dark" className={styles.addButton} onClick={handleAdd} disabled={soldOut || available === 0}>
              <PiHandbagSimple className="btn-icon" aria-hidden="true" />
              {soldOut ? t('common.soldOut') : t('common.addToCart')}
            </Button>
            <WishlistButton productId={product.id} variant="outline" />
          </div>
          <p
            className={`${styles.stock} ${soldOut ? styles.stockOut : ''} ${
              !soldOut && (available === 0 || lowStock) ? styles.stockLow : ''
            }`}
          >
            <span className={styles.stockDot} aria-hidden="true" />
            {stockMessage}
          </p>
        </div>

        <ul className={styles.trust}>
          {t('product.trust').map((item) => (
            <li key={item}>
              <PiCheckCircle aria-hidden="true" /> {item}
            </li>
          ))}
        </ul>

        <Accordion className={styles.accordion}>
          <Accordion.Item eventKey="shipping">
            <Accordion.Header>{t('product.shipping')}</Accordion.Header>
            <Accordion.Body>{t('product.shippingText')}</Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </div>
    </div>
  );
}

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
          <QuickViewContent
            key={`${view.product.id}-${view.variantId}`}
            product={view.product}
            initialVariant={view.variantId}
            onClose={closeQuickView}
          />
        )}
      </Modal.Body>
    </Modal>
  );
}
