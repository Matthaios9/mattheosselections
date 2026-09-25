'use client';

import { useState } from 'react';
import Image from 'next/image';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { PiCheckCircle, PiPaperPlaneTilt } from 'react-icons/pi';
import Honeypot from './Honeypot';
import Reveal from './Reveal';
import { storeConfig } from '@/config/site';
import { useI18n } from '@/i18n/I18nProvider';
import { subscribeNewsletter } from '@/services/submission';
import { isEmail } from '@/utils/validation';
import styles from './Newsletter.module.css';

export default function Newsletter() {
  const { t, locale } = useI18n();
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState('idle'); // idle | invalid | sending | success | duplicate | failed

  /** Saved in the admin under Submissions → Newsletter. */
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isEmail(email)) {
      setStatus('invalid');
      return;
    }
    setStatus('sending');
    try {
      await subscribeNewsletter({ email, locale, website });
      setStatus('success');
      setEmail('');
    } catch (error) {
      setStatus(error.code === 'already-subscribed' ? 'duplicate' : 'failed');
    }
  };

  return (
    <section className="section">
      <Container>
        <Reveal className={styles.panel}>
          <Image src="/images/editorial/honeycomb-warm.jpg" alt="" fill sizes="(min-width: 1400px) 1320px, 100vw" className={styles.texture} />
          <div className={styles.shade} aria-hidden="true" />
          <div className={styles.inner}>
            <div className={styles.copy}>
              <span className="eyebrow eyebrow-light">{t('newsletter.eyebrow')}</span>
              <h2 className={styles.title}>{t('newsletter.title')}</h2>
              {storeConfig.welcomeDiscountPercent > 0 && (
                <p className={styles.offer}>{t('newsletter.offer', { percent: storeConfig.welcomeDiscountPercent })}</p>
              )}
              <p className={styles.text}>{t('newsletter.text')}</p>
            </div>

            <div className={styles.formWrap}>
              {status === 'success' ? (
                <Alert variant="success" className={styles.success}>
                  <PiCheckCircle aria-hidden="true" />
                  <span>{t('newsletter.success')}</span>
                </Alert>
              ) : (
                <Form noValidate onSubmit={handleSubmit}>
                  <Form.Label htmlFor="newsletter-email" visuallyHidden>
                    {t('newsletter.label')}
                  </Form.Label>
                  <InputGroup className={styles.group} hasValidation>
                    <Form.Control
                      id="newsletter-email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (status !== 'idle' && status !== 'sending') setStatus('idle');
                      }}
                      placeholder={t('newsletter.placeholder')}
                      autoComplete="email"
                      isInvalid={['invalid', 'duplicate', 'failed'].includes(status)}
                      className={styles.input}
                    />
                    <Button type="submit" variant="ms-honey" className={styles.submit} disabled={status === 'sending'}>
                      {t('newsletter.submit')}
                      <PiPaperPlaneTilt className="btn-icon flip-rtl" aria-hidden="true" />
                    </Button>
                    <Form.Control.Feedback type="invalid" className={styles.error}>
                      {t(
                        status === 'failed'
                          ? 'newsletter.failed'
                          : status === 'duplicate'
                            ? 'newsletter.alreadySubscribed'
                            : 'newsletter.error'
                      )}
                    </Form.Control.Feedback>
                  </InputGroup>
                  <Honeypot value={website} onChange={setWebsite} />
                  <p className={styles.privacy}>{t('newsletter.privacy')}</p>
                </Form>
              )}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
