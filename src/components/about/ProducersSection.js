import Image from 'next/image';
import Container from 'react-bootstrap/Container';
import { PiCheck, PiMapPin } from 'react-icons/pi';
import Reveal from '@/components/common/Reveal';
import styles from './ProducersSection.module.css';

export default function ProducersSection({ copy }) {
  return (
    <section className="section">
      <Container>
        <div className={styles.grid}>
          <Reveal className={styles.copy}>
            <span className="eyebrow">{copy.eyebrow}</span>
            <h2 className="section-title">{copy.title}</h2>
            <p className={styles.text}>{copy.text}</p>
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
            <Image
              src="/images/editorial/meteora-kalabaka.jpg"
              alt={copy.caption}
              fill
              sizes="(min-width: 992px) 55vw, 100vw"
              className="img-cover"
            />
            <span className={styles.caption}>
              <PiMapPin aria-hidden="true" /> {copy.caption}
            </span>
            <div className={styles.jar}>
              <Image src="/images/editorial/bees-honeycomb.jpg" alt="" fill sizes="180px" className="img-cover" />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
