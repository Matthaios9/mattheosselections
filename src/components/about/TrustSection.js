import Container from 'react-bootstrap/Container';
import { PiBuildings, PiChatsCircle, PiLockSimple, PiMapTrifold } from 'react-icons/pi';
import Reveal from '@/components/common/Reveal';
import SectionHeading from '@/components/common/SectionHeading';
import styles from './TrustSection.module.css';

const ICONS = [PiMapTrifold, PiBuildings, PiLockSimple, PiChatsCircle];

export default function TrustSection({ copy }) {
  return (
    <section className="section pb-0">
      <Container>
        <Reveal>
          <SectionHeading align="center" eyebrow={copy.eyebrow} title={copy.title} />
        </Reveal>
        <div className={styles.grid}>
          {copy.items.map((item, index) => {
            const Icon = ICONS[index % ICONS.length];
            return (
              <Reveal key={item.title} delay={index * 90} className={styles.item}>
                <Icon className={styles.icon} aria-hidden="true" />
                <div>
                  <h3 className={styles.title}>{item.title}</h3>
                  <p className={styles.text}>{item.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
