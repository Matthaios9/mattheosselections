'use client';

import { createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { useApiQuery } from '@/hooks/useApiQuery';
import { getOrderCounts } from '@/services/stats';

const AdminSessionContext = createContext(null);

/**
 * The signed-in admin (verified on the server by the panel layout) plus the
 * order counts shown in the sidebar badge and the orders tabs.
 */
export function AdminSessionProvider({ admin, children }) {
  // Refreshed on every page change, and on demand after an order status changes.
  const pathname = usePathname();
  const counts = useApiQuery(['order-counts', pathname], getOrderCounts);

  const value = {
    admin,
    orderCounts: counts.data ?? {},
    refreshOrderCounts: counts.refetch,
  };

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession() {
  const context = useContext(AdminSessionContext);
  if (!context) throw new Error('useAdminSession must be used inside <AdminSessionProvider>');
  return context;
}
