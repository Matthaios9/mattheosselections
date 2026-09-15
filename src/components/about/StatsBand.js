import Container from 'react-bootstrap/Container';
import Reveal from '@/components/common/Reveal';
import styles from './StatsBand.module.css';

export default function StatsBand({ stats }) {
  return (
    <section className={styles.band}>
      <Container>
        <dl className={styles.grid}>
          {stats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 100} className={styles.item}>
              <dt className={styles.value}>{stat.value}</dt>
              <dd className={styles.label}>{stat.label}</dd>
            </Reveal>
          ))}
        </dl>
      </Container>
    </section>
  );
}
