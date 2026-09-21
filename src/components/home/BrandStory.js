import Link from 'next/link';
import Container from 'react-bootstrap/Container';
import { PiArrowRight, PiMapPin } from 'react-icons/pi';
import CloudinaryImage from '@/components/common/CloudinaryImage';
import Reveal from '@/components/common/Reveal';
import { PHOTOS } from '@/config/photos';
import styles from './BrandStory.module.css';

export default function BrandStory({ copy, href }) {
  return (
    <section className="section">
      <Container>
        <div className={styles.grid}>
          <Reveal className={styles.visual}>
            <div className={styles.mainImage}>
              <CloudinaryImage
                src={PHOTOS.hivesChestnutGrove}
                alt={copy.imageCaption}
                fill
                sizes="(min-width: 992px) 45vw, 100vw"
                className="img-cover"
              />
            </div>
            <div className={styles.portrait}>
              <CloudinaryImage src="/images/brand/founder.jpg" alt={copy.signature} fill sizes="200px" className="img-cover" />
            </div>
            <span className={styles.caption}>
              <PiMapPin aria-hidden="true" /> {copy.imageCaption}
            </span>
          </Reveal>

          <Reveal className={styles.copy} delay={120}>
            <span className="eyebrow">{copy.eyebrow}</span>
            <h2 className="section-title">{copy.title}</h2>
            {copy.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className={styles.paragraph}>
                {paragraph}
              </p>
            ))}
            <div className={styles.signature}>
              <span className={styles.signatureName}>{copy.signature}</span>
              <span className={styles.signatureRole}>{copy.role}</span>
            </div>
            <dl className={styles.stats}>
              {copy.stats.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.value}</dt>
                  <dd>{stat.label}</dd>
                </div>
              ))}
            </dl>
            <Link href={href('/about')} className="btn-link-ms">
              {copy.cta} <PiArrowRight className="btn-icon" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
