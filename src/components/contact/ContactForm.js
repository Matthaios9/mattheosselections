'use client';

import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import { PiCheckCircle, PiPaperPlaneTilt } from 'react-icons/pi';
import Honeypot from '@/components/common/Honeypot';
import TextField from '@/components/common/TextField';
import { useFormState } from '@/hooks/useFormState';
import { useI18n } from '@/i18n/I18nProvider';
import { sendContactMessage } from '@/services/submission';
import { firstName } from '@/utils/format';
import {
  CONTACT_MESSAGE_MAX_LENGTH,
  CONTACT_SUBJECT_MAX_LENGTH,
  NAME_MAX_LENGTH,
  email,
  maxLength,
  minLength,
  noDigits,
  personName,
  required,
} from '@/utils/validation';
import styles from './ContactForm.module.css';

const EMPTY = { name: '', email: '', subject: '', message: '' };

/** Validated contact form. Messages are saved in the admin under Submissions → Contact. */
export default function ContactForm() {
  const { t, locale } = useI18n();
  const form = useFormState(EMPTY);
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | failed
  const [sentName, setSentName] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const valid = form.validate({
      name: [
        required('contact.form.errors.required'),
        maxLength(NAME_MAX_LENGTH, 'contact.form.errors.nameLength'),
        noDigits('contact.form.errors.name'),
        personName('contact.form.errors.nameCharacters'),
      ],
      email: [required('contact.form.errors.required'), email('contact.form.errors.email')],
      subject: [required('contact.form.errors.required'), maxLength(CONTACT_SUBJECT_MAX_LENGTH, 'contact.form.errors.tooLong')],
      message: [
        required('contact.form.errors.required'),
        minLength(10, 'contact.form.errors.message'),
        maxLength(CONTACT_MESSAGE_MAX_LENGTH, 'contact.form.errors.tooLong'),
      ],
    });
    if (!valid) return;

    setStatus('sending');
    try {
      await sendContactMessage({ ...form.values, locale, website });
      setSentName(firstName(form.values.name));
      form.reset();
      setStatus('sent');
    } catch {
      setStatus('failed');
    }
  };

  const field = (name, props = {}) => (
    <TextField
      id={`contact-${name}`}
      label={t(`contact.form.${name}`)}
      placeholder={t(`contact.form.placeholders.${name}`)}
      {...form.field(name)}
      {...props}
      error={form.errors[name] && t(form.errors[name], { max: props.maxLength })}
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
          {status === 'failed' && (
            <Alert variant="danger" className="mb-3">
              {t('contact.form.errors.failed')}
            </Alert>
          )}
          <Row className="g-3">
            <Col md={6}>
              {field('name', { autoComplete: 'name', maxLength: NAME_MAX_LENGTH })}
            </Col>
            <Col md={6}>
              {field('email', { type: 'email', autoComplete: 'email', maxLength: 254 })}
            </Col>
            <Col xs={12}>
              {field('subject', { maxLength: CONTACT_SUBJECT_MAX_LENGTH })}
            </Col>
            <Col xs={12}>
              {field('message', { as: 'textarea', rows: 6, inputClassName: styles.textarea, maxLength: CONTACT_MESSAGE_MAX_LENGTH })}
            </Col>
          </Row>
          <Honeypot value={website} onChange={setWebsite} />
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
