'use client';

import { useState } from 'react';
import { PiTrash } from 'react-icons/pi';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useAdminAction } from '@/hooks/useAdminAction';

/** Trash button that asks before running `onDelete` (a service call), then calls `onDeleted`. */
export default function ConfirmDelete({ label, title, message, success, onDelete, onDeleted }) {
  const [run, pending] = useAdminAction();
  const [confirm, setConfirm] = useState(false);

  return (
    <>
      <button type="button" className="icon-btn" onClick={() => setConfirm(true)} aria-label={label}>
        <PiTrash />
      </button>
      <ConfirmDialog
        show={confirm}
        title={title}
        message={message}
        pending={pending}
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          await run(onDelete, { success, onSuccess: onDeleted });
          setConfirm(false);
        }}
      />
    </>
  );
}
