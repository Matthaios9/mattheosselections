import Container from 'react-bootstrap/Container';
import { PiHeadset, PiSealCheck, PiShieldCheck, PiTruck } from 'react-icons/pi';
import Reveal from '@/components/common/Reveal';
import SectionHeading from '@/components/common/SectionHeading';
import styles from './WhyChooseUs.module.css';

const ICONS = [PiSealCheck, PiTruck, PiShieldCheck, PiHeadset];

export default function WhyChooseUs({ copy }) {
  return (
    <section className="section bg-sand">
      <Container>
        <Reveal>
          <SectionHeading align="center" eyebrow={copy.eyebrow} title={copy.title} />
        </Reveal>
        <div className={styles.grid}>
          {copy.items.map((item, index) => {
            const Icon = ICONS[index % ICONS.length];
            return (
              <Reveal key={item.title} delay={index * 100} className={styles.item}>
                <span className={styles.icon}>
                  <Icon aria-hidden="true" />
                </span>
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
