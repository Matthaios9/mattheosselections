'use client';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { PiWarningCircle } from 'react-icons/pi';

/** Controlled confirmation modal for destructive actions. */
export default function ConfirmDialog({
  show,
  title,
  message,
  confirmLabel = 'Delete',
  variant = 'ms-danger',
  pending = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal show={show} onHide={pending ? undefined : onCancel} centered size="sm">
      <Modal.Body className="p-4 text-center">
        <PiWarningCircle className="text-danger mb-2" style={{ fontSize: '2.5rem' }} aria-hidden="true" />
        <h2 className="h4 mb-2">{title}</h2>
        <p className="text-muted-ms small mb-4">{message}</p>
        <div className="d-flex gap-2">
          <Button variant="ms-outline" className="flex-fill" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button variant={variant} className="flex-fill" onClick={onConfirm} disabled={pending}>
            {pending && <Spinner animation="border" size="sm" aria-hidden="true" />}
            {confirmLabel}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}
