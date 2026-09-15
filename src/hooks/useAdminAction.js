'use client';

import { useState } from 'react';
import { useAdminToast } from '@/components/admin/AdminToast';
import { getErrorMessage } from '@/utils/errors';

/**
 * Run an admin change (a service call) with a pending flag and toast feedback.
 *
 *   const [run, pending] = useAdminAction();
 *   const result = await run(() => deleteProduct(id), { success: 'Product deleted', onSuccess: refetch });
 *   if (result.ok) …
 *
 * Failures show an error toast; `onError` can pick up field errors.
 * Resolves with `{ ok: true, data }` or `{ ok: false, error }` — it never throws.
 */
export function useAdminAction() {
  const notify = useAdminToast();
  const [pending, setPending] = useState(false);

  const run = async (action, { success, onSuccess, onError } = {}) => {
    setPending(true);
    try {
      const data = await action();
      if (success) notify(typeof success === 'function' ? success(data) : success);
      await onSuccess?.(data);
      return { ok: true, data };
    } catch (error) {
      onError?.(error);
      notify(getErrorMessage(error), 'danger');
      return { ok: false, error };
    } finally {
      setPending(false);
    }
  };

  return [run, pending];
}
