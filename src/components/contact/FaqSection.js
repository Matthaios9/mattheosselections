import Accordion from 'react-bootstrap/Accordion';
import AccordionBody from 'react-bootstrap/AccordionBody';
import AccordionHeader from 'react-bootstrap/AccordionHeader';
import AccordionItem from 'react-bootstrap/AccordionItem';
import Container from 'react-bootstrap/Container';
import { PiEnvelopeSimple, PiQuestion, PiTruck } from 'react-icons/pi';
import Reveal from '@/components/common/Reveal';
import { siteConfig } from '@/config/site';
import styles from './FaqSection.module.css';

export default function FaqSection({ copy }) {
  return (
    <section className="section bg-sand" id="faq">
      <Container>
        <div className={styles.grid}>
          <Reveal className={styles.intro}>
            <span className="eyebrow">{copy.eyebrow}</span>
            <h2 className="section-title">{copy.title}</h2>
            <p className={styles.text}>{copy.text}</p>
            <div className={`${styles.help} ${styles.shipping}`} id="shipping">
              <span className={styles.helpIcon}>
                <PiTruck aria-hidden="true" />
              </span>
              <div>
                <h3 className={styles.helpTitle}>{copy.shipping.title}</h3>
                <ul className={styles.shippingList}>
                  {copy.shipping.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className={styles.help}>
              <span className={styles.helpIcon}>
                <PiQuestion aria-hidden="true" />
              </span>
              <div>
                <p className={styles.helpTitle}>{copy.moreTitle}</p>
                <p className={styles.helpText}>{copy.moreText}</p>
                <a href={`mailto:${siteConfig.email}`} className="btn-link-ms">
                  <PiEnvelopeSimple aria-hidden="true" /> {copy.moreCta}
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <Accordion defaultActiveKey="0" className={styles.accordion}>
              {copy.items.map((item, index) => (
                <AccordionItem key={item.q} eventKey={String(index)}>
                  <AccordionHeader as="h3">{item.q}</AccordionHeader>
                  <AccordionBody>{item.a}</AccordionBody>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
