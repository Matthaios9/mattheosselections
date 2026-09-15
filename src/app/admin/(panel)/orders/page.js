import { Suspense } from 'react';
import OrderList from '@/components/admin/orders/OrderList';

export const metadata = { title: 'Orders' };

export default function OrdersPage() {
  return (
    <Suspense>
      <OrderList />
    </Suspense>
  );
}
