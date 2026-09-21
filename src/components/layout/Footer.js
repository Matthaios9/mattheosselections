import Link from 'next/link';
import Container from 'react-bootstrap/Container';
import { PiEnvelopeSimple, PiGlobeHemisphereWest, PiLockSimple, PiMapPin } from 'react-icons/pi';
import LanguageSelector from './LanguageSelector';
import Logo from './Logo';
import SocialLinks from './SocialLinks';
import { siteConfig } from '@/config/site';
import { NAV_LINKS } from '@/config/navigation';
import { localizePath } from '@/i18n/config';
import { interpolate } from '@/i18n/translate';
import styles from './Footer.module.css';

export default function Footer({ locale, dict, categories }) {
  const href = (path) => localizePath(path, locale);
  const f = dict.footer;

  const columns = [
    {
      title: f.shopTitle,
      links: [
        { label: f.allProducts, href: href('/shop') },
        ...categories.map((category) => ({ label: category.name, href: `${href('/shop')}?category=${category.id}` })),
      ],
    },
    {
      title: f.companyTitle,
      links: NAV_LINKS.map((link) => ({ label: dict.nav[link.key], href: href(link.path) })),
    },
    {
      title: f.supportTitle,
      links: [
        { label: f.faq, href: `${href('/contact')}#faq` },
        { label: f.shipping, href: `${href('/contact')}#shipping` },
        { label: f.returns, href: `${href(siteConfig.termsPath)}#returns` },
        { label: f.terms, href: href(siteConfig.termsPath) },
        { label: f.privacy, href: href(siteConfig.privacyPath) },
        { label: f.corporate, href: `${href('/contact')}#wholesale` },
      ],
    },
  ];

  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Logo href={href('/')} light stacked />
            <p className={styles.about}>{f.about}</p>
            <div className={styles.follow}>
              <span className={styles.followLabel}>{f.followUs}</span>
              <SocialLinks light />
            </div>
          </div>

          <nav className={styles.columns} aria-label={f.navLabel}>
            {columns.map((column) => (
              <div key={column.title}>
                <p className={styles.heading}>{column.title}</p>
                <ul className={styles.links}>
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <p className={styles.heading}>{f.contactTitle}</p>
              <ul className={`${styles.links} ${styles.contact}`}>
                <li>
                  <a href={`mailto:${siteConfig.email}`}>
                    <PiEnvelopeSimple aria-hidden="true" />
                    <span>
                      {siteConfig.email}
                      <span className={styles.note}>{f.emailNote}</span>
                    </span>
                  </a>
                </li>
                <li>
                  <span>
                    <PiGlobeHemisphereWest aria-hidden="true" /> {f.onlineOnly}
                  </span>
                </li>
                <li>
                  <span>
                    <PiMapPin aria-hidden="true" />
                    <span>
                      {siteConfig.address.street}
                      <br />
                      {siteConfig.address.postalCode} {siteConfig.address.city}, {f.country}
                      <span className={styles.note}>{f.office}</span>
                    </span>
                  </span>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div className={styles.bottom}>
          <div className={styles.legal}>
            <span>{interpolate(f.copyright, { year: new Date().getFullYear() })}</span>
            <span className={styles.dot} aria-hidden="true" />
            <span>{f.legal}</span>
            <span className={styles.dot} aria-hidden="true" />
            <Link href={href(siteConfig.termsPath)}>{f.terms}</Link>
            <span className={styles.dot} aria-hidden="true" />
            <Link href={href(siteConfig.privacyPath)}>{f.privacy}</Link>
          </div>
          <div className={styles.bottomEnd}>
            <span className={styles.secure}>
              <PiLockSimple aria-hidden="true" /> {f.secure}
            </span>
            <LanguageSelector variant="footer" />
          </div>
        </div>
      </Container>
    </footer>
  );
}
