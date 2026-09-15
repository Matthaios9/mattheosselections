'use client';

import { useStoreCart } from '@/context/CartContext';
import { useUI } from '@/context/UIContext';

/**
 * Add a product size to the cart (never beyond its stock) and confirm with the
 * global toast — or explain that every available unit is already in the cart.
 */
export function useAddToCart() {
  const { addToCart, quantityInCart } = useStoreCart();
  const { showToast } = useUI();

  return (product, variantId, quantity = 1) => {
    const variant = product.variants.find((entry) => entry.id === variantId) ?? product.variants[0];
    const added = addToCart(product, variant.id, quantity);
    if (added > 0) {
      showToast({ product, variant, quantity: added });
    } else {
      showToast({ product, variant, limit: true, available: quantityInCart(product.id, variant.id) });
    }
    return added;
  };
}
