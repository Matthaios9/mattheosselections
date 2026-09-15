import Link from 'next/link';
import { PiMagnifyingGlass } from 'react-icons/pi';

export default function AdminNotFound() {
  return (
    <div className="admin-empty" style={{ minHeight: '60vh', justifyContent: 'center' }}>
      <PiMagnifyingGlass aria-hidden="true" />
      <strong>Not found</strong>
      <span>This record does not exist or has been deleted.</span>
      <Link href="/admin" className="btn btn-ms-dark mt-2">
        Back to dashboard
      </Link>
    </div>
  );
}
