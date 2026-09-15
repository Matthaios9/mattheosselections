'use client';

import { forwardRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Dropdown from 'react-bootstrap/Dropdown';
import { PiCaretDown, PiCheck, PiGlobeSimple } from 'react-icons/pi';
import { LOCALE_COOKIE, locales } from '@/i18n/config';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './LanguageSelector.module.css';

/** Remember the choice so the proxy redirects locale-less URLs to it next time. */
function persistLocale(code) {
  document.cookie = `${LOCALE_COOKIE}=${code}; path=/; max-age=31536000; SameSite=Lax`;
}

const Toggle = forwardRef(function Toggle({ children, onClick, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={className}
      onClick={(event) => {
        event.preventDefault();
        onClick(event);
      }}
      {...props}
    >
      {children}
    </button>
  );
});

/**
 * Switches the active locale while keeping the current page, query and hash.
 * variant: 'dropdown' (header), 'footer' (dark, opens upwards) or 'segmented' (mobile menu).
 */
export default function LanguageSelector({ variant = 'dropdown', className = '', onChange }) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const current = locales.find((item) => item.code === locale);

  const switchTo = (code) => {
    if (code === locale) return;
    persistLocale(code);
    const rest = pathname.replace(/^\/[^/]+/, '');
    router.push(`/${code}${rest}${window.location.search}${window.location.hash}`);
    onChange?.(code);
  };

  if (variant === 'segmented') {
    return (
      <div className={`${styles.segmented} ${className}`} role="group" aria-label={t('nav.language')}>
        {locales.map((item) => (
          <button
            key={item.code}
            type="button"
            lang={item.code}
            className={item.code === locale ? styles.segmentActive : ''}
            aria-pressed={item.code === locale}
            onClick={() => switchTo(item.code)}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  }

  const isFooter = variant === 'footer';

  return (
    <Dropdown
      align="end"
      drop={isFooter ? 'up' : 'down'}
      onSelect={switchTo}
      className={`${styles.dropdown} ${isFooter ? styles.footer : ''} ${className}`}
    >
      <Dropdown.Toggle as={Toggle} className={styles.toggle} aria-label={`${t('nav.language')}: ${current.label}`}>
        <PiGlobeSimple className={styles.globe} aria-hidden="true" />
        <span>{isFooter ? current.label : current.shortLabel}</span>
        <PiCaretDown className={styles.caret} aria-hidden="true" />
      </Dropdown.Toggle>
      <Dropdown.Menu className={styles.menu}>
        <Dropdown.Header className={styles.header}>{t('nav.language')}</Dropdown.Header>
        {locales.map((item) => (
          <Dropdown.Item
            key={item.code}
            eventKey={item.code}
            as="button"
            lang={item.code}
            active={item.code === locale}
            className={styles.item}
          >
            <span className={styles.code}>{item.shortLabel}</span>
            <span className={styles.label}>{item.label}</span>
            {item.code === locale && <PiCheck className={styles.check} aria-hidden="true" />}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
