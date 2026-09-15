'use client';

import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import { PiCheckCircle, PiPaperPlaneTilt } from 'react-icons/pi';
import TextField from '@/components/common/TextField';
import { useFormState } from '@/hooks/useFormState';
import { useI18n } from '@/i18n/I18nProvider';
import { firstName } from '@/utils/format';
import { email, minLength, required } from '@/utils/validation';
import styles from './ContactForm.module.css';

const EMPTY = { name: '', email: '', subject: '', message: '' };

/** Validated contact form. No email service is connected yet: replace the timeout in `handleSubmit` with a service call. */
export default function ContactForm() {
  const { t } = useI18n();
  const form = useFormState(EMPTY);
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const [sentName, setSentName] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const valid = form.validate({
      name: [required('contact.form.errors.required')],
      email: [required('contact.form.errors.required'), email('contact.form.errors.email')],
      subject: [required('contact.form.errors.required')],
      message: [required('contact.form.errors.required'), minLength(10, 'contact.form.errors.message')],
    });
    if (!valid) return;

    setStatus('sending');
    window.setTimeout(() => {
      setSentName(firstName(form.values.name));
      form.reset();
      setStatus('sent');
    }, 900);
  };

  const field = (name, props = {}) => (
    <TextField
      id={`contact-${name}`}
      label={t(`contact.form.${name}`)}
      placeholder={t(`contact.form.placeholders.${name}`)}
      {...form.field(name)}
      {...props}
      error={form.errors[name] && t(form.errors[name])}
    />
  );

  return (
    <div className={styles.card}>
      <span className="eyebrow">{t('contact.form.eyebrow')}</span>
      <h2 className={styles.title}>{t('contact.form.title')}</h2>
      <p className={styles.text}>{t('contact.form.text')}</p>

      {status === 'sent' ? (
        <Alert variant="success" className={styles.success}>
          <PiCheckCircle className={styles.successIcon} aria-hidden="true" />
          <div>
            <Alert.Heading as="p" className={styles.successTitle}>
              {t('contact.form.successTitle')}
            </Alert.Heading>
            <p className="mb-2">{t('contact.form.success', { name: sentName })}</p>
            <button type="button" className={styles.again} onClick={() => setStatus('idle')}>
              {t('contact.form.sendAnother')}
            </button>
          </div>
        </Alert>
      ) : (
        <Form noValidate onSubmit={handleSubmit}>
          <Row className="g-3">
            <Col md={6}>
              {field('name', { autoComplete: 'name' })}
            </Col>
            <Col md={6}>
              {field('email', { type: 'email', autoComplete: 'email' })}
            </Col>
            <Col xs={12}>
              {field('subject')}
            </Col>
            <Col xs={12}>
              {field('message', { as: 'textarea', rows: 6, inputClassName: styles.textarea })}
            </Col>
          </Row>
          <div className={styles.footer}>
            <p className={styles.privacy}>{t('contact.form.privacy')}</p>
            <Button type="submit" variant="ms-dark" size="lg" disabled={status === 'sending'}>
              {status === 'sending' ? (
                <>
                  <Spinner animation="border" size="sm" aria-hidden="true" />
                  {t('contact.form.sending')}
                </>
              ) : (
                <>
                  {t('contact.form.submit')}
                  <PiPaperPlaneTilt className="btn-icon flip-rtl" aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
}
