import OrderDetail from '@/components/admin/orders/OrderDetail';

export const metadata = { title: 'Order' };

export default async function OrderPage({ params }) {
  const { id } = await params;
  return <OrderDetail id={id} />;
}
