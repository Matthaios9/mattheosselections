'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PiBuildings, PiEnvelopeSimple, PiMapPin, PiPhone, PiUserCircle } from 'react-icons/pi';
import PageHeader from '@/components/admin/PageHeader';
import QueryState from '@/components/admin/QueryState';
import StatusPill from '@/components/admin/StatusPill';
import { AdminNoteCard, OrderStatusCard, PaymentStatusCard } from '@/components/admin/orders/OrderActions';
import { useAdminSession } from '@/context/AdminSessionContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { getOrderById } from '@/services/order';
import { countryName, formatDateTime, money, plural } from '@/utils/format';
import { includedVat } from '@/utils/vat';
import styles from './OrderDetail.module.css';

/** One order: items, totals, timeline, customer, and the fulfilment / payment / note cards. */
export default function OrderDetail({ id }) {
  const query = useApiQuery(['admin-order', id], () => getOrderById(id));
  const { refreshOrderCounts } = useAdminSession();

  const handleStatusUpdated = (order) => {
    query.mutate(order);
    refreshOrderCounts(); // the sidebar badge counts pending orders
  };

  return (
    <QueryState query={query} loadingLabel="Loading order…">
      {(order) => {
        const address = order.shippingAddress;
        return (
          <>
            <PageHeader
              back={{ href: '/admin/orders', label: 'All orders' }}
              title={`Order ${order.number}`}
              subtitle={`Placed ${formatDateTime(order.createdAt)} · ${plural(order.itemCount, 'item')}`}
              actions={
                <div className="d-flex gap-2 align-items-center">
                  <StatusPill kind="payment" value={order.paymentStatus} />
                  <StatusPill kind="order" value={order.status} />
                </div>
              }
            />

            <div className={styles.grid}>
              <div className={styles.main}>
                <section className="admin-card">
                  <div className="admin-card-header">
                    <h2 className="admin-card-title">Items</h2>
                  </div>
                  <div className="admin-table-wrap">
                    <table className="table admin-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th className="text-end">Price</th>
                          <th className="text-end">Qty</th>
                          <th className="text-end">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr key={`${item.product}-${item.variantKey}`}>
                            <td>
                              <div className="d-flex align-items-center gap-3">
                                <span className="admin-thumb">
                                  {item.image && <Image src={item.image} alt="" fill sizes="44px" />}
                                </span>
                                <div>
                                  {item.product ? (
                                    <Link href={`/admin/products/${item.product}`} className="row-link">
                                      {item.name}
                                    </Link>
                                  ) : (
                                    <span className="cell-strong">{item.name}</span>
                                  )}
                                  <div className="cell-muted">{item.variantLabel}</div>
                                  {item.contents.length > 0 && (
                                    <ul className={styles.packContents} aria-label="In each pack">
                                      {item.contents.map((entry) => (
                                        <li key={`${entry.product}-${entry.variantKey}`}>
                                          {entry.quantity} × {entry.name}
                                          {entry.variantLabel && ` (${entry.variantLabel})`}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="text-end text-nowrap">{money(item.price)}</td>
                            <td className="text-end">{item.quantity}</td>
                            <td className="text-end cell-strong text-nowrap">{money(item.lineTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <dl className={styles.totals}>
                    <div>
                      <dt>Subtotal</dt>
                      <dd>{money(order.subtotal)}</dd>
                    </div>
                    <div>
                      <dt>Shipping</dt>
                      <dd>{order.shippingFee ? money(order.shippingFee) : 'Free'}</dd>
                    </div>
                    {order.vatRate != null && (
                      <>
                        <div className={styles.vat}>
                          <dt>VAT {order.vatRate}% (food), included</dt>
                          <dd>{money(includedVat(order.subtotal, order.vatRate), { decimals: 2 })}</dd>
                        </div>
                        {order.shippingFee > 0 && (
                          <div className={styles.vat}>
                            <dt>VAT {order.vatRate}% (shipping), included</dt>
                            <dd>{money(includedVat(order.shippingFee, order.vatRate), { decimals: 2 })}</dd>
                          </div>
                        )}
                      </>
                    )}
                    <div className={styles.grand}>
                      <dt>Total</dt>
                      <dd>{money(order.total)}</dd>
                    </div>
                  </dl>
                </section>

                {order.customerNote && (
                  <section className="admin-card">
                    <div className="admin-card-header">
                      <h2 className="admin-card-title">Customer note</h2>
                    </div>
                    <p className="admin-card-body mb-0">{order.customerNote}</p>
                  </section>
                )}

                <section className="admin-card">
                  <div className="admin-card-header">
                    <h2 className="admin-card-title">Timeline</h2>
                  </div>
                  <ol className={styles.timeline}>
                    {[...order.history].reverse().map((entry, index) => (
                      <li key={`${entry.at}-${index}`}>
                        <span className={styles.dot} />
                        <div>
                          <div className="d-flex flex-wrap align-items-center gap-2">
                            <StatusPill kind="order" value={entry.status} />
                            <span className="small text-muted-ms">{formatDateTime(entry.at)}</span>
                          </div>
                          {entry.note && <p className={styles.note}>{entry.note}</p>}
                          {entry.by && <p className={styles.by}>by {entry.by}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>

              <aside className={styles.side}>
                <OrderStatusCard order={order} onUpdated={handleStatusUpdated} />
                <PaymentStatusCard order={order} onUpdated={query.mutate} />

                <section className="admin-card">
                  <div className="admin-card-header">
                    <h2 className="admin-card-title">Customer</h2>
                    {order.user && (
                      <Link href={`/admin/users/${order.user}`} className="small fw-bold">
                        View account
                      </Link>
                    )}
                  </div>
                  <ul className={styles.contact}>
                    <li>
                      <PiUserCircle aria-hidden="true" /> {order.customer.name}
                      {!order.user && <span className="small text-muted-ms">(guest)</span>}
                    </li>
                    {order.customer.company && (
                      <li>
                        <PiBuildings aria-hidden="true" />
                        <span>
                          {order.customer.company}
                          {order.customer.organizationNumber && (
                            <span className="small text-muted-ms"> · Org. no. {order.customer.organizationNumber}</span>
                          )}
                        </span>
                      </li>
                    )}
                    <li>
                      <PiEnvelopeSimple aria-hidden="true" />
                      <a href={`mailto:${order.customer.email}`}>{order.customer.email}</a>
                    </li>
                    {order.customer.phone && (
                      <li>
                        <PiPhone aria-hidden="true" />
                        <a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a>
                      </li>
                    )}
                    <li>
                      <PiMapPin aria-hidden="true" />
                      <span>
                        {address.line1}
                        {address.line2 && (
                          <>
                            <br />
                            {address.line2}
                          </>
                        )}
                        <br />
                        {address.postalCode} {address.city}
                        <br />
                        {countryName(address.country)}
                      </span>
                    </li>
                  </ul>
                </section>

                <AdminNoteCard order={order} onUpdated={query.mutate} />
              </aside>
            </div>
          </>
        );
      }}
    </QueryState>
  );
}
