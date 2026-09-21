'use client';

import { createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { useApiQuery } from '@/hooks/useApiQuery';
import { getOrderCounts } from '@/services/stats';
import { getSubmissionCounts } from '@/services/submission';

const AdminSessionContext = createContext(null);

/**
 * The signed-in admin (verified on the server by the panel layout) plus the counts shown in the
 * sidebar badges and the tabs: orders per status, newsletter sign-ups and (unread) contact messages.
 */
export function AdminSessionProvider({ admin, children }) {
  // Refreshed on every page change, and on demand after an order or message status changes.
  const pathname = usePathname();
  const counts = useApiQuery(['order-counts', pathname], getOrderCounts);
  const submissions = useApiQuery(['submission-counts', pathname], getSubmissionCounts);

  const value = {
    admin,
    orderCounts: counts.data ?? {},
    refreshOrderCounts: counts.refetch,
    submissionCounts: submissions.data ?? {},
    refreshSubmissionCounts: submissions.refetch,
  };

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession() {
  const context = useContext(AdminSessionContext);
  if (!context) throw new Error('useAdminSession must be used inside <AdminSessionProvider>');
  return context;
}
