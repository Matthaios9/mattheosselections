'use client';

import { createContext, useContext } from 'react';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';

const EMPTY = [];
const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [ids, setIds] = useLocalStorageState('mattheos-wishlist', EMPTY);

  const value = {
    ids,
    count: ids.length,
    has: (id) => ids.includes(id),
    toggle: (id) => setIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id])),
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  return useContext(WishlistContext);
}
