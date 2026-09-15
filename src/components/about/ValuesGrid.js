import Container from 'react-bootstrap/Container';
import { PiHandshake, PiLeaf, PiPlant, PiSealCheck } from 'react-icons/pi';
import Reveal from '@/components/common/Reveal';
import SectionHeading from '@/components/common/SectionHeading';
import styles from './ValuesGrid.module.css';

const ICONS = [PiLeaf, PiPlant, PiSealCheck, PiHandshake];

export default function ValuesGrid({ copy }) {
  return (
    <section className="section">
      <Container>
        <Reveal>
          <SectionHeading align="center" eyebrow={copy.eyebrow} title={copy.title} />
        </Reveal>
        <div className={styles.grid}>
          {copy.items.map((item, index) => {
            const Icon = ICONS[index % ICONS.length];
            return (
              <Reveal key={item.title} delay={index * 100} className={styles.card}>
                <div className={styles.top}>
                  <span className={styles.number}>{String(index + 1).padStart(2, '0')}</span>
                  <Icon className={styles.icon} aria-hidden="true" />
                </div>
                <h3 className={styles.title}>{item.title}</h3>
                <p className={styles.text}>{item.text}</p>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
