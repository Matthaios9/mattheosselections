import Container from 'react-bootstrap/Container';
import { PiClock, PiEnvelopeSimple, PiMapPin, PiPhone } from 'react-icons/pi';
import Reveal from '@/components/common/Reveal';
import { siteConfig } from '@/config/site';
import styles from './ContactInfoCards.module.css';

export default function ContactInfoCards({ copy, country }) {
  const { address } = siteConfig;
  const cards = [
    {
      key: 'email',
      Icon: PiEnvelopeSimple,
      title: copy.email,
      value: siteConfig.email,
      href: `mailto:${siteConfig.email}`,
      note: copy.emailNote,
    },
    {
      key: 'phone',
      Icon: PiPhone,
      title: copy.phone,
      value: siteConfig.phone,
      href: siteConfig.phoneHref,
      note: copy.phoneNote,
    },
    {
      key: 'address',
      Icon: PiMapPin,
      title: copy.address,
      value: `${address.street}, ${address.postalCode} ${address.city}`,
      href: siteConfig.map.directionsUrl,
      note: `${copy.addressNote}, ${country}`,
      external: true,
    },
  ];

  return (
    <div className={styles.wrap}>
      <Container>
        <div className={styles.grid}>
          {cards.map(({ key, Icon, title, value, href, note, external }, index) => (
            <Reveal key={key} delay={index * 80} className={styles.card}>
              <span className={styles.icon}>
                <Icon aria-hidden="true" />
              </span>
              <p className={styles.title}>{title}</p>
              <a
                href={href}
                className={styles.value}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {value}
              </a>
              <p className={styles.note}>{note}</p>
            </Reveal>
          ))}

          <Reveal delay={240} className={`${styles.card} ${styles.hours}`}>
            <span className={styles.icon}>
              <PiClock aria-hidden="true" />
            </span>
            <p className={styles.title}>{copy.hours}</p>
            <dl className={styles.hoursList}>
              {copy.hoursRows.map((row) => (
                <div key={row.days}>
                  <dt>{row.days}</dt>
                  <dd>{row.time}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </Container>
    </div>
  );
}
