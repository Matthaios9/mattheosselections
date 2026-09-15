'use client';

import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import PasswordField from './PasswordField';
import TextField from '@/components/common/TextField';
import { useAuth } from '@/context/AuthContext';
import { useFormState } from '@/hooks/useFormState';
import { useI18n } from '@/i18n/I18nProvider';
import { firstName } from '@/utils/format';
import { email, required } from '@/utils/validation';
import styles from './AuthModal.module.css';

/** API error code → translated message key. */
const loginError = (code) =>
  code === 'disabled' ? 'auth.errors.disabled' : ['invalid', 'validation'].includes(code) ? 'auth.errors.invalid' : 'auth.errors.unavailable';

export default function LoginForm({ onSwitch, onSuccess }) {
  const { t } = useI18n();
  const { login } = useAuth();
  const form = useFormState({ email: '', password: '', remember: true });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError(null);
    const valid = form.validate({
      email: [required('auth.errors.required'), email('auth.errors.email')],
      password: [required('auth.errors.required')],
    });
    if (!valid) return;

    setSubmitting(true);
    const result = await login(form.values);
    setSubmitting(false);
    if (!result.ok) {
      setServerError(t(loginError(result.error)));
      return;
    }
    onSuccess(t('auth.login.success', { name: firstName(result.user.name) }));
  };

  const errorText = (name) => form.errors[name] && t(form.errors[name]);

  return (
    <Form noValidate onSubmit={handleSubmit} className={styles.form}>
      <header className={styles.formHeader}>
        <h2 className={styles.title} id="auth-title">
          {t('auth.login.title')}
        </h2>
        <p className={styles.subtitle}>{t('auth.login.subtitle')}</p>
      </header>

      {serverError && (
        <Alert variant="danger" className="mb-0 py-2">
          {serverError}
        </Alert>
      )}

      <TextField
        id="login-email"
        label={t('auth.fields.email')}
        type="email"
        placeholder={t('auth.placeholders.email')}
        autoComplete="email"
        {...form.field('email')}
        error={errorText('email')}
      />

      <PasswordField
        id="login-password"
        label={t('auth.fields.password')}
        placeholder={t('auth.placeholders.password')}
        autoComplete="current-password"
        {...form.field('password')}
        error={errorText('password')}
        action={
          <button type="button" className={styles.textLink} onClick={() => onSwitch('forgot')}>
            {t('auth.login.forgot')}
          </button>
        }
      />

      <Form.Check type="checkbox" id="login-remember" label={t('auth.login.remember')} {...form.checkbox('remember')} />

      <Button type="submit" variant="ms-dark" size="lg" className="w-100" disabled={submitting}>
        {submitting && <Spinner animation="border" size="sm" aria-hidden="true" />}
        {t('auth.login.submit')}
      </Button>

      <p className={styles.switch}>
        {t('auth.login.noAccount')}{' '}
        <button type="button" className={styles.textLink} onClick={() => onSwitch('signup')}>
          {t('auth.login.switch')}
        </button>
      </p>
    </Form>
  );
}
