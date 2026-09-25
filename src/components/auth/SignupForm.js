'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import PasswordField from './PasswordField';
import TextField from '@/components/common/TextField';
import { siteConfig } from '@/config/site';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { useFormState } from '@/hooks/useFormState';
import { useI18n } from '@/i18n/I18nProvider';
import { interpolateParts } from '@/i18n/translate';
import { firstName } from '@/utils/format';
import { email, matches, minLength, required } from '@/utils/validation';
import styles from './AuthModal.module.css';

export default function SignupForm({ onSwitch, onSuccess }) {
  const { t, href } = useI18n();
  const { closeAuth } = useUI();
  const { signup } = useAuth();
  const form = useFormState({ name: '', email: '', password: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const valid = form.validate({
      name: [required('auth.errors.required')],
      email: [required('auth.errors.required'), email('auth.errors.email')],
      password: [required('auth.errors.required'), minLength(8, 'auth.errors.passwordLength')],
      confirmPassword: [required('auth.errors.required'), matches('password', 'auth.errors.passwordMatch')],
    });
    if (!valid) return;

    setSubmitting(true);
    setServerError(null);
    const result = await signup(form.values);
    setSubmitting(false);
    if (!result.ok) {
      if (result.error === 'email-taken') form.setErrors({ email: 'auth.errors.emailTaken' });
      else setServerError(t('auth.errors.unavailable'));
      return;
    }
    onSuccess(t('auth.signup.success', { name: firstName(result.user.name) }));
  };

  const errorText = (name) => form.errors[name] && t(form.errors[name]);

  return (
    <Form noValidate onSubmit={handleSubmit} className={styles.form}>
      <header className={styles.formHeader}>
        <h2 className={styles.title} id="auth-title">
          {t('auth.signup.title')}
        </h2>
        <p className={styles.subtitle}>{t('auth.signup.subtitle')}</p>
      </header>

      {serverError && (
        <Alert variant="danger" className="mb-0 py-2">
          {serverError}
        </Alert>
      )}

      <TextField
        id="signup-name"
        label={t('auth.fields.name')}
        placeholder={t('auth.placeholders.name')}
        autoComplete="name"
        {...form.field('name')}
        error={errorText('name')}
      />

      <TextField
        id="signup-email"
        label={t('auth.fields.email')}
        type="email"
        placeholder={t('auth.placeholders.email')}
        autoComplete="email"
        {...form.field('email')}
        error={errorText('email')}
      />

      <PasswordField
        id="signup-password"
        label={t('auth.fields.password')}
        placeholder={t('auth.placeholders.password')}
        autoComplete="new-password"
        {...form.field('password')}
        error={errorText('password')}
      />
      <PasswordField
        id="signup-confirm"
        label={t('auth.fields.confirmPassword')}
        placeholder={t('auth.placeholders.confirmPassword')}
        autoComplete="new-password"
        {...form.field('confirmPassword')}
        error={errorText('confirmPassword')}
      />

      <Button type="submit" variant="ms-dark" size="lg" className="w-100" disabled={submitting}>
        {submitting && <Spinner animation="border" size="sm" aria-hidden="true" />}
        {t('auth.signup.submit')}
      </Button>

      <p className={styles.terms}>
        {interpolateParts(t('auth.signup.terms'), {
          terms: (
            <Link href={href(siteConfig.termsPath)} onClick={closeAuth}>
              {t('auth.signup.termsLink')}
            </Link>
          ),
          privacy: (
            <Link href={href(siteConfig.privacyPath)} onClick={closeAuth}>
              {t('auth.signup.privacyLink')}
            </Link>
          ),
        }).map((part, index) => (
          <Fragment key={index}>{part}</Fragment>
        ))}
      </p>

      <p className={styles.switch}>
        {t('auth.signup.hasAccount')}{' '}
        <button type="button" className={styles.textLink} onClick={() => onSwitch('login')}>
          {t('auth.signup.switch')}
        </button>
      </p>
    </Form>
  );
}
