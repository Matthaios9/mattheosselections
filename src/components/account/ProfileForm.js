'use client';

import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import TextField from '@/components/common/TextField';
import { useAuth } from '@/context/AuthContext';
import { useFormState } from '@/hooks/useFormState';
import { useI18n } from '@/i18n/I18nProvider';
import { required } from '@/utils/validation';
import { accountErrorKey } from './errors';
import styles from './Account.module.css';

/** Account → Profile: the name is editable, the email (the login) is shown read-only. */
export default function ProfileForm() {
  const { t } = useI18n();
  const { user, updateProfile } = useAuth();
  const form = useFormState({ name: user.name });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { variant, key }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);
    if (!form.validate({ name: [required('account.errors.required')] })) return;

    const name = form.values.name.trim();
    if (name === user.name) {
      setMessage({ variant: 'info', key: 'account.profile.unchanged' });
      return;
    }
    setSubmitting(true);
    const result = await updateProfile({ name });
    setSubmitting(false);
    if (result.ok) {
      form.reset({ name: result.user.name });
      setMessage({ variant: 'success', key: 'account.profile.saved' });
    } else {
      setMessage({ variant: 'danger', key: accountErrorKey(result.error) });
    }
  };

  return (
    <Form noValidate onSubmit={handleSubmit} className={styles.form}>
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle} id="account-panel-title">
          {t('account.profile.title')}
        </h2>
        <p className={styles.text}>{t('account.profile.text')}</p>
      </header>

      {message && (
        <Alert variant={message.variant} className="mb-0 py-2" role="status">
          {t(message.key)}
        </Alert>
      )}

      <TextField
        id="account-name"
        label={t('account.profile.name')}
        autoComplete="name"
        maxLength={120}
        {...form.field('name')}
        error={form.errors.name && t(form.errors.name)}
      />
      <TextField
        id="account-email"
        label={t('account.profile.email')}
        type="email"
        value={user.email}
        readOnly
        disabled
        hint={t('account.profile.emailHint')}
      />

      <div className={styles.actions}>
        <Button type="submit" variant="ms-dark" disabled={submitting}>
          {submitting && <Spinner animation="border" size="sm" aria-hidden="true" />}
          {t('account.profile.save')}
        </Button>
      </div>
    </Form>
  );
}
