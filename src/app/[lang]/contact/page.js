import Container from 'react-bootstrap/Container';
import PageHero from '@/components/common/PageHero';
import Reveal from '@/components/common/Reveal';
import ContactAside from '@/components/contact/ContactAside';
import ContactForm from '@/components/contact/ContactForm';
import ContactInfoCards from '@/components/contact/ContactInfoCards';
import FaqSection from '@/components/contact/FaqSection';
import { PHOTOS } from '@/config/photos';
import { localizePath } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import styles from './page.module.css';

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const { dict } = await getDictionary(lang);
  return { title: dict.meta.contact.title, description: dict.meta.contact.description };
}

export default async function ContactPage({ params }) {
  const { lang } = await params;
  const { dict } = await getDictionary(lang);
  const contact = dict.contact;

  return (
    <>
      <PageHero
        size="sm"
        overlap
        image={PHOTOS.hivesMountainRoad}
        imagePosition="50% 72%"
        eyebrow={contact.hero.eyebrow}
        title={contact.hero.title}
        text={contact.hero.text}
        breadcrumbs={[{ label: dict.nav.home, href: localizePath('/', lang) }, { label: dict.nav.contact }]}
      />
      <ContactInfoCards copy={contact.info} country={dict.footer.country} />
      <section className="section">
        <Container>
          <div className={styles.grid}>
            <Reveal>
              <ContactForm />
            </Reveal>
            <Reveal delay={120}>
              <ContactAside copy={contact} />
            </Reveal>
          </div>
        </Container>
      </section>
      <FaqSection copy={contact.faq} />
    </>
  );
}
