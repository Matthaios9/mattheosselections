import Container from 'react-bootstrap/Container';
import { PiBuildings, PiEnvelopeSimple, PiGlobeHemisphereWest } from 'react-icons/pi';
import Reveal from '@/components/common/Reveal';
import { siteConfig } from '@/config/site';
import styles from './ContactInfoCards.module.css';

/** Email (the only way to reach us), online-only shop and the office address (not open to visitors). */
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
      key: 'shop',
      Icon: PiGlobeHemisphereWest,
      title: copy.shop,
      value: copy.shopValue,
      note: copy.shopNote,
    },
    {
      key: 'office',
      Icon: PiBuildings,
      title: copy.office,
      value: `${address.street}, ${address.postalCode} ${address.city}, ${country}`,
      note: copy.officeNote,
    },
  ];

  return (
    <div className={styles.wrap}>
      <Container>
        <div className={styles.grid}>
          {cards.map(({ key, Icon, title, value, href, note }, index) => (
            <Reveal key={key} delay={index * 80} className={styles.card}>
              <span className={styles.icon}>
                <Icon aria-hidden="true" />
              </span>
              <p className={styles.title}>{title}</p>
              {href ? (
                <a href={href} className={styles.value}>
                  {value}
                </a>
              ) : (
                <p className={styles.value}>{value}</p>
              )}
              <p className={styles.note}>{note}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </div>
  );
}
