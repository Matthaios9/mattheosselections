'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { PiCaretDown, PiHandbagSimple, PiHeart, PiList, PiMagnifyingGlass } from 'react-icons/pi';
import AccountMenu from './AccountMenu';
import AnnouncementBar from './AnnouncementBar';
import LanguageSelector from './LanguageSelector';
import Logo from './Logo';
import MegaMenu from './MegaMenu';
import { NAV_LINKS } from '@/config/navigation';
import { useStoreCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useUI } from '@/context/UIContext';
import { useScrolled } from '@/hooks/useScrolled';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './Header.module.css';

export default function Header() {
  const { t, href } = useI18n();
  const pathname = usePathname();
  const scrolled = useScrolled(12);
  const { openSearch, openMenu, openCart } = useUI();
  const { totalItems } = useStoreCart();
  const { count: savedCount } = useWishlist();
  // The Shop flyout opens on hover/focus, which both outlast a client-side navigation.
  // Picking a link closes it until the pointer leaves or focus comes back.
  const [megaClosed, setMegaClosed] = useState(false);

  const closeMega = (event) => {
    event.currentTarget.blur();
    setMegaClosed(true);
  };

  const isActive = (path) => {
    const target = href(path);
    return path === '/' ? pathname === target : pathname.startsWith(target);
  };

  return (
    <>
      <AnnouncementBar />
      <Navbar as="header" sticky="top" className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
        <Container className={styles.inner}>
          <div className={styles.start}>
            <button type="button" className={`icon-btn d-lg-none ${styles.menuButton}`} onClick={openMenu} aria-label={t('nav.openMenu')}>
              <PiList />
            </button>
            <Logo href={href('/')} />
          </div>

          <Nav as="nav" className={`d-none d-lg-flex ${styles.nav}`} aria-label={t('nav.mainNavigation')}>
            {NAV_LINKS.map((link) => (
              <div
                key={link.key}
                className={`${styles.navItem} ${link.mega ? styles.hasMega : ''} ${link.mega && megaClosed ? styles.megaClosed : ''}`}
                onMouseLeave={link.mega ? () => setMegaClosed(false) : undefined}
                onFocus={link.mega ? () => setMegaClosed(false) : undefined}
              >
                <Nav.Link
                  as={Link}
                  href={href(link.path)}
                  active={isActive(link.path)}
                  aria-current={isActive(link.path) ? 'page' : undefined}
                  className={styles.navLink}
                  onClick={link.mega ? closeMega : undefined}
                >
                  {t(`nav.${link.key}`)}
                  {link.mega && <PiCaretDown className={styles.caret} aria-hidden="true" />}
                </Nav.Link>
                {link.mega && <MegaMenu onNavigate={closeMega} />}
              </div>
            ))}
          </Nav>

          <div className={styles.actions}>
            <LanguageSelector className="d-none d-md-block" />
            <button type="button" className="icon-btn" onClick={openSearch} aria-label={t('nav.search')}>
              <PiMagnifyingGlass />
            </button>
            <AccountMenu className="d-none d-sm-block" />
            {/* Nothing saved, nothing to show: the heart appears only once there is a list behind it.
                Saved products live in local storage, so it is always absent until hydration. */}
            {savedCount > 0 && (
              <Link
                href={href('/wishlist')}
                className={`icon-btn ${styles.cartButton}`}
                aria-label={`${t('nav.wishlist')} (${savedCount})`}
              >
                <PiHeart />
                <span key={savedCount} className={styles.badge} aria-hidden="true">
                  {savedCount > 99 ? '99+' : savedCount}
                </span>
              </Link>
            )}
            <button
              type="button"
              className={`icon-btn ${styles.cartButton}`}
              onClick={openCart}
              aria-label={`${t('nav.cart')} (${totalItems})`}
            >
              <PiHandbagSimple />
              {totalItems > 0 && (
                <span key={totalItems} className={styles.badge} aria-hidden="true">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>
          </div>
        </Container>
      </Navbar>
    </>
  );
}
