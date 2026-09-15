'use client';

import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { PiWarningCircle } from 'react-icons/pi';
import { getErrorMessage } from '@/utils/errors';

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="d-flex align-items-center justify-content-center gap-2 py-5 text-muted-ms" role="status">
      <Spinner animation="border" size="sm" /> {label}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="admin-empty" role="alert">
      <PiWarningCircle aria-hidden="true" className="text-danger" />
      <strong>{error?.status === 404 ? 'Not found' : 'Could not load this page'}</strong>
      <span>{getErrorMessage(error)}</span>
      {onRetry && error?.status !== 404 && (
        <Button variant="ms-outline" size="sm" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/**
 * Loading / error / content switch for data loaded with `useApiQuery`:
 *   <QueryState query={query}>{(data) => …}</QueryState>
 * Once data has arrived it stays on screen while later requests load.
 */
export default function QueryState({ query, loadingLabel, children }) {
  if (query.data === undefined) {
    return query.error ? <ErrorState error={query.error} onRetry={query.refetch} /> : <LoadingState label={loadingLabel} />;
  }
  return children(query.data);
}
