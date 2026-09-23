import Container from 'react-bootstrap/Container';
import CloudinaryImage from '@/components/common/CloudinaryImage';
import Reveal from '@/components/common/Reveal';
import { PHOTOS } from '@/config/photos';
import styles from './ProcessSteps.module.css';

export default function ProcessSteps({ copy }) {
  return (
    <section className="section bg-sand">
      <Container>
        <div className={styles.grid}>
          <div className={styles.visual}>
            <Reveal className={styles.imageMain}>
              <CloudinaryImage
                src={PHOTOS.beekeepersSmoker}
                alt=""
                fill
                sizes="(min-width: 1400px) 400px, (min-width: 992px) 30vw, 100vw"
                className="img-cover"
              />
            </Reveal>
            <Reveal className={styles.imageSmall} delay={150}>
              <CloudinaryImage src={PHOTOS.hiveWildComb} alt="" fill sizes="(min-width: 1400px) 215px, (min-width: 992px) 16vw, 45vw" className="img-cover" />
            </Reveal>
          </div>

          <div className={styles.content}>
            <Reveal className={styles.head}>
              <span className="eyebrow">{copy.eyebrow}</span>
              <h2 className="section-title">{copy.title}</h2>
              <p className={styles.intro}>{copy.text}</p>
            </Reveal>
            <ol className={styles.steps}>
              {copy.steps.map((step, index) => (
                <Reveal as="li" key={step.title} delay={index * 90} className={styles.step}>
                  <span className={styles.marker}>{index + 1}</span>
                  <div>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepText}>{step.text}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </section>
  );
}
