'use client';

import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { locales } from '@/i18n/config';
import styles from './LocaleTabs.module.css';

/**
 * One tab per store language (from src/i18n/config.js). `children(locale)` renders the fields.
 * `status[locale]` = 'error' | 'missing' shows a marker on the tab.
 */
export default function LocaleTabs({ id, status = {}, children }) {
  return (
    <Tabs id={id} defaultActiveKey={locales[0].code} className={styles.tabs} mountOnEnter={false}>
      {locales.map((locale) => (
        <Tab
          key={locale.code}
          eventKey={locale.code}
          title={
            <span className={styles.title}>
              <span className={styles.code}>{locale.shortLabel}</span>
              {locale.label}
              {status[locale.code] && (
                <span
                  className={`${styles.marker} ${status[locale.code] === 'error' ? styles.error : styles.missing}`}
                  title={status[locale.code] === 'error' ? 'Has errors' : 'Translation missing — English will be shown'}
                />
              )}
            </span>
          }
        >
          <div className={styles.panel}>{children(locale.code)}</div>
        </Tab>
      ))}
    </Tabs>
  );
}
