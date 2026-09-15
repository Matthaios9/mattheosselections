'use client';

import { createContext, useContext } from 'react';

const CatalogContext = createContext({ categories: [], spotlight: { signature: null, gift: null } });

/**
 * Small catalogue data every storefront page shares, loaded once on the server:
 * the visible categories (menus, footer, filters) and the badge-picked spotlight products.
 * Product lists themselves come from the products API (services/product.js).
 */
export function CatalogProvider({ categories, spotlight, children }) {
  return <CatalogContext.Provider value={{ categories, spotlight }}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  return useContext(CatalogContext);
}
