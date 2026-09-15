import Image from 'next/image';
import Link from 'next/link';
import styles from './Logo.module.css';

/** Brand lock-up: the original Mattheos mark with a refined serif wordmark. */
export default function Logo({ href, light = false, onClick, className = '' }) {
  return (
    <Link
      href={href}
      className={`${styles.logo} ${light ? styles.light : ''} ${className}`}
      onClick={onClick}
      aria-label="Mattheos Selections"
    >
      <Image src="/images/brand/logo-mark.png" alt="" width={44} height={41} className={styles.mark} preload />
      <span className={styles.wordmark}>
        <span className={styles.name}>Mattheos</span>
        <span className={styles.sub}>Selections</span>
      </span>
    </Link>
  );
}
