import Image from 'next/image';
import Container from 'react-bootstrap/Container';
import Reveal from '@/components/common/Reveal';
import styles from './StorySection.module.css';

export default function StorySection({ copy }) {
  return (
    <section className="section">
      <Container>
        <div className={styles.grid}>
          <Reveal className={styles.visual}>
            <div className={styles.texture}>
              <Image src="/images/editorial/honeycomb-texture.jpg" alt="" fill sizes="30vw" className="img-cover" />
            </div>
            <div className={styles.portrait}>
              <Image
                src="/images/brand/founder.jpg"
                alt={`${copy.signature} — ${copy.role}`}
                fill
                sizes="(min-width: 992px) 32vw, 80vw"
                className="img-cover"
              />
            </div>
            <div className={styles.nameTag}>
              <span className={styles.nameTagName}>{copy.signature}</span>
              <span className={styles.nameTagRole}>{copy.role}</span>
            </div>
          </Reveal>

          <Reveal className={styles.copy} delay={120}>
            <span className="eyebrow">{copy.eyebrow}</span>
            <h2 className="section-title">{copy.title}</h2>
            {copy.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className={styles.paragraph}>
                {paragraph}
              </p>
            ))}
            <blockquote className={styles.quote}>
              <p>“{copy.quote}”</p>
              <footer>— {copy.signature}</footer>
            </blockquote>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
