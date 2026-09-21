import Container from 'react-bootstrap/Container';
import Breadcrumbs from './Breadcrumbs';
import CloudinaryImage from './CloudinaryImage';
import styles from './PageHero.module.css';

/**
 * Editorial image banner used at the top of inner pages (About, Shop, Contact).
 * `overlap` reserves room at the bottom for content that overlaps the banner (e.g. contact cards).
 * `imagePosition` is the CSS object-position, to keep the subject in frame in the wide banner.
 */
export default function PageHero({
  image,
  imageAlt = '',
  imagePosition,
  eyebrow,
  title,
  text,
  breadcrumbs,
  size = 'md',
  overlap = false,
  children,
}) {
  return (
    <section className={`${styles.wrap} ${styles[size]} ${overlap ? styles.overlap : ''}`}>
      <div className={styles.frame}>
        <CloudinaryImage
          src={image}
          alt={imageAlt}
          fill
          preload
          quality={85}
          sizes="100vw"
          className={styles.image}
          style={imagePosition ? { objectPosition: imagePosition } : undefined}
        />
        <div className={styles.overlay} aria-hidden="true" />
        <Container className={styles.content}>
          {breadcrumbs && (
            <div className="enter" style={{ '--enter-delay': '60ms' }}>
              <Breadcrumbs items={breadcrumbs} className={styles.breadcrumb} />
            </div>
          )}
          <div className={styles.copy}>
            {eyebrow && (
              <span className="eyebrow eyebrow-light enter" style={{ '--enter-delay': '120ms' }}>
                {eyebrow}
              </span>
            )}
            <h1 className={`display-hero ${styles.title} enter`} style={{ '--enter-delay': '200ms' }}>
              {title}
            </h1>
            {text && (
              <p className={`${styles.text} enter`} style={{ '--enter-delay': '300ms' }}>
                {text}
              </p>
            )}
            {children && (
              <div className="enter" style={{ '--enter-delay': '400ms' }}>
                {children}
              </div>
            )}
          </div>
        </Container>
      </div>
    </section>
  );
}
