'use client';

import CloudinaryImage from '@/components/common/CloudinaryImage';
import Link from 'next/link';
import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { PiArrowRight, PiHandbagSimple, PiLockSimple, PiPlus, PiX } from 'react-icons/pi';
import CartLine from './CartLine';
import FreeShippingProgress from './FreeShippingProgress';
import { useStoreCart } from '@/context/CartContext';
import { useUI } from '@/context/UIContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useI18n } from '@/i18n/I18nProvider';
import { getStoreProducts } from '@/services/product';
import { trackViewCart } from '@/utils/analytics';
import styles from './CartDrawer.module.css';

export default function CartDrawer() {
  const { t, href, price, locale } = useI18n();
  const { cartOpen, closeCart, openCheckout } = useUI();
  const cart = useStoreCart();

  // Suggest featured, in-stock products that aren't in the cart yet (loaded when the drawer opens).
  const suggestions = useApiQuery(
    ['cart-suggestions', locale],
    () => getStoreProducts({ locale, featured: true, stock: 'in', sort: 'popularity', pageSize: 4 }),
    { enabled: cartOpen }
  );
  const inCart = new Set(cart.items.map((item) => item.productId));
  const upsell = (suggestions.data?.items ?? []).filter((product) => !inCart.has(product.id)).slice(0, 2);

  const handleShow = () => {
    cart.refreshStock();
    if (!cart.isEmpty) trackViewCart(cart.items, cart.subtotal);
  };

  const countLabel = t(cart.totalItems === 1 ? 'cart.itemOne' : 'cart.itemOther', { count: cart.totalItems });

  return (
    <Offcanvas
      show={cartOpen}
      onHide={closeCart}
      onShow={handleShow}
      placement="end"
      className={styles.drawer}
      aria-labelledby="cart-title"
    >
      <div className={styles.header}>
        <div>
          <h2 className={styles.title} id="cart-title">
            {t('cart.title')}
          </h2>
          <span className={styles.count}>{countLabel}</span>
        </div>
        <button type="button" className="icon-btn" onClick={closeCart} aria-label={t('common.close')}>
          <PiX />
        </button>
      </div>

      {cart.isEmpty ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <PiHandbagSimple aria-hidden="true" />
          </span>
          <h3 className={styles.emptyTitle}>{t('cart.emptyTitle')}</h3>
          <p className={styles.emptyText}>{t('cart.emptyText')}</p>
          <Button as={Link} href={href('/shop')} variant="ms-dark" className="btn-block-mobile" onClick={closeCart}>
            {t('cart.startShopping')}
            <PiArrowRight className="btn-icon btn-icon-shift flip-rtl" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <>
          <Offcanvas.Body className={styles.body}>
            <FreeShippingProgress subtotal={cart.subtotal} />
            <ul className={styles.lines}>
              {cart.items.map((item) => (
                <CartLine
                  key={item.id}
                  item={item}
                  onQuantityChange={(quantity) => cart.updateQuantity(item.id, quantity)}
                  onRemove={() => cart.removeItem(item.id)}
                />
              ))}
            </ul>

            {upsell.length > 0 && (
              <div className={styles.upsell}>
                <p className={styles.upsellTitle}>{t('cart.youMayLike')}</p>
                {upsell.map((product) => {
                  const variant = product.variants.find((v) => v.id === product.defaultVariant) ?? product.variants[0];
                  if (variant.stock <= 0) return null;
                  return (
                    <div key={product.id} className={styles.upsellItem}>
                      <div className={styles.upsellThumb}>
                        <CloudinaryImage src={variant.image} alt="" fill sizes="64px" className="img-cover" />
                      </div>
                      <div className={styles.upsellInfo}>
                        <span className={styles.upsellName}>{product.name}</span>
                        <span className={styles.upsellPrice}>
                          {variant.label} · {price(variant.price)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={styles.upsellAdd}
                        onClick={() => cart.addToCart(product, variant.id)}
                        aria-label={`${t('common.addToCart')}: ${product.name}`}
                      >
                        <PiPlus />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Offcanvas.Body>

          <div className={styles.footer}>
            <div className={styles.subtotal}>
              <span>{t('cart.subtotal')}</span>
              <strong>{price(cart.subtotal)}</strong>
            </div>
            <p className={styles.note}>{t('cart.shippingNote')}</p>
            <Button variant="ms-dark" size="lg" className="w-100" onClick={openCheckout} disabled={cart.hasStockIssues}>
              <PiLockSimple className="btn-icon" aria-hidden="true" />
              {t('cart.checkout')}
            </Button>
            <button type="button" className={styles.continue} onClick={closeCart}>
              {t('common.continueShopping')}
            </button>
          </div>
        </>
      )}
    </Offcanvas>
  );
}
