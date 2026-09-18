'use client';

import { useState } from 'react';
import Image from 'next/image';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { PiCheckCircle, PiPaperPlaneTilt } from 'react-icons/pi';
import Reveal from './Reveal';
import { useI18n } from '@/i18n/I18nProvider';
import { isEmail } from '@/utils/validation';
import styles from './Newsletter.module.css';

export default function Newsletter() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | invalid | success

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isEmail(email)) {
      setStatus('invalid');
      return;
    }
    // Connect to the email platform (Klaviyo, Mailchimp…) here.
    setStatus('success');
    setEmail('');
  };

  return (
    <section className="section">
      <Container>
        <Reveal className={styles.panel}>
          <Image src="/images/editorial/honeycomb-warm.jpg" alt="" fill sizes="100vw" className={styles.texture} />
          <div className={styles.shade} aria-hidden="true" />
          <div className={styles.inner}>
            <div className={styles.copy}>
              <span className="eyebrow eyebrow-light">{t('newsletter.eyebrow')}</span>
              <h2 className={styles.title}>{t('newsletter.title')}</h2>
              <p className={styles.offer}>{t('newsletter.offer')}</p>
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
                        if (status === 'invalid') setStatus('idle');
                      }}
                      placeholder={t('newsletter.placeholder')}
                      autoComplete="email"
                      isInvalid={status === 'invalid'}
                      className={styles.input}
                    />
                    <Button type="submit" variant="ms-honey" className={styles.submit}>
                      {t('newsletter.submit')}
                      <PiPaperPlaneTilt className="btn-icon flip-rtl" aria-hidden="true" />
                    </Button>
                    <Form.Control.Feedback type="invalid" className={styles.error}>
                      {t('newsletter.error')}
                    </Form.Control.Feedback>
                  </InputGroup>
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
