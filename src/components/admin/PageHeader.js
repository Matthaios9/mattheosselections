import Link from 'next/link';
import { PiArrowLeft } from 'react-icons/pi';
import styles from './PageHeader.module.css';

export default function PageHeader({ title, subtitle, back, actions }) {
  return (
    <header className={styles.header}>
      <div className={styles.copy}>
        {back && (
          <Link href={back.href} className={styles.back}>
            <PiArrowLeft aria-hidden="true" /> {back.label}
          </Link>
        )}
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
