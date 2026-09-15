'use client';

import Image from 'next/image';
import Container from 'react-bootstrap/Container';
import { PiArrowRight } from 'react-icons/pi';
import ButtonLink from '@/components/common/ButtonLink';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './not-found.module.css';

export default function NotFound() {
  const { t, href } = useI18n();

  return (
    <section className={styles.wrap}>
      <Container className={styles.inner}>
        <div className={styles.image}>
          <Image src="/images/editorial/bee-flower.jpg" alt="" fill sizes="(min-width: 768px) 360px, 70vw" className="img-cover" />
        </div>
        <span className="eyebrow">{t('notFound.eyebrow')}</span>
        <h1 className={`display-hero ${styles.title}`}>{t('notFound.title')}</h1>
        <p className="lead-ms">{t('notFound.text')}</p>
        <div className={styles.actions}>
          <ButtonLink href={href('/')} size="lg">
            {t('notFound.cta')}
          </ButtonLink>
          <ButtonLink href={href('/shop')} variant="ms-outline" size="lg">
            {t('notFound.secondary')} <PiArrowRight className="btn-icon btn-icon-shift flip-rtl" aria-hidden="true" />
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
