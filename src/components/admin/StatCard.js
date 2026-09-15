import styles from './StatCard.module.css';

export default function StatCard({ label, value, hint, icon: Icon, tone = 'honey' }) {
  return (
    <div className={`admin-card ${styles.card}`}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        {Icon && (
          <span className={`${styles.icon} ${styles[tone]}`}>
            <Icon aria-hidden="true" />
          </span>
        )}
      </div>
      <p className={styles.value}>{value}</p>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
