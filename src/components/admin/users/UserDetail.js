'use client';

import { PiReceipt } from 'react-icons/pi';
import EmptyState from '@/components/admin/EmptyState';
import PageHeader from '@/components/admin/PageHeader';
import QueryState from '@/components/admin/QueryState';
import StatCard from '@/components/admin/StatCard';
import StatusPill from '@/components/admin/StatusPill';
import OrdersTable from '@/components/admin/orders/OrdersTable';
import { UserRowActions } from '@/components/admin/users/UserControls';
import { useApiQuery } from '@/hooks/useApiQuery';
import { getUserById, getUserOrders } from '@/services/user';
import { formatDate, money } from '@/utils/format';

/** One account: role/status controls, spend summary and order history. */
export default function UserDetail({ id }) {
  const user = useApiQuery(['admin-user', id], () => getUserById(id));
  const orders = useApiQuery(['admin-user-orders', id], () => getUserOrders(id));

  return (
    <QueryState query={user} loadingLabel="Loading account…">
      {(account) => (
        <>
          <PageHeader
            back={{ href: '/admin/users', label: 'All users' }}
            title={account.name}
            subtitle={`${account.email} · joined ${formatDate(account.createdAt)}`}
            actions={
              <div className="d-flex gap-2 align-items-center">
                <StatusPill kind="role" value={account.role} />
                <StatusPill kind="user" value={account.status} />
                <UserRowActions user={account} onChanged={user.refetch} redirectAfterDelete="/admin/users" />
              </div>
            }
          />

          <div className="row g-3 mb-3">
            <div className="col-sm-4">
              <StatCard label="Orders" value={account.orderCount} hint="Excluding cancelled" />
            </div>
            <div className="col-sm-4">
              <StatCard label="Total spent" value={money(account.totalSpent)} />
            </div>
            <div className="col-sm-4">
              <StatCard label="Last sign-in" value={account.lastLoginAt ? formatDate(account.lastLoginAt) : '—'} />
            </div>
          </div>

          <section className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Order history</h2>
            </div>
            <QueryState query={orders} loadingLabel="Loading orders…">
              {(items) => (
                <OrdersTable
                  orders={items}
                  columns={['number', 'date', 'items', 'payment', 'status', 'total']}
                  empty={
                    <EmptyState icon={PiReceipt} title="No orders yet">
                      Orders placed while signed in to this account appear here.
                    </EmptyState>
                  }
                />
              )}
            </QueryState>
          </section>
        </>
      )}
    </QueryState>
  );
}
