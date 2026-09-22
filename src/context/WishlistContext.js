'use client';

import { createContext, useContext } from 'react';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';

const EMPTY = [];
const WishlistContext = createContext(null);

/**
 * Saved products, kept in this browser's local storage and shared across tabs — never sent to the
 * server, as the privacy policy says. They are product ids only; names, prices and stock are always
 * read live from the catalogue, so a saved product is never shown at a stale price.
 */
export function WishlistProvider({ children }) {
  const [ids, setIds] = useLocalStorageState('mattheos-wishlist', EMPTY);

  const value = {
    ids,
    count: ids.length,
    has: (id) => ids.includes(id),
    toggle: (id) => setIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id])),
    remove: (id) => setIds((current) => current.filter((x) => x !== id)),
    clear: () => setIds(EMPTY),
    /** Drop everything but these — used to forget products that are no longer for sale. */
    keepOnly: (alive) => setIds((current) => current.filter((id) => alive.includes(id))),
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  return useContext(WishlistContext);
}
