import Container from 'react-bootstrap/Container';
import { PiCheck, PiMapPin } from 'react-icons/pi';
import CloudinaryImage from '@/components/common/CloudinaryImage';
import Reveal from '@/components/common/Reveal';
import { PHOTOS } from '@/config/photos';
import styles from './ProducersSection.module.css';

export default function ProducersSection({ copy }) {
  return (
    <section className="section">
      <Container>
        <div className={styles.grid}>
          <Reveal className={styles.copy}>
            <span className="eyebrow">{copy.eyebrow}</span>
            <h2 className="section-title">{copy.title}</h2>
            {copy.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className={styles.text}>
                {paragraph}
              </p>
            ))}
            <ul className={styles.points}>
              {copy.points.map((point) => (
                <li key={point}>
                  <span className={styles.check}>
                    <PiCheck aria-hidden="true" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className={styles.visual} delay={120}>
            <CloudinaryImage
              src="/images/editorial/meteora-kalabaka.jpg"
              alt={copy.caption}
              fill
              sizes="(min-width: 1400px) 730px, (min-width: 992px) 55vw, 100vw"
              className="img-cover"
            />
            <span className={styles.caption}>
              <PiMapPin aria-hidden="true" /> {copy.caption}
            </span>
            <div className={styles.jar}>
              <CloudinaryImage src={PHOTOS.beekeepingFamilyBw} alt="" fill sizes="180px" className="img-cover" />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
