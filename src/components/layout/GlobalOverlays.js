'use client';

import AuthModal from '@/components/auth/AuthModal';
import CartDrawer from '@/components/cart/CartDrawer';
import CartToast from '@/components/cart/CartToast';
import CheckoutModal from '@/components/cart/CheckoutModal';
import QuickViewModal from '@/components/product/QuickViewModal';
import MobileMenu from './MobileMenu';
import SearchOverlay from './SearchOverlay';

/** Site-wide overlays, mounted once in the root layout and driven by UIContext. */
export default function GlobalOverlays() {
  return (
    <>
      <MobileMenu />
      <SearchOverlay />
      <CartDrawer />
      <CheckoutModal />
      <QuickViewModal />
      <AuthModal />
      <CartToast />
    </>
  );
}
