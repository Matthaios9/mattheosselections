'use client';

import Carousel from 'react-bootstrap/Carousel';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './AnnouncementBar.module.css';

export default function AnnouncementBar() {
  const { t } = useI18n();
  const messages = t('announcement');

  return (
    <div className={styles.bar} role="region" aria-label="Announcements">
      <Carousel
        fade
        controls={false}
        indicators={false}
        interval={4500}
        pause="hover"
        touch={false}
        className={styles.carousel}
      >
        {messages.map((message) => (
          <Carousel.Item key={message} className={styles.item}>
            <p className={styles.message}>{message}</p>
          </Carousel.Item>
        ))}
      </Carousel>
    </div>
  );
}
