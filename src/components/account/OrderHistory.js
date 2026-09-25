'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { PiCaretDown, PiPackage } from 'react-icons/pi';
import CloudinaryImage from '@/components/common/CloudinaryImage';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useI18n } from '@/i18n/I18nProvider';
import { getMyOrders } from '@/services/account';
import { getErrorCode } from '@/utils/errors';
import { accountErrorKey } from './errors';
import styles from './Account.module.css';

const DATE_LOCALES = { en: 'en-GB', sv: 'sv-SE', el: 'el-GR' };

/** Account → Orders: every order placed while signed in, newest first, each expandable to its lines. */
export default function OrderHistory() {
  const { t, href } = useI18n();
  const query = useApiQuery(['account-orders'], getMyOrders);
  const orders = query.data ?? [];

  const head = (
    <header className={styles.panelHead}>
      <h2 className={styles.panelTitle} id="account-panel-title">
        {t('account.orders.title')}
      </h2>
      <p className={styles.text}>{t('account.orders.text')}</p>
    </header>
  );

  if (query.loading || (!query.error && query.data === undefined)) {
    return (
      <>
        {head}
        <div className={styles.centre}>
          <Spinner animation="border" aria-label={t('account.orders.loading')} />
        </div>
      </>
    );
  }

  if (query.error) {
    const code = getErrorCode(query.error);
    return (
      <>
        {head}
        <div className={styles.centre}>
          <p className={styles.text}>{t(code === 'unauthorized' ? accountErrorKey(code) : 'account.orders.failed')}</p>
          <Button variant="ms-outline" onClick={query.refetch}>
            {t('account.orders.retry')}
          </Button>
        </div>
      </>
    );
  }

  if (!orders.length) {
    return (
      <>
        {head}
        <div className={styles.centre}>
          <span className={styles.badgeIcon}>
            <PiPackage aria-hidden="true" />
          </span>
          <h3 className={styles.title}>{t('account.orders.emptyTitle')}</h3>
          <p className={styles.text}>{t('account.orders.emptyText')}</p>
          <Button as={Link} href={href('/shop')} variant="ms-dark">
            {t('account.orders.emptyCta')}
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      {head}
      <ul className={styles.orders}>
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </ul>
    </>
  );
}

function OrderCard({ order }) {
  const { t, price, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const detailsId = `order-${order.id}`;
  const date = new Intl.DateTimeFormat(DATE_LOCALES[locale] ?? 'en-GB', { dateStyle: 'medium' }).format(
    new Date(order.createdAt)
  );
  const country = order.shippingAddress.country
    ? new Intl.DisplayNames([DATE_LOCALES[locale] ?? 'en-GB'], { type: 'region' }).of(order.shippingAddress.country)
    : '';
  const address = [
    order.shippingAddress.line1,
    order.shippingAddress.line2,
    [order.shippingAddress.postalCode, order.shippingAddress.city].filter(Boolean).join(' '),
    country,
  ].filter(Boolean);

  return (
    <li className={styles.order}>
      <div className={styles.orderHead}>
        <div>
          <p className={styles.orderNumber}>{t('account.orders.number', { number: order.number })}</p>
          <p className={styles.orderMeta}>
            {t('account.orders.placed', { date })} ·{' '}
            {t(order.itemCount === 1 ? 'account.orders.itemOne' : 'account.orders.itemOther', { count: order.itemCount })}
          </p>
        </div>
        <span className={`${styles.status} ${styles[`status_${order.status}`] ?? ''}`}>
          {t(`account.orders.status.${order.status}`)}
        </span>
      </div>

      <div className={styles.orderFoot}>
        <p className={styles.orderTotal}>{price(order.total)}</p>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen((value) => !value)}
        >
          {t(open ? 'account.orders.hideDetails' : 'account.orders.showDetails')}
          <PiCaretDown className={open ? styles.caretOpen : ''} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div id={detailsId} className={styles.details}>
          <ul className={styles.lines}>
            {order.items.map((item) => (
              <li key={`${item.product}-${item.variantKey}`} className={styles.line}>
                <div className={styles.thumb}>
                  {item.image && <CloudinaryImage src={item.image} alt="" fill sizes="56px" className="img-cover" />}
                </div>
                <div className={styles.lineInfo}>
                  <p className={styles.lineName}>{item.name}</p>
                  <p className={styles.lineMeta}>
                    {[item.variantLabel, t('account.orders.quantity', { count: item.quantity })].filter(Boolean).join(' · ')}
                  </p>
                  {item.contents.length > 0 && (
                    <p className={styles.lineMeta}>
                      {t('account.orders.packContains', {
                        items: item.contents.map((entry) => `${entry.quantity} × ${entry.name}`).join(', '),
                      })}
                    </p>
                  )}
                </div>
                <p className={styles.linePrice}>{price(item.lineTotal)}</p>
              </li>
            ))}
          </ul>

          <dl className={styles.summary}>
            <div>
              <dt>{t('account.orders.subtotal')}</dt>
              <dd>{price(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div>
                <dt>{t('account.orders.discount')}</dt>
                <dd>−{price(order.discount)}</dd>
              </div>
            )}
            <div>
              <dt>{t('account.orders.shipping')}</dt>
              <dd>{order.shippingFee > 0 ? price(order.shippingFee) : t('account.orders.free')}</dd>
            </div>
            <div className={styles.summaryTotal}>
              <dt>{t('account.orders.total')}</dt>
              <dd>
                {price(order.total)} <span className={styles.vat}>{t('common.inclVat')}</span>
              </dd>
            </div>
          </dl>

          {(address.length > 0 || order.customerNote) && (
            <div className={styles.extra}>
              {address.length > 0 && (
                <div>
                  <p className={styles.extraLabel}>{t('account.orders.deliverTo')}</p>
                  <p className={styles.extraText}>
                    {order.customer.name && <span className="d-block">{order.customer.name}</span>}
                    {address.map((part) => (
                      <span key={part} className="d-block">
                        {part}
                      </span>
                    ))}
                  </p>
                </div>
              )}
              {order.customerNote && (
                <div>
                  <p className={styles.extraLabel}>{t('account.orders.note')}</p>
                  <p className={styles.extraText}>{order.customerNote}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
