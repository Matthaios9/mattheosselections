'use client';

import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { PiArrowLeft, PiEnvelopeSimple } from 'react-icons/pi';
import TextField from '@/components/common/TextField';
import { useFormState } from '@/hooks/useFormState';
import { useI18n } from '@/i18n/I18nProvider';
import { requestPasswordReset } from '@/services/auth';
import { getErrorCode } from '@/utils/errors';
import { email, required } from '@/utils/validation';
import styles from './AuthModal.module.css';

export default function ForgotPasswordForm({ onSwitch }) {
  const { t, locale } = useI18n();
  const form = useFormState({ email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [sentTo, setSentTo] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError(null);
    if (!form.validate({ email: [required('auth.errors.required'), email('auth.errors.email')] })) return;

    const address = form.values.email.trim();
    setSubmitting(true);
    try {
      await requestPasswordReset({ email: address, locale });
      // The API answers the same for an unknown address, so this message never confirms an account.
      setSentTo(address);
    } catch (error) {
      setServerError(t(getErrorCode(error) === 'rate-limited' ? 'auth.errors.tooMany' : 'auth.errors.unavailable'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form noValidate onSubmit={handleSubmit} className={styles.form}>
      <header className={styles.formHeader}>
        <span className={styles.iconBadge}>
          <PiEnvelopeSimple aria-hidden="true" />
        </span>
        <h2 className={styles.title} id="auth-title">
          {t('auth.forgot.title')}
        </h2>
        <p className={styles.subtitle}>{t('auth.forgot.subtitle')}</p>
      </header>

      {sentTo ? (
        <Alert variant="success" className="mb-0">
          <strong className="d-block mb-1">{t('auth.forgot.successTitle')}</strong>
          {t('auth.forgot.success', { email: sentTo })}
        </Alert>
      ) : (
        <>
          {serverError && (
            <Alert variant="danger" className="mb-0 py-2">
              {serverError}
            </Alert>
          )}

          <TextField
            id="forgot-email"
            label={t('auth.fields.email')}
            type="email"
            placeholder={t('auth.placeholders.email')}
            autoComplete="email"
            {...form.field('email')}
            error={form.errors.email && t(form.errors.email)}
          />
          <Button type="submit" variant="ms-dark" size="lg" className="w-100" disabled={submitting}>
            {submitting && <Spinner animation="border" size="sm" aria-hidden="true" />}
            {t('auth.forgot.submit')}
          </Button>
        </>
      )}

      <button type="button" className={`${styles.textLink} ${styles.back}`} onClick={() => onSwitch('login')}>
        <PiArrowLeft className="flip-rtl" aria-hidden="true" /> {t('auth.forgot.back')}
      </button>
    </Form>
  );
}
