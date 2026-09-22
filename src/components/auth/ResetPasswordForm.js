'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { PiLockKey, PiSealCheck } from 'react-icons/pi';
import PasswordField from './PasswordField';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { useFormState } from '@/hooks/useFormState';
import { useI18n } from '@/i18n/I18nProvider';
import { firstName } from '@/utils/format';
import { matches, minLength, required } from '@/utils/validation';
import styles from './AuthModal.module.css';

/** API error code → translated message key. */
const resetError = (code) =>
  code === 'invalid-token' ? 'auth.reset.expired' : code === 'disabled' ? 'auth.errors.disabled' : code === 'rate-limited' ? 'auth.errors.tooMany' : 'auth.errors.unavailable';

/**
 * The page behind the link in the reset email. `token` comes from the URL; an empty one
 * (a link truncated by a mail client, or the page opened by hand) is treated like an
 * expired link, with the same way back to asking for a new one.
 */
export default function ResetPasswordForm({ token }) {
  const { t, href } = useI18n();
  const router = useRouter();
  const { resetPassword } = useAuth();
  const { openAuth } = useUI();
  const form = useFormState({ password: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [done, setDone] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError(null);
    const valid = form.validate({
      password: [required('auth.errors.required'), minLength(8, 'auth.errors.passwordLength')],
      confirmPassword: [required('auth.errors.required'), matches('password', 'auth.errors.passwordMatch')],
    });
    if (!valid || !token) {
      if (!token) setServerError(t('auth.reset.expired'));
      return;
    }

    setSubmitting(true);
    const result = await resetPassword({ token, password: form.values.password });
    setSubmitting(false);
    if (!result.ok) {
      setServerError(t(resetError(result.error)));
      return;
    }
    setDone(result.user);
    router.refresh(); // the new session cookie is set — let the server-rendered header see it
  };

  const errorText = (name) => form.errors[name] && t(form.errors[name]);

  if (done) {
    return (
      <div className={styles.success}>
        <span className={styles.successIcon}>
          <PiSealCheck aria-hidden="true" />
        </span>
        <h1 className={styles.title}>{t('auth.reset.successTitle')}</h1>
        <p className={styles.subtitle}>{t('auth.reset.success', { name: firstName(done.name) || done.name })}</p>
        <Button variant="ms-dark" onClick={() => router.push(href('/shop'))}>
          {t('common.continueShopping')}
        </Button>
      </div>
    );
  }

  return (
    <Form noValidate onSubmit={handleSubmit} className={styles.form}>
      <header className={styles.formHeader}>
        <span className={styles.iconBadge}>
          <PiLockKey aria-hidden="true" />
        </span>
        <h1 className={styles.title}>{t('auth.reset.title')}</h1>
        <p className={styles.subtitle}>{t('auth.reset.subtitle')}</p>
      </header>

      {serverError && (
        <Alert variant="danger" className="mb-0 py-2">
          {serverError}{' '}
          <button type="button" className={styles.textLink} onClick={() => openAuth('forgot')}>
            {t('auth.reset.askAgain')}
          </button>
        </Alert>
      )}

      <PasswordField
        id="reset-password"
        label={t('auth.reset.newPassword')}
        placeholder={t('auth.placeholders.password')}
        autoComplete="new-password"
        {...form.field('password')}
        error={errorText('password')}
      />
      <PasswordField
        id="reset-confirm"
        label={t('auth.fields.confirmPassword')}
        placeholder={t('auth.placeholders.confirmPassword')}
        autoComplete="new-password"
        {...form.field('confirmPassword')}
        error={errorText('confirmPassword')}
      />

      <Button type="submit" variant="ms-dark" size="lg" className="w-100" disabled={submitting}>
        {submitting && <Spinner animation="border" size="sm" aria-hidden="true" />}
        {t('auth.reset.submit')}
      </Button>
    </Form>
  );
}
