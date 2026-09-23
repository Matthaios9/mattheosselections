import CloudinaryImage from '@/components/common/CloudinaryImage';
import Link from 'next/link';
import { PiArrowUpRight } from 'react-icons/pi';
import styles from './CategoryShowcase.module.css';

export default function CategoryCard({ category, href, countLabel, cta, featured = false }) {
  return (
    <Link href={href} className={`${styles.card} ${featured ? styles.featured : ''}`}>
      <CloudinaryImage
        src={category.image}
        alt=""
        fill
        sizes={featured ? '(min-width: 1400px) 530px, (min-width: 992px) 40vw, 100vw' : '(min-width: 1400px) 370px, (min-width: 992px) 28vw, 50vw'}
        className={styles.image}
      />
      <span className={styles.overlay} aria-hidden="true" />
      <span className={styles.arrow} aria-hidden="true">
        <PiArrowUpRight className="flip-rtl" />
      </span>
      <span className={styles.content}>
        <span className={styles.count}>{countLabel}</span>
        <span className={styles.name}>{category.name}</span>
        <span className={styles.description}>{category.description}</span>
        <span className={styles.cta}>{cta}</span>
      </span>
    </Link>
  );
}
