'use client';

import Image from 'next/image';
import Link from 'next/link';
import Container from 'react-bootstrap/Container';
import { PiArrowRight } from 'react-icons/pi';
import { useCatalog } from '@/context/CatalogContext';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './MegaMenu.module.css';

/** Desktop "Shop" flyout: your categories, two category tiles and the "Signature" product. */
export default function MegaMenu() {
  const { t, href, price } = useI18n();
  const { categories, spotlight } = useCatalog();
  const pick = spotlight.signature; // badge "Signature" (or a featured product), chosen on the server
  const tiles = categories.slice(0, 2);

  return (
    <div className={styles.panel}>
      <Container className={styles.grid}>
        <div className={styles.column}>
          <p className={styles.heading}>{t('nav.shopByCategory')}</p>
          <ul className={styles.list}>
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={`${href('/shop')}?category=${category.id}`} className={styles.link}>
                  <span>{category.name}</span>
                  <span className={styles.count}>{category.count}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href={href('/shop')} className="btn-link-ms mt-2">
            {t('nav.shopAll')} <PiArrowRight className="btn-icon" aria-hidden="true" />
          </Link>
        </div>

        {tiles.map((category) => (
          <Link key={category.id} href={`${href('/shop')}?category=${category.id}`} className={styles.tile}>
            <Image src={category.image} alt="" fill sizes="280px" className={styles.tileImage} />
            <span className={styles.tileOverlay} aria-hidden="true" />
            <span className={styles.tileText}>
              <span className={styles.tileName}>{category.name}</span>
              {category.description && <span className={styles.tileDesc}>{category.description}</span>}
            </span>
          </Link>
        ))}

        {pick && (
          <Link href={`${href('/shop')}?q=${encodeURIComponent(pick.name)}`} className={styles.pick}>
            <p className={styles.heading}>{t('nav.editorsPick')}</p>
            <span className={styles.pickImage}>
              <Image src={pick.image} alt="" fill sizes="220px" className="img-cover" />
            </span>
            <span className={styles.pickName}>{pick.name}</span>
            <span className={styles.pickPrice}>{price(pick.price)}</span>
          </Link>
        )}
      </Container>
    </div>
  );
}
