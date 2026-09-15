import { money } from '@/utils/format';
import styles from './RevenueChart.module.css';

const dayLabel = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** Lightweight bar chart (server-rendered, no chart library). */
export default function RevenueChart({ series }) {
  const max = Math.max(...series.map((point) => point.revenue), 1);
  const total = series.reduce((sum, point) => sum + point.revenue, 0);

  return (
    <div className={styles.wrap}>
      <p className={styles.total}>
        {money(total)} <span>in the last 14 days</span>
      </p>
      <div className={styles.chart} role="img" aria-label={`Revenue over the last 14 days: ${money(total)}`}>
        {series.map((point) => {
          const height = Math.max(3, Math.round((point.revenue / max) * 100));
          const label = `${dayLabel.format(new Date(point.date))}: ${money(point.revenue)} · ${point.orders} order${point.orders === 1 ? '' : 's'}`;
          return (
            <div key={point.date} className={styles.column} title={label}>
              <span className={`${styles.bar} ${point.revenue ? '' : styles.empty}`} style={{ height: `${height}%` }} />
              <span className={styles.day}>{dayLabel.format(new Date(point.date)).split(' ')[0]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
