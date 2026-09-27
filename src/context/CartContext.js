'use client';

import { createContext, useContext } from 'react';
import { CartProvider, useCart } from 'react-use-cart';
import { storeConfig } from '@/config/site';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useHydrated } from '@/hooks/useHydrated';
import { useI18n } from '@/i18n/I18nProvider';
import { getStoreProductsByIds } from '@/services/product';
import { trackAddToCart } from '@/utils/analytics';

const CART_ID = 'mattheos';
const CartContext = createContext(null);

export const cartItemId = (productId, variantId) => `${productId}:${variantId}`;

/**
 * Store-level cart on top of react-use-cart (persisted in localStorage).
 *
 * - Cart lines store ids + a snapshot (price, name, stock when added). Live prices, names,
 *   images and stock for the products in the cart are loaded from the products API,
 *   so the cart re-translates on language change and never allows more units than
 *   a size has in stock. Until the live data arrives the snapshot is used.
 * - react-use-cart restores from localStorage during the first client render, so
 *   values are withheld until hydration completes to keep SSR markup identical.
 */
export function StoreCartProvider({ children }) {
  return (
    <CartProvider id={CART_ID}>
      <CartStateProvider>{children}</CartStateProvider>
    </CartProvider>
  );
}

function CartStateProvider({ children }) {
  const cart = useCart();
  const hydrated = useHydrated();
  const { locale } = useI18n();

  const ids = hydrated ? [...new Set(cart.items.map((item) => item.productId))].sort() : [];
  const live = useApiQuery(['cart-products', ids, locale], () => getStoreProductsByIds(ids, locale), {
    enabled: ids.length > 0,
  });
  const liveById = new Map((live.data ?? []).map((product) => [product.id, product]));
  // Once the live data for these ids has loaded, a missing product is no longer for sale.
  const settled = !live.loading && !live.error && live.data !== undefined;

  const items = hydrated
    ? cart.items.map((item) => {
        const product = liveById.get(item.productId);
        const variant = product?.variants.find((entry) => entry.id === item.variantId);
        // The live price: a price changed in the admin since the item was added shows (and is charged) as it is now.
        const price = variant?.price ?? item.price;
        return {
          ...item,
          product,
          price,
          itemTotal: price * item.quantity,
          name: product?.name ?? item.name,
          variantLabel: variant?.label ?? item.variantLabel,
          // The saved image only stands in until live data arrives. A product that no longer exists
          // may point at storage this site no longer serves (e.g. a previous Cloudinary account).
          image: variant?.image ?? (settled && !product ? null : item.image),
          // The live rate, falling back to the one saved when the item was added (see utils/vat.js).
          vatRate: product?.vatRate ?? item.vatRate ?? storeConfig.vatRate,
          testProduct: product?.testProduct ?? item.testProduct ?? false,
          maxQuantity: product ? (variant?.stock ?? 0) : settled ? 0 : (item.stock ?? item.quantity),
        };
      })
    : [];

  /** Units of this size already in the cart. */
  const quantityInCart = (productId, variantId) =>
    items.find((item) => item.id === cartItemId(productId, variantId))?.quantity ?? 0;

  /** How many more units of this size can still be added. */
  const availableToAdd = (product, variantId) => {
    const variant = product.variants.find((entry) => entry.id === variantId);
    return Math.max(0, (variant?.stock ?? 0) - quantityInCart(product.id, variantId));
  };

  /** Adds up to the available stock. Returns the number of units actually added. */
  function addToCart(product, variantId, quantity = 1) {
    const variant = product.variants.find((entry) => entry.id === variantId) ?? product.variants[0];
    const units = Math.min(quantity, availableToAdd(product, variant.id));
    if (units <= 0) return 0;
    cart.addItem(
      {
        id: cartItemId(product.id, variant.id),
        productId: product.id,
        variantId: variant.id,
        price: variant.price,
        name: product.name,
        variantLabel: variant.label,
        image: variant.image,
        stock: variant.stock,
        vatRate: product.vatRate,
        testProduct: product.testProduct,
      },
      units
    );
    trackAddToCart(product, variant, units);
    return units;
  }

  function updateQuantity(id, quantity) {
    const item = items.find((entry) => entry.id === id);
    cart.updateItemQuantity(id, item ? Math.min(quantity, Math.max(item.maxQuantity, 0)) : quantity);
  }

  const value = {
    items,
    isEmpty: items.length === 0,
    totalItems: hydrated ? cart.totalItems : 0,
    subtotal: items.reduce((sum, item) => sum + item.itemTotal, 0),
    hasStockIssues: items.some((item) => item.quantity > item.maxQuantity),
    quantityInCart,
    availableToAdd,
    addToCart,
    updateQuantity,
    /** Re-check live stock (e.g. when the cart drawer opens). */
    refreshStock: live.refetch,
    removeItem: cart.removeItem,
    emptyCart: cart.emptyCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useStoreCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useStoreCart must be used inside <StoreCartProvider>');
  return context;
}
