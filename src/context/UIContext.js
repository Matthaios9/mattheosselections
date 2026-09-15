'use client';

import { createContext, useContext, useState } from 'react';

const UIContext = createContext(null);

/** Open/close state for global overlays: cart drawer, search, mobile menu, modals and toasts. */
export function UIProvider({ children }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authView, setAuthView] = useState(null); // 'login' | 'signup' | 'forgot' | null
  const [quickView, setQuickView] = useState(null); // { product, variantId }
  const [toast, setToast] = useState(null);

  const value = {
    cartOpen,
    openCart: () => {
      setToast(null); // the drawer already shows the added item
      setCartOpen(true);
    },
    closeCart: () => setCartOpen(false),

    searchOpen,
    openSearch: () => setSearchOpen(true),
    closeSearch: () => setSearchOpen(false),

    menuOpen,
    openMenu: () => setMenuOpen(true),
    closeMenu: () => setMenuOpen(false),

    checkoutOpen,
    openCheckout: () => {
      setCartOpen(false);
      setCheckoutOpen(true);
    },
    closeCheckout: () => setCheckoutOpen(false),

    authView,
    openAuth: (view = 'login') => {
      setMenuOpen(false);
      setAuthView(view);
    },
    setAuthView,
    closeAuth: () => setAuthView(null),

    quickView,
    openQuickView: (product, variantId) => setQuickView({ product, variantId }),
    closeQuickView: () => setQuickView(null),

    toast,
    showToast: (payload) => setToast({ ...payload, key: Date.now() }),
    hideToast: () => setToast(null),
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used inside <UIProvider>');
  return context;
}
