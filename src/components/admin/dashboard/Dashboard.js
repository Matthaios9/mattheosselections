'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PiCoins, PiPackage, PiPlus, PiReceipt, PiUsers, PiWarningCircle } from 'react-icons/pi';
import ButtonLink from '@/components/common/ButtonLink';
import EmptyState from '@/components/admin/EmptyState';
import PageHeader from '@/components/admin/PageHeader';
import QueryState from '@/components/admin/QueryState';
import RevenueChart from '@/components/admin/RevenueChart';
import StatCard from '@/components/admin/StatCard';
import StatusPill from '@/components/admin/StatusPill';
import StockPill from '@/components/admin/StockPill';
import OrdersTable from '@/components/admin/orders/OrdersTable';
import { ORDER_STATUS_OPTIONS } from '@/constants/status';
import { useAdminSession } from '@/context/AdminSessionContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { getDashboardStats } from '@/services/stats';
import { firstName, money } from '@/utils/format';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { admin } = useAdminSession();
  const query = useApiQuery(['dashboard'], getDashboardStats);

  return (
    <QueryState query={query} loadingLabel="Loading the dashboard…">
      {(data) => {
        const maxStatus = Math.max(1, ...ORDER_STATUS_OPTIONS.map((option) => data.statusCounts[option.value] ?? 0));
        return (
          <>
            <PageHeader
              title={`Welcome back, ${firstName(admin.name)}`}
              subtitle="Here is what is happening in your store."
              actions={
                <>
                  <ButtonLink href="/admin/orders" variant="ms-outline">
                    <PiReceipt aria-hidden="true" /> View orders
                  </ButtonLink>
                  <ButtonLink href="/admin/products/new">
                    <PiPlus aria-hidden="true" /> Add product
                  </ButtonLink>
                </>
              }
            />

            <div className={styles.stats}>
              <StatCard label="Revenue" value={money(data.revenue)} hint={`Avg. order ${money(data.averageOrder)}`} icon={PiCoins} />
              <StatCard
                label="Orders"
                value={data.orderCount}
                hint={`${data.pendingCount} awaiting processing`}
                icon={PiReceipt}
                tone="aegean"
              />
              <StatCard label="Customers" value={data.customers} hint="Registered accounts" icon={PiUsers} tone="olive" />
              <StatCard
                label="Products"
                value={data.products.total}
                hint={`${data.products.active} active · ${data.products.outOfStock} sold out`}
                icon={PiPackage}
                tone="ink"
              />
            </div>

            <div className={styles.grid}>
              <section className="admin-card">
                <div className="admin-card-header">
                  <h2 className="admin-card-title">Revenue</h2>
                </div>
                <div className="admin-card-body">
                  <RevenueChart series={data.series} />
                </div>
              </section>

              <section className="admin-card">
                <div className="admin-card-header">
                  <h2 className="admin-card-title">Orders by status</h2>
                </div>
                <ul className={styles.statusList}>
                  {ORDER_STATUS_OPTIONS.map((option) => {
                    const count = data.statusCounts[option.value] ?? 0;
                    return (
                      <li key={option.value}>
                        <Link href={`/admin/orders?status=${option.value}`} className={styles.statusRow}>
                          <StatusPill kind="order" value={option.value} />
                          <span className={styles.statusBar}>
                            <span className={`${styles.statusFill} fill-${option.tone}`} style={{ width: `${(count / maxStatus) * 100}%` }} />
                          </span>
                          <strong>{count}</strong>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="admin-card">
                <div className="admin-card-header">
                  <h2 className="admin-card-title">Recent orders</h2>
                  <Link href="/admin/orders" className="small fw-bold">
                    View all
                  </Link>
                </div>
                <OrdersTable
                  orders={data.recentOrders}
                  columns={['number', 'customer', 'date', 'status', 'total']}
                  empty={
                    <EmptyState icon={PiReceipt} title="No orders yet">
                      Orders placed in the storefront appear here.
                    </EmptyState>
                  }
                />
              </section>

              <div className={styles.side}>
                <section className="admin-card">
                  <div className="admin-card-header">
                    <h2 className="admin-card-title">Top products</h2>
                  </div>
                  {data.topProducts.length ? (
                    <ul className={styles.list}>
                      {data.topProducts.map((product) => (
                        <li key={product.id}>
                          <span className="admin-thumb">
                            {product.image && <Image src={product.image} alt="" fill sizes="44px" />}
                          </span>
                          <span className={styles.listText}>
                            <strong>{product.name}</strong>
                            <small>{product.quantity} sold</small>
                          </span>
                          <span className={styles.listValue}>{money(product.revenue)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="admin-card-body text-muted-ms small mb-0">Sales data appears after the first orders.</p>
                  )}
                </section>

                <section className="admin-card">
                  <div className="admin-card-header">
                    <h2 className="admin-card-title">Needs attention</h2>
                    <PiWarningCircle className="text-warning" aria-hidden="true" />
                  </div>
                  {data.attention.length ? (
                    <ul className={styles.list}>
                      {data.attention.map((product) => (
                        <li key={product.id}>
                          <span className="admin-thumb">
                            {product.image && <Image src={product.image} alt="" fill sizes="44px" />}
                          </span>
                          <span className={styles.listText}>
                            <Link href={`/admin/products/${product.id}`}>
                              <strong>{product.name}</strong>
                            </Link>
                            <small>
                              <StockPill total={product.totalStock} />{' '}
                              {product.status === 'draft' && <StatusPill kind="product" value="draft" />}
                            </small>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="admin-card-body text-muted-ms small mb-0">Every product is well stocked and published.</p>
                  )}
                </section>
              </div>
            </div>
          </>
        );
      }}
    </QueryState>
  );
}
