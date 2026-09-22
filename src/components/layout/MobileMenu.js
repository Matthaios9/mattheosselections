'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Button from 'react-bootstrap/Button';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { PiArrowRight, PiEnvelopeSimple, PiSignOut, PiX } from 'react-icons/pi';
import LanguageSelector from './LanguageSelector';
import Logo from './Logo';
import SocialLinks from './SocialLinks';
import { NAV_LINKS } from '@/config/navigation';
import { siteConfig } from '@/config/site';
import { useAuth } from '@/context/AuthContext';
import { useCatalog } from '@/context/CatalogContext';
import { useWishlist } from '@/context/WishlistContext';
import { useUI } from '@/context/UIContext';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './MobileMenu.module.css';

export default function MobileMenu() {
  const { t, href } = useI18n();
  const pathname = usePathname();
  const { menuOpen, closeMenu, openAuth } = useUI();
  const { categories } = useCatalog();
  const { user, logout } = useAuth();
  const { count: savedCount } = useWishlist();

  const isActive = (path) => (path === '/' ? pathname === href('/') : pathname.startsWith(href(path)));

  return (
    <Offcanvas show={menuOpen} onHide={closeMenu} placement="start" className={styles.menu} aria-label={t('nav.menu')}>
      <div className={styles.header}>
        <Logo href={href('/')} onClick={closeMenu} />
        <button type="button" className="icon-btn" onClick={closeMenu} aria-label={t('nav.close')}>
          <PiX />
        </button>
      </div>

      <Offcanvas.Body className={styles.body}>
        <nav aria-label={t('nav.mainNavigation')}>
          <ul className={styles.links}>
            {NAV_LINKS.map((link, index) => (
              <li key={link.key} style={{ '--i': index }}>
                <Link
                  href={href(link.path)}
                  className={`${styles.link} ${isActive(link.path) ? styles.active : ''}`}
                  aria-current={isActive(link.path) ? 'page' : undefined}
                  onClick={closeMenu}
                >
                  {t(`nav.${link.key}`)}
                  <PiArrowRight className="flip-rtl" aria-hidden="true" />
                </Link>
              </li>
            ))}
            {/* Shown on the same terms as the heart in the header: only when something is saved. */}
            {savedCount > 0 && (
              <li style={{ '--i': NAV_LINKS.length }}>
                <Link
                  href={href('/wishlist')}
                  className={`${styles.link} ${isActive('/wishlist') ? styles.active : ''}`}
                  aria-current={isActive('/wishlist') ? 'page' : undefined}
                  onClick={closeMenu}
                >
                  {t('nav.wishlist')}
                  <PiArrowRight className="flip-rtl" aria-hidden="true" />
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className={styles.section}>
          <p className={styles.heading}>{t('nav.shopByCategory')}</p>
          <div className={styles.chips}>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={href(`/shop/${category.slug}`)}
                className={styles.chip}
                onClick={closeMenu}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.heading}>{t('nav.language')}</p>
          <LanguageSelector variant="segmented" onChange={closeMenu} />
        </div>

        <div className={styles.section}>
          {user ? (
            <div className={styles.user}>
              <p className={styles.userName}>{t('account.greeting', { name: user.name })}</p>
              <Button variant="ms-outline" className="w-100" onClick={logout}>
                <PiSignOut className="btn-icon" aria-hidden="true" /> {t('account.logout')}
              </Button>
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Button variant="ms-dark" onClick={() => openAuth('login')}>
                {t('account.login')}
              </Button>
              <Button variant="ms-outline" onClick={() => openAuth('signup')}>
                {t('account.signup')}
              </Button>
            </div>
          )}
        </div>
      </Offcanvas.Body>

      <div className={styles.footer}>
        <a href={`mailto:${siteConfig.email}`} className={styles.contact}>
          <PiEnvelopeSimple aria-hidden="true" /> {siteConfig.email}
        </a>
        <SocialLinks />
      </div>
    </Offcanvas>
  );
}
