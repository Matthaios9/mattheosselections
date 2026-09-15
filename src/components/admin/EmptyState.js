/** Icon + title + hint shown when a list or panel has nothing to display. */
export default function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="admin-empty">
      {Icon && <Icon aria-hidden="true" />}
      <strong>{title}</strong>
      {children && <span>{children}</span>}
    </div>
  );
}
