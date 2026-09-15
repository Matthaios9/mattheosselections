'use client';

import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import { PiEye, PiEyeSlash } from 'react-icons/pi';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './AuthModal.module.css';

export default function PasswordField({ id, label, value, onChange, error, placeholder, autoComplete, action }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  return (
    <Form.Group controlId={id}>
      <div className={styles.labelRow}>
        <Form.Label>{label}</Form.Label>
        {action}
      </div>
      <div className={styles.passwordWrap}>
        <Form.Control
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          isInvalid={Boolean(error)}
        />
        <button
          type="button"
          className={styles.reveal}
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
        >
          {visible ? <PiEyeSlash /> : <PiEye />}
        </button>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </div>
    </Form.Group>
  );
}
