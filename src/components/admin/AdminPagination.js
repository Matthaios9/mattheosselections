import { PiCaretLeft, PiCaretRight } from 'react-icons/pi';

function PageButton({ page, onPageChange, label, active = false, disabled = false, children }) {
  return (
    <li className={`page-item ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}>
      <button
        type="button"
        className="page-link"
        onClick={() => onPageChange(page)}
        disabled={disabled}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
      >
        {children}
      </button>
    </li>
  );
}

/** "Showing 1–20 of 57" + page buttons for server-paginated lists. */
export default function AdminPagination({ page, pages, total, pageSize, onPageChange }) {
  if (!total) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const windowStart = Math.max(1, Math.min(page - 2, pages - 4));
  const numbers = Array.from({ length: Math.min(5, pages) }, (_, index) => windowStart + index);

  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 px-3 py-3 border-top">
      <span className="small text-muted-ms">
        Showing {from}–{to} of {total}
      </span>
      {pages > 1 && (
        <ul className="pagination">
          <PageButton page={page - 1} onPageChange={onPageChange} label="Previous page" disabled={page <= 1}>
            <PiCaretLeft />
          </PageButton>
          {numbers.map((number) => (
            <PageButton key={number} page={number} onPageChange={onPageChange} active={number === page}>
              {number}
            </PageButton>
          ))}
          <PageButton page={page + 1} onPageChange={onPageChange} label="Next page" disabled={page >= pages}>
            <PiCaretRight />
          </PageButton>
        </ul>
      )}
    </div>
  );
}
