import Image from 'next/image';
import Link from 'next/link';
import Container from 'react-bootstrap/Container';
import { PiArrowRight, PiCheck, PiMountains } from 'react-icons/pi';
import ButtonLink from '@/components/common/ButtonLink';
import HeroCarousel from './HeroCarousel';
import HeroProductCard from './HeroProductCard';
import styles from './HeroSection.module.css';

const RADIUS = 58;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function HeroSection({ copy, href, product }) {
  return (
    <section className={styles.hero}>
      <div className={styles.glow} aria-hidden="true" />
      <Container className={styles.grid}>
        <div className={styles.copy}>
          <span className="eyebrow enter">{copy.eyebrow}</span>
          <h1 className={`display-hero ${styles.title} enter`} style={{ '--enter-delay': '90ms' }}>
            {copy.titleBefore} <span className="accent-italic">{copy.titleAccent}</span> {copy.titleAfter}
          </h1>
          <div className={`${styles.intro} enter`} style={{ '--enter-delay': '180ms' }}>
            <p className={styles.introTitle}>{copy.intro}</p>
            <p className={`lead-ms ${styles.text}`}>{copy.text}</p>
            <p className={styles.tagline}>{copy.tagline}</p>
          </div>
          <div className={`${styles.actions} enter`} style={{ '--enter-delay': '270ms' }}>
            <ButtonLink href={href('/shop')} size="lg">
              {copy.primaryCta}
              <PiArrowRight className="btn-icon btn-icon-shift flip-rtl" aria-hidden="true" />
            </ButtonLink>
            <Link href={href('/about')} className="btn-link-ms">
              {copy.secondaryCta}
            </Link>
          </div>
          <ul className={`${styles.trust} enter`} style={{ '--enter-delay': '360ms' }}>
            {copy.trust.map((item) => (
              <li key={item}>
                <span className={styles.trustIcon}>
                  <PiCheck aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.visual}>
          <HeroCarousel alt={copy.imageAlt} slideLabel={copy.slide} />

          <div className={styles.seal} aria-hidden="true">
            <svg viewBox="0 0 140 140" className={styles.sealText}>
              <defs>
                <path id="hero-seal-path" d={`M70,70 m-${RADIUS},0 a${RADIUS},${RADIUS} 0 1,1 ${RADIUS * 2},0 a${RADIUS},${RADIUS} 0 1,1 -${RADIUS * 2},0`} />
              </defs>
              <text>
                <textPath href="#hero-seal-path" textLength={CIRCUMFERENCE - 4} lengthAdjust="spacingAndGlyphs">
                  {copy.badge}
                </textPath>
              </text>
            </svg>
            <span className={styles.sealCenter}>
              <Image src="/images/brand/logo-mark.svg" alt="" width={44} height={41} />
            </span>
          </div>

          <div className={styles.altitude}>
            <PiMountains aria-hidden="true" />
            <span>
              <span className={styles.altitudeLabel}>{copy.altitude}</span>
              <strong>{copy.altitudeValue}</strong>
            </span>
          </div>

          {product && <HeroProductCard product={product} label={copy.cardLabel} />}
        </div>
      </Container>
    </section>
  );
}
