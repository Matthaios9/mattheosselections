import Spinner from 'react-bootstrap/Spinner';

export default function AdminLoading() {
  return (
    <div className="d-flex align-items-center justify-content-center gap-2 py-5 text-muted-ms" role="status">
      <Spinner animation="border" size="sm" /> Loading…
    </div>
  );
}
