'use client';

import { PiReceipt } from 'react-icons/pi';
import AdminPagination from '@/components/admin/AdminPagination';
import EmptyState from '@/components/admin/EmptyState';
import FilterBar from '@/components/admin/FilterBar';
import PageHeader from '@/components/admin/PageHeader';
import QueryState from '@/components/admin/QueryState';
import OrdersTable from '@/components/admin/orders/OrdersTable';
import { ORDER_STATUS_OPTIONS } from '@/constants/status';
import { useAdminSession } from '@/context/AdminSessionContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useUrlParams } from '@/hooks/useUrlParams';
import { getAllOrders } from '@/services/order';
import styles from '@/components/admin/AdminLists.module.css';

export default function OrderList() {
  const [params, setParams] = useUrlParams();
  const status = ORDER_STATUS_OPTIONS.some((option) => option.value === params.status) ? params.status : '';
  const q = params.q ?? '';
  const page = Number(params.page) || 1;

  const orders = useApiQuery(['admin-orders', q, status, page], () => getAllOrders({ q, status, page }));
  const { orderCounts } = useAdminSession();
  const tabs = [
    { value: '', label: 'All', count: orderCounts.all ?? 0 },
    ...ORDER_STATUS_OPTIONS.map((option) => ({ ...option, count: orderCounts[option.value] ?? 0 })),
  ];

  return (
    <>
      <PageHeader title="Orders" subtitle="Track, fulfil and update customer orders." />

      <section className="admin-card">
        <nav className={styles.tabs} aria-label="Filter by status">
          {tabs.map((tab) => (
            <button
              key={tab.value || 'all'}
              type="button"
              onClick={() => setParams({ status: tab.value })}
              className={`${styles.tab} ${status === tab.value ? styles.tabActive : ''}`}
              aria-current={status === tab.value ? 'page' : undefined}
            >
              {tab.label}
              <span className={styles.tabCount}>{tab.count}</span>
            </button>
          ))}
        </nav>
        <FilterBar key={q} values={{ q }} placeholder="Search by order number, name or email" onChange={setParams} />

        <QueryState query={orders} loadingLabel="Loading orders…">
          {(result) => (
            <>
              <OrdersTable
                list
                orders={result.items}
                loading={orders.loading}
                empty={
                  <EmptyState icon={PiReceipt} title="No orders found">
                    {q || status ? 'Try a different search or status.' : 'Orders placed in the storefront will appear here.'}
                  </EmptyState>
                }
              />
              <AdminPagination {...result} onPageChange={(next) => setParams({ page: next })} />
            </>
          )}
        </QueryState>
      </section>
    </>
  );
}
