/**
 * Admin data table. `columns`: [{ key, header, className, render(row) }] — a column
 * without `header` gets `label` as its accessible name. Rows dim while the next
 * page loads; `list` keeps the steady minimum height used on list pages.
 */
export default function AdminTable({ columns, rows, rowKey = 'id', loading = false, list = false, empty = null }) {
  if (!rows.length) return empty;

  return (
    <div className={`admin-table-wrap ${list ? 'is-list' : ''} ${loading ? 'is-loading' : ''}`} aria-busy={loading}>
      <table className="table admin-table table-hover">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.className} aria-label={column.header ? undefined : column.label}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[rowKey]}>
              {columns.map((column) => (
                <td key={column.key} className={column.className}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
