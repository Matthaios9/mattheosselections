'use client';

import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { PiArrowLeft, PiEnvelopeSimple } from 'react-icons/pi';
import TextField from '@/components/common/TextField';
import { useFormState } from '@/hooks/useFormState';
import { useI18n } from '@/i18n/I18nProvider';
import { email, required } from '@/utils/validation';
import styles from './AuthModal.module.css';

export default function ForgotPasswordForm({ onSwitch }) {
  const { t } = useI18n();
  const form = useFormState({ email: '' });
  const [sentTo, setSentTo] = useState(null);

  // No email service is connected yet, so the request is confirmed without sending anything.
  const handleSubmit = (event) => {
    event.preventDefault();
    if (form.validate({ email: [required('auth.errors.required'), email('auth.errors.email')] })) {
      setSentTo(form.values.email.trim());
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
          <TextField
            id="forgot-email"
            label={t('auth.fields.email')}
            type="email"
            placeholder={t('auth.placeholders.email')}
            autoComplete="email"
            {...form.field('email')}
            error={form.errors.email && t(form.errors.email)}
          />
          <Button type="submit" variant="ms-dark" size="lg" className="w-100">
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
