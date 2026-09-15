'use client';

import { CatalogProvider } from './CatalogContext';
import { StoreCartProvider } from './CartContext';
import { WishlistProvider } from './WishlistContext';
import { AuthProvider } from './AuthContext';
import { UIProvider } from './UIContext';

/** Storefront state, outermost first: catalogue data → cart → wishlist → session → overlays. */
export default function AppProviders({ categories, spotlight, children }) {
  return (
    <CatalogProvider categories={categories} spotlight={spotlight}>
      <StoreCartProvider>
        <WishlistProvider>
          <AuthProvider>
            <UIProvider>{children}</UIProvider>
          </AuthProvider>
        </WishlistProvider>
      </StoreCartProvider>
    </CatalogProvider>
  );
}
