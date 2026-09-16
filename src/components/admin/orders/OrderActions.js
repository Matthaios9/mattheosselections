'use client';

import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/constants/status';
import { useAdminAction } from '@/hooks/useAdminAction';
import { updateAdminNote, updateOrderStatus, updatePaymentStatus } from '@/services/order';

/**
 * Side cards on the order page. Each receives the order and `onUpdated(order)`,
 * called with the updated order returned by the API.
 */

const PAYMENT_METHOD_NOTES = {
  kustom:
    'Paid with Kustom Checkout. The money is reserved at checkout and captured when you mark the order as shipped; cancelling the order cancels or refunds it.',
  card: 'Paid by card through the previous payment provider (Stripe). Refunds are made there.',
  invoice: 'Placed before online payments were enabled — update this manually when payment is received.',
};

/** What a status change will also do: stock and, for Kustom orders, the payment. */
function StatusChangeHint({ order, nextStatus }) {
  if (nextStatus === order.status) return null;
  const kustom = order.paymentMethod === 'kustom';
  let hint = null;
  if (nextStatus === 'cancelled') {
    hint = kustom && order.paymentStatus === 'authorized'
      ? 'Cancelling puts the items back in stock and cancels the payment at Kustom — the customer is not charged.'
      : kustom && order.paymentStatus === 'paid'
        ? 'Cancelling puts the items back in stock and refunds the full payment through Kustom.'
        : 'Cancelling puts the items back in stock.';
  } else if (kustom && order.paymentStatus === 'authorized' && ['shipped', 'delivered'].includes(nextStatus)) {
    hint = 'This captures the payment at Kustom — the customer is charged now.';
  }
  return hint ? <Form.Text>{hint}</Form.Text> : null;
}

export function OrderStatusCard({ order, onUpdated }) {
  const [value, setValue] = useState(order.status);
  const [note, setNote] = useState('');
  const [run, pending] = useAdminAction();

  const submit = async (event) => {
    event.preventDefault();
    const result = await run(() => updateOrderStatus(order.id, { status: value, note }), {
      success: 'Order status updated',
      onSuccess: onUpdated,
    });
    if (result.ok) setNote('');
  };

  return (
    <section className="admin-card">
      <div className="admin-card-header">
        <h2 className="admin-card-title">Fulfilment</h2>
      </div>
      <Form className="admin-card-body d-flex flex-column gap-3" onSubmit={submit}>
        <Form.Group controlId="order-status">
          <Form.Label>Order status</Form.Label>
          <Form.Select value={value} onChange={(event) => setValue(event.target.value)}>
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
          <StatusChangeHint order={order} nextStatus={value} />
        </Form.Group>
        <Form.Group controlId="order-status-note">
          <Form.Label>Note for the timeline (optional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. Shipped with PostNord, tracking 123…"
          />
        </Form.Group>
        <Button type="submit" variant="ms-dark" disabled={pending || (value === order.status && !note)}>
          {pending && <Spinner animation="border" size="sm" aria-hidden="true" />}
          Update status
        </Button>
      </Form>
    </section>
  );
}

export function PaymentStatusCard({ order, onUpdated }) {
  const [run, pending] = useAdminAction();

  return (
    <section className="admin-card">
      <div className="admin-card-header">
        <h2 className="admin-card-title">Payment</h2>
        {pending && <Spinner animation="border" size="sm" aria-label="Saving" />}
      </div>
      <div className="admin-card-body">
        <Form.Label htmlFor="payment-status">Payment status</Form.Label>
        <Form.Select
          id="payment-status"
          value={order.paymentStatus}
          disabled={pending}
          onChange={(event) =>
            run(() => updatePaymentStatus(order.id, event.target.value), {
              success: 'Payment status updated',
              onSuccess: onUpdated,
            })
          }
        >
          {PAYMENT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
        <Form.Text>{PAYMENT_METHOD_NOTES[order.paymentMethod] ?? PAYMENT_METHOD_NOTES.invoice}</Form.Text>
        {order.kustomOrderId && <p className="small text-muted-ms mt-2 mb-0">Kustom order ID: {order.kustomOrderId}</p>}
      </div>
    </section>
  );
}

export function AdminNoteCard({ order, onUpdated }) {
  const [value, setValue] = useState(order.adminNote);
  const [run, pending] = useAdminAction();

  return (
    <section className="admin-card">
      <div className="admin-card-header">
        <h2 className="admin-card-title">Internal note</h2>
      </div>
      <Form
        className="admin-card-body d-flex flex-column gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          run(() => updateAdminNote(order.id, value), { success: 'Note saved', onSuccess: onUpdated });
        }}
      >
        <Form.Control
          as="textarea"
          rows={3}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Only visible to admins"
          aria-label="Internal note"
        />
        <Button
          type="submit"
          variant="ms-outline"
          size="sm"
          className="align-self-end"
          disabled={pending || value === order.adminNote}
        >
          {pending && <Spinner animation="border" size="sm" aria-hidden="true" />}
          Save note
        </Button>
      </Form>
    </section>
  );
}
