import Link from 'next/link';
import AdminTable from '@/components/admin/AdminTable';
import StatusPill from '@/components/admin/StatusPill';
import { formatDateTime, money } from '@/utils/format';

const COLUMNS = {
  number: {
    key: 'number',
    header: 'Order',
    className: 'text-nowrap',
    render: (order) => (
      <Link href={`/admin/orders/${order.id}`} className="row-link">
        {order.number}
      </Link>
    ),
  },
  date: { key: 'date', header: 'Date', className: 'cell-muted text-nowrap', render: (order) => formatDateTime(order.createdAt) },
  customer: {
    key: 'customer',
    header: 'Customer',
    render: (order) => (
      <>
        <div className="cell-strong">{order.customer.name}</div>
        <div className="cell-muted">{order.customer.email}</div>
      </>
    ),
  },
  items: { key: 'items', header: 'Items', render: (order) => order.itemCount },
  payment: { key: 'payment', header: 'Payment', render: (order) => <StatusPill kind="payment" value={order.paymentStatus} /> },
  status: { key: 'status', header: 'Status', render: (order) => <StatusPill kind="order" value={order.status} /> },
  total: { key: 'total', header: 'Total', className: 'text-end cell-strong text-nowrap', render: (order) => money(order.total) },
};

/**
 * Orders table shared by the orders list, the dashboard and a customer's order history.
 * `columns` picks and orders the columns shown.
 */
export default function OrdersTable({
  orders,
  columns = ['number', 'date', 'customer', 'items', 'payment', 'status', 'total'],
  ...tableProps
}) {
  return <AdminTable columns={columns.map((key) => COLUMNS[key])} rows={orders} {...tableProps} />;
}
