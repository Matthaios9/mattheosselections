'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import CloudinaryImage from '@/components/common/CloudinaryImage';
import Link from 'next/link';
import Accordion from 'react-bootstrap/Accordion';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import { PiArrowRight, PiCheckCircle, PiHandbagSimple } from 'react-icons/pi';
import QuantityStepper from '@/components/common/QuantityStepper';
import BackInStockForm from './BackInStockForm';
import SizeSelector from './SizeSelector';
import WishlistButton from './WishlistButton';
import { storeConfig } from '@/config/site';
import { useStoreCart } from '@/context/CartContext';
import { useAddToCart } from '@/hooks/useAddToCart';
import { useI18n } from '@/i18n/I18nProvider';
import { trackViewItem } from '@/utils/analytics';
import styles from './ProductDetails.module.css';

/**
 * Gallery, sizes, stock and add to cart for one product. Shared by the quick view (`variant="modal"`,
 * which calls `onClose` after adding and links to the full page) and the product page (`variant="page"`, with an h1).
 */
export default function ProductDetails({ product, initialVariant, onClose, variant: layout = 'page', titleId }) {
  const { t, price, euro, href } = useI18n();
  const addToCart = useAddToCart();
  const { availableToAdd, quantityInCart } = useStoreCart();
  const [variantId, setVariantId] = useState(initialVariant ?? product.defaultVariant);
  const [quantity, setQuantity] = useState(1);

  const variant = product.variants.find((item) => item.id === variantId) ?? product.variants[0];
  const [firstImage] = useState(variant.image);
  const hasOptions = product.variants.length > 1;
  const available = availableToAdd(product, variant.id);
  const soldOut = variant.stock <= 0;
  const lowStock = !soldOut && variant.stock <= storeConfig.lowStockThreshold;
  const qty = Math.max(1, Math.min(quantity, available));
  const gallery = [...new Map(product.variants.map((item) => [item.image, item])).values()];
  const isPage = layout === 'page';
  const Title = isPage ? 'h1' : 'h2';

  const inCart = quantityInCart(product.id, variant.id);

  // Once per product shown (the size picked afterwards isn't a new view).
  const reportView = useEffectEvent(() => trackViewItem(product, variant));
  useEffect(() => reportView(), [product.id]);

  let stockMessage = t('product.inStock');
  if (soldOut) stockMessage = t('product.outOfStock');
  else if (available === 0) stockMessage = t('cart.limitReached');
  else if (lowStock) stockMessage = t('product.lowStock');
  if (!soldOut && available > 0 && inCart > 0) stockMessage += ` · ${t('product.inCart', { count: inCart })}`;

  const handleAdd = () => {
    addToCart(product, variant.id, qty);
    onClose?.();
  };

  return (
    <div className={`${styles.layout} ${isPage ? styles.page : styles.modal}`}>
      <div className={styles.gallery}>
        <div className={styles.galleryInner}>
          <div className={styles.mainImage}>
            <CloudinaryImage
              key={variant.image}
              src={variant.image}
              alt={product.name}
              fill
              loading={isPage ? 'eager' : undefined}
              fetchPriority={isPage ? 'high' : undefined}
              sizes="(min-width: 992px) 540px, 100vw"
              className={`${styles.image} ${variant.image === firstImage ? '' : styles.imageSwap}`}
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
                  <CloudinaryImage src={item.image} alt="" fill sizes="80px" className={styles.image} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.details}>
        {product.categoryName && <span className="eyebrow">{product.categoryName}</span>}
        <Title className={styles.title} id={titleId}>
          {product.name}
        </Title>
        <p className={styles.price}>
          {price(variant.price)} <span className={styles.vat}>{t('common.inclVat')}</span>
          <span className={styles.euro}>{t('common.approxEuro', { amount: euro(variant.price) })}</span>
        </p>
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
              allowSoldOut
            />
          )}
          {!soldOut && (
            <div className={styles.actions}>
              <QuantityStepper value={qty} onChange={setQuantity} max={Math.max(1, available)} />
              <Button variant="ms-dark" className={styles.addButton} onClick={handleAdd} disabled={available === 0}>
                <PiHandbagSimple className="btn-icon" aria-hidden="true" />
                {t('common.addToCart')}
              </Button>
              <WishlistButton productId={product.id} variant="outline" />
            </div>
          )}
          <p
            className={`${styles.stock} ${soldOut ? styles.stockOut : ''} ${
              !soldOut && (available === 0 || lowStock) ? styles.stockLow : ''
            }`}
          >
            <span className={styles.stockDot} aria-hidden="true" />
            {stockMessage}
          </p>
          {/* Sold out: leave an email to hear when this size is back (keyed so each size starts fresh). */}
          {soldOut && <BackInStockForm key={variant.id} product={product} variant={variant} />}
        </div>

        <ul className={styles.trust}>
          {t('product.trust').map((item) => (
            <li key={item}>
              <PiCheckCircle aria-hidden="true" /> {item}
            </li>
          ))}
        </ul>

        <Accordion className={styles.accordion} defaultActiveKey={isPage ? 'shipping' : undefined}>
          <Accordion.Item eventKey="shipping">
            <Accordion.Header as={isPage ? 'h2' : 'h3'}>{t('product.shipping')}</Accordion.Header>
            <Accordion.Body>{t('product.shippingText')}</Accordion.Body>
          </Accordion.Item>
        </Accordion>

        {!isPage && product.slug && (
          <Link href={href(`/product/${product.slug}`)} className={`btn-link-ms ${styles.pageLink}`} onClick={onClose}>
            {t('product.viewPage')} <PiArrowRight className="btn-icon" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
