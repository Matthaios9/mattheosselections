'use client';

import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import PasswordField from '@/components/auth/PasswordField';
import { useFormState } from '@/hooks/useFormState';
import { useI18n } from '@/i18n/I18nProvider';
import { changePassword } from '@/services/account';
import { getErrorCode } from '@/utils/errors';
import { matches, minLength, required } from '@/utils/validation';
import { accountErrorKey } from './errors';
import styles from './Account.module.css';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

const differentFrom = (otherField, key) => (value, values) => (value && value === values[otherField] ? key : null);

/** Account → Password: current password, then the new one twice. */
export default function ChangePasswordForm() {
  const { t } = useI18n();
  const form = useFormState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { variant, key }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);
    const valid = form.validate({
      currentPassword: [required('account.errors.required')],
      newPassword: [
        required('account.errors.required'),
        minLength(8, 'account.errors.passwordLength'),
        differentFrom('currentPassword', 'account.password.same'),
      ],
      confirmPassword: [required('account.errors.required'), matches('newPassword', 'account.errors.passwordMatch')],
    });
    if (!valid) return;

    setSubmitting(true);
    try {
      await changePassword(form.values);
      form.reset(EMPTY);
      setMessage({ variant: 'success', key: 'account.password.saved' });
    } catch (error) {
      const code = getErrorCode(error);
      if (code === 'wrong-password') form.setErrors({ currentPassword: 'account.password.wrong' });
      else setMessage({ variant: 'danger', key: accountErrorKey(code) });
    } finally {
      setSubmitting(false);
    }
  };

  const errorText = (name) => form.errors[name] && t(form.errors[name]);

  return (
    <Form noValidate onSubmit={handleSubmit} className={styles.form}>
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle} id="account-panel-title">
          {t('account.password.title')}
        </h2>
        <p className={styles.text}>{t('account.password.text')}</p>
      </header>

      {message && (
        <Alert variant={message.variant} className="mb-0 py-2" role="status">
          {t(message.key)}
        </Alert>
      )}

      <PasswordField
        id="account-current-password"
        label={t('account.password.current')}
        autoComplete="current-password"
        {...form.field('currentPassword')}
        error={errorText('currentPassword')}
      />
      <PasswordField
        id="account-new-password"
        label={t('account.password.new')}
        autoComplete="new-password"
        {...form.field('newPassword')}
        error={errorText('newPassword')}
      />
      <PasswordField
        id="account-confirm-password"
        label={t('account.password.confirm')}
        autoComplete="new-password"
        {...form.field('confirmPassword')}
        error={errorText('confirmPassword')}
      />

      <div className={styles.actions}>
        <Button type="submit" variant="ms-dark" disabled={submitting}>
          {submitting && <Spinner animation="border" size="sm" aria-hidden="true" />}
          {t('account.password.save')}
        </Button>
      </div>
    </Form>
  );
}
