import Image from 'next/image';
import Link from 'next/link';
import styles from './Logo.module.css';

/**
 * Brand lock-up built from the designer's vector artwork (public/images/brand).
 * Horizontal by default for the header; `stacked` reproduces the official arrangement with the
 * mark above the wordmark. `light` swaps in the reversed wordmark for dark backgrounds.
 */
export default function Logo({ href, light = false, stacked = false, onClick, className = '' }) {
  return (
    <Link
      href={href}
      className={`${styles.logo} ${stacked ? styles.stacked : ''} ${className}`}
      onClick={onClick}
      aria-label="Mattheos Selections"
    >
      <Image src="/images/brand/logo-mark.svg" alt="" width={121} height={114} className={styles.mark} preload={!light} />
      <Image
        src={light ? '/images/brand/logo-wordmark-light.svg' : '/images/brand/logo-wordmark.svg'}
        alt=""
        width={257}
        height={47}
        className={styles.wordmark}
        preload={!light}
      />
    </Link>
  );
}
