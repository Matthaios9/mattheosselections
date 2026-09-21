'use client';

import { PiEnvelopeSimple } from 'react-icons/pi';
import AdminPagination from '@/components/admin/AdminPagination';
import AdminTable from '@/components/admin/AdminTable';
import EmptyState from '@/components/admin/EmptyState';
import FilterBar from '@/components/admin/FilterBar';
import QueryState from '@/components/admin/QueryState';
import ConfirmDelete from './ConfirmDelete';
import { useAdminSession } from '@/context/AdminSessionContext';
import { useApiQuery } from '@/hooks/useApiQuery';
import { deleteNewsletterSubscriber, getNewsletterSubscribers } from '@/services/submission';
import { formatDateTime } from '@/utils/format';
import { LANGUAGES } from './languages';

/** Newsletter tab: every address that signed up in the storefront, newest first. */
export default function NewsletterSubscribers({ params, setParams }) {
  const q = params.q ?? '';
  const page = Number(params.page) || 1;
  const subscribers = useApiQuery(['admin-newsletter', q, page], () => getNewsletterSubscribers({ q, page }));
  const { refreshSubmissionCounts } = useAdminSession();

  const refresh = () => {
    subscribers.refetch();
    refreshSubmissionCounts();
  };

  const columns = [
    {
      key: 'email',
      header: 'Email',
      render: (subscriber) => (
        <a href={`mailto:${subscriber.email}`} className="row-link">
          {subscriber.email}
        </a>
      ),
    },
    { key: 'locale', header: 'Language', className: 'cell-muted', render: (subscriber) => LANGUAGES[subscriber.locale] ?? subscriber.locale },
    { key: 'createdAt', header: 'Signed up', className: 'cell-muted text-nowrap', render: (subscriber) => formatDateTime(subscriber.createdAt) },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-end',
      render: (subscriber) => (
        <ConfirmDelete
          label={`Remove ${subscriber.email}`}
          title="Remove this sign-up?"
          message={`${subscriber.email} will no longer be on the newsletter list.`}
          success="Sign-up removed"
          onDelete={() => deleteNewsletterSubscriber(subscriber.id)}
          onDeleted={refresh}
        />
      ),
    },
  ];

  return (
    <>
      <FilterBar key={q} values={{ q }} placeholder="Search by email" onChange={setParams} />
      <QueryState query={subscribers} loadingLabel="Loading sign-ups…">
        {(result) => (
          <>
            <AdminTable
              list
              columns={columns}
              rows={result.items}
              loading={subscribers.loading}
              empty={
                <EmptyState icon={PiEnvelopeSimple} title="No sign-ups found">
                  {q ? 'Try a different search.' : 'Addresses appear here when visitors sign up for the newsletter.'}
                </EmptyState>
              }
            />
            <AdminPagination {...result} onPageChange={(next) => setParams({ page: next })} />
          </>
        )}
      </QueryState>
    </>
  );
}
