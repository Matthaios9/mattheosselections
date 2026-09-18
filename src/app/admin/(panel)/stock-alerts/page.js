import { Suspense } from 'react';
import StockAlertList from '@/components/admin/stock-alerts/StockAlertList';

export const metadata = { title: 'Stock alerts' };

export default function StockAlertsPage() {
  return (
    <Suspense>
      <StockAlertList />
    </Suspense>
  );
}
