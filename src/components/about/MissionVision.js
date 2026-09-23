import Image from 'next/image';
import Container from 'react-bootstrap/Container';
import { PiCompass, PiEye } from 'react-icons/pi';
import Reveal from '@/components/common/Reveal';
import styles from './MissionVision.module.css';

export default function MissionVision({ mission, vision }) {
  const cards = [
    { ...mission, Icon: PiCompass },
    { ...vision, Icon: PiEye },
  ];

  return (
    <section className="section bg-sand">
      <Container>
        <div className={styles.grid}>
          <Reveal className={`${styles.card} ${styles.first}`}>
            <CardBody {...cards[0]} />
          </Reveal>
          <Reveal className={styles.image} delay={100}>
            <Image src="/images/editorial/olive-tree.jpg" alt="" fill sizes="(min-width: 1400px) 400px, (min-width: 992px) 30vw, 100vw" className="img-cover" />
          </Reveal>
          <Reveal className={`${styles.card} ${styles.second}`} delay={200}>
            <CardBody {...cards[1]} />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function CardBody({ title, text, Icon }) {
  return (
    <>
      <span className={styles.icon}>
        <Icon aria-hidden="true" />
      </span>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.text}>{text}</p>
    </>
  );
}
