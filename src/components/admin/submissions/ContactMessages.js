'use client';

import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { PiArrowBendUpLeft, PiChatText, PiEnvelopeSimple, PiEye } from 'react-icons/pi';
import AdminPagination from '@/components/admin/AdminPagination';
import AdminTable from '@/components/admin/AdminTable';
import EmptyState from '@/components/admin/EmptyState';
import FilterBar from '@/components/admin/FilterBar';
import QueryState from '@/components/admin/QueryState';
import StatusPill from '@/components/admin/StatusPill';
import ConfirmDelete from './ConfirmDelete';
import { useAdminSession } from '@/context/AdminSessionContext';
import { useAdminAction } from '@/hooks/useAdminAction';
import { useApiQuery } from '@/hooks/useApiQuery';
import { deleteContactMessage, getContactMessages, setContactMessageStatus } from '@/services/submission';
import { formatDateTime } from '@/utils/format';
import { LANGUAGES } from './languages';
import styles from './Submissions.module.css';

const FILTERS = [
  {
    name: 'status',
    label: 'Any status',
    options: [
      { value: 'new', label: 'New' },
      { value: 'read', label: 'Read' },
    ],
  },
];

const replyLink = (message) => `mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`;

/** One message in full, with reply by email and "mark as unread". */
function MessageDialog({ view, onClose, onChanged }) {
  const [run, pending] = useAdminAction();
  const { message } = view;

  const markUnread = () =>
    run(() => setContactMessageStatus(message.id, 'new'), {
      success: 'Marked as unread',
      onSuccess: () => {
        onClose();
        onChanged();
      },
    });

  return (
    <Modal show={view.show} onHide={onClose} centered size="lg" aria-labelledby="contact-message-title">
      {message && (
        <>
          <Modal.Header closeButton>
            <Modal.Title as="h2" className="h4" id="contact-message-title">
              {message.subject}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <dl className={styles.meta}>
              <div>
                <dt>From</dt>
                <dd>
                  {message.name} ·{' '}
                  <a href={`mailto:${message.email}`} className="row-link">
                    {message.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt>Received</dt>
                <dd>{formatDateTime(message.createdAt)}</dd>
              </div>
              <div>
                <dt>Language</dt>
                <dd>{LANGUAGES[message.locale] ?? message.locale}</dd>
              </div>
            </dl>
            <p className={styles.body}>{message.message}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ms-outline" onClick={markUnread} disabled={pending}>
              {pending && <Spinner animation="border" size="sm" aria-hidden="true" />}
              Mark as unread
            </Button>
            <Button variant="ms-dark" href={replyLink(message)}>
              <PiArrowBendUpLeft aria-hidden="true" /> Reply by email
            </Button>
          </Modal.Footer>
        </>
      )}
    </Modal>
  );
}

/** Contact tab: messages from the contact form. Opening one marks it as read. */
export default function ContactMessages({ params, setParams }) {
  const filters = { q: params.q ?? '', status: params.status ?? '' };
  const page = Number(params.page) || 1;
  const messages = useApiQuery(['admin-messages', filters, page], () => getContactMessages({ ...filters, page }));
  const { refreshSubmissionCounts } = useAdminSession();
  // Kept while the dialog animates out, so its content doesn't vanish mid-transition.
  const [view, setView] = useState({ message: null, show: false });

  const refresh = () => {
    messages.refetch();
    refreshSubmissionCounts();
  };

  const open = async (message) => {
    setView({ message, show: true });
    if (message.status !== 'new') return;
    try {
      await setContactMessageStatus(message.id, 'read');
      refresh();
    } catch {
      // Still shown; it simply stays "New" in the list.
    }
  };

  const columns = [
    {
      key: 'from',
      header: 'From',
      render: (message) => (
        <div>
          <div className={styles.name}>{message.name}</div>
          <a href={`mailto:${message.email}`} className="cell-muted">
            {message.email}
          </a>
        </div>
      ),
    },
    {
      key: 'message',
      header: 'Message',
      render: (message) => (
        <button type="button" className={styles.messageButton} onClick={() => open(message)}>
          <span className={`${styles.subject} ${message.status === 'new' ? styles.unread : ''}`}>{message.subject}</span>
          <span className={styles.preview}>{message.message}</span>
        </button>
      ),
    },
    { key: 'createdAt', header: 'Received', className: 'cell-muted text-nowrap', render: (message) => formatDateTime(message.createdAt) },
    { key: 'status', header: 'Status', render: (message) => <StatusPill kind="contactMessage" value={message.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-end text-nowrap',
      render: (message) => (
        <>
          <button type="button" className="icon-btn" onClick={() => open(message)} aria-label={`Read the message from ${message.name}`}>
            <PiEye />
          </button>
          <ConfirmDelete
            label={`Delete the message from ${message.name}`}
            title="Delete this message?"
            message={`The message from ${message.name} (${message.email}) will be deleted.`}
            success="Message deleted"
            onDelete={() => deleteContactMessage(message.id)}
            onDeleted={refresh}
          />
        </>
      ),
    },
  ];

  return (
    <>
      <FilterBar key={filters.q} values={filters} placeholder="Search by name, email or subject" filters={FILTERS} onChange={setParams} />
      <QueryState query={messages} loadingLabel="Loading messages…">
        {(result) => (
          <>
            <AdminTable
              list
              columns={columns}
              rows={result.items}
              loading={messages.loading}
              empty={
                <EmptyState icon={filters.q || filters.status ? PiEnvelopeSimple : PiChatText} title="No messages found">
                  {filters.q || filters.status
                    ? 'Try adjusting the filters.'
                    : 'Messages appear here when visitors use the contact form.'}
                </EmptyState>
              }
            />
            <AdminPagination {...result} onPageChange={(next) => setParams({ page: next })} />
          </>
        )}
      </QueryState>

      <MessageDialog view={view} onClose={() => setView((current) => ({ ...current, show: false }))} onChanged={refresh} />
    </>
  );
}
