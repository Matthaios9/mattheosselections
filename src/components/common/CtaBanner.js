import Image from 'next/image';
import Container from 'react-bootstrap/Container';
import { PiArrowRight } from 'react-icons/pi';
import ButtonLink from './ButtonLink';
import Reveal from './Reveal';
import styles from './CtaBanner.module.css';

/** Full-width image call-to-action used at the end of content pages. */
export default function CtaBanner({ title, text, primary, secondary, image }) {
  return (
    <section className="section">
      <Container>
        <Reveal className={styles.banner}>
          <Image src={image} alt="" fill sizes="(min-width: 1400px) 1320px, 100vw" className={styles.image} />
          <div className={styles.overlay} aria-hidden="true" />
          <div className={styles.content}>
            <h2 className={styles.title}>{title}</h2>
            {text && <p className={styles.text}>{text}</p>}
            <div className={styles.actions}>
              {primary && (
                <ButtonLink href={primary.href} variant="ms-honey" size="lg">
                  {primary.label}
                  <PiArrowRight className="btn-icon btn-icon-shift flip-rtl" aria-hidden="true" />
                </ButtonLink>
              )}
              {secondary && (
                <ButtonLink href={secondary.href} variant="ms-ghost-light" size="lg">
                  {secondary.label}
                </ButtonLink>
              )}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
