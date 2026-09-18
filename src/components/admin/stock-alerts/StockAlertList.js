'use client';

import { useState } from 'react';
import Link from 'next/link';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { PiBellSimpleRinging, PiPaperPlaneTilt, PiTrash } from 'react-icons/pi';
import AdminPagination from '@/components/admin/AdminPagination';
import AdminTable from '@/components/admin/AdminTable';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import EmptyState from '@/components/admin/EmptyState';
import FilterBar from '@/components/admin/FilterBar';
import PageHeader from '@/components/admin/PageHeader';
import QueryState from '@/components/admin/QueryState';
import StatusPill from '@/components/admin/StatusPill';
import { useAdminAction } from '@/hooks/useAdminAction';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useUrlParams } from '@/hooks/useUrlParams';
import { deleteStockAlert, getStockAlerts, sendStockAlertEmails } from '@/services/stock-alert';
import { formatDate } from '@/utils/format';

const FILTERS = [
  {
    name: 'status',
    label: 'Any status',
    options: [
      { value: 'waiting', label: 'Waiting' },
      { value: 'notified', label: 'Emailed' },
    ],
  },
];

const LANGUAGES = { en: 'English', sv: 'Swedish', el: 'Greek' };

function sentMessage({ sent, failed, due, configured }) {
  if (!configured) return 'Email is not set up yet, so nothing was sent.';
  if (!due) return 'Nobody is waiting for a size that is in stock right now.';
  return `${sent} email${sent === 1 ? '' : 's'} sent${failed ? `, ${failed} failed (they stay in the queue)` : ''}.`;
}

/** Trash button with a confirmation, for one request. */
function DeleteAlert({ alert, onDeleted }) {
  const [run, pending] = useAdminAction();
  const [confirm, setConfirm] = useState(false);

  return (
    <>
      <button type="button" className="icon-btn" onClick={() => setConfirm(true)} aria-label={`Delete the request from ${alert.email}`}>
        <PiTrash />
      </button>
      <ConfirmDialog
        show={confirm}
        title="Delete this request?"
        message={`${alert.email} will not be emailed when this size is back in stock.`}
        pending={pending}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          await run(() => deleteStockAlert(alert.id), { success: 'Request deleted', onSuccess: onDeleted });
          setConfirm(false);
        }}
      />
    </>
  );
}

/** "Notify me when available" requests: who is waiting for which size, and who has been emailed. */
export default function StockAlertList() {
  const [params, setParams] = useUrlParams();
  const filters = { q: params.q ?? '', status: params.status ?? '' };
  const page = Number(params.page) || 1;
  const alerts = useApiQuery(['admin-stock-alerts', filters, page], () => getStockAlerts({ ...filters, page }));
  const [run, sending] = useAdminAction();

  const sendNow = () =>
    run(sendStockAlertEmails, { success: sentMessage, onSuccess: alerts.refetch });

  const columns = [
    {
      key: 'email',
      header: 'Customer',
      render: (alert) => (
        <div>
          <a href={`mailto:${alert.email}`} className="row-link">
            {alert.email}
          </a>
          <div className="cell-muted">{LANGUAGES[alert.locale] ?? alert.locale}</div>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Waiting for',
      render: (alert) =>
        alert.product ? (
          <div>
            <Link href={`/admin/products/${alert.product.id}`} className="row-link">
              {alert.product.name}
            </Link>
            <div className="cell-muted">{alert.sizeLabel}</div>
          </div>
        ) : (
          <span className="cell-muted">Deleted product</span>
        ),
    },
    {
      key: 'stock',
      header: 'Stock now',
      render: (alert) => <StatusPill kind="stock" value={alert.inStock ? 'in' : 'out'} />,
    },
    { key: 'requested', header: 'Requested', className: 'cell-muted text-nowrap', render: (alert) => formatDate(alert.createdAt) },
    {
      key: 'status',
      header: 'Status',
      className: 'text-nowrap',
      render: (alert) => (
        <div>
          <StatusPill kind="stockAlert" value={alert.status} />
          {alert.notifiedAt && <div className="cell-muted">{formatDate(alert.notifiedAt)}</div>}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-end',
      render: (alert) => <DeleteAlert alert={alert} onDeleted={alerts.refetch} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Stock alerts"
        subtitle="Customers who asked to be emailed when a sold-out size is back. The email goes out automatically when you restock the size and save the product."
        actions={
          <Button variant="ms-dark" onClick={sendNow} disabled={sending}>
            {sending ? <Spinner animation="border" size="sm" aria-hidden="true" /> : <PiPaperPlaneTilt aria-hidden="true" />}
            Send due emails now
          </Button>
        }
      />

      {alerts.data && !alerts.data.emailConfigured && (
        <Alert variant="warning">
          Email is not set up yet (the SMTP settings are missing), so back-in-stock emails cannot be sent. Requests are
          still saved; use “Send due emails now” once email is configured.
        </Alert>
      )}

      <section className="admin-card">
        <FilterBar key={filters.q} values={filters} placeholder="Search by email" filters={FILTERS} onChange={setParams} />

        <QueryState query={alerts} loadingLabel="Loading requests…">
          {(result) => (
            <>
              <AdminTable
                list
                columns={columns}
                rows={result.items}
                loading={alerts.loading}
                empty={
                  <EmptyState icon={PiBellSimpleRinging} title="No requests found">
                    {Object.values(filters).some(Boolean)
                      ? 'Try adjusting the filters.'
                      : 'Requests appear here when customers ask to be notified about a sold-out product.'}
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
