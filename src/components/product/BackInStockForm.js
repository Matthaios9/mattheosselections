'use client';

import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { PiBellSimpleRinging, PiCheckCircle } from 'react-icons/pi';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/I18nProvider';
import { subscribeStockAlert } from '@/services/stock-alert';
import { getErrorCode } from '@/utils/errors';
import { isEmail } from '@/utils/validation';
import styles from './BackInStockForm.module.css';

const ERRORS = { 'in-stock': 'inStock', validation: 'email' };

/** "Notify me when available" for one sold-out size — the customer gets one email when it is back. */
export default function BackInStockForm({ product, variant }) {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? '');
  const [status, setStatus] = useState('idle'); // idle | sending | success
  const [error, setError] = useState(null);
  const name = product.variants.length > 1 ? `${product.name} (${variant.label})` : product.name;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isEmail(email)) {
      setError('email');
      return;
    }
    setStatus('sending');
    setError(null);
    try {
      await subscribeStockAlert({ productId: product.id, variantKey: variant.id, email: email.trim(), locale });
      setStatus('success');
    } catch (failure) {
      setStatus('idle');
      setError(ERRORS[getErrorCode(failure)] ?? 'unavailable');
    }
  };

  if (status === 'success') {
    return (
      <div className={`${styles.box} ${styles.success}`} role="status">
        <PiCheckCircle className={styles.icon} aria-hidden="true" />
        <p className={styles.text}>{t('product.backInStock.success', { email: email.trim() })}</p>
      </div>
    );
  }

  const inputId = `back-in-stock-${product.id}-${variant.id}`;

  return (
    <Form noValidate onSubmit={handleSubmit} className={styles.box}>
      <p className={styles.title}>
        <PiBellSimpleRinging className={styles.icon} aria-hidden="true" />
        {t('product.backInStock.title')}
      </p>
      <p className={styles.text}>{t('product.backInStock.text', { name })}</p>
      <Form.Label htmlFor={inputId} visuallyHidden>
        {t('product.backInStock.label')}
      </Form.Label>
      <div className={styles.row}>
        <Form.Control
          id={inputId}
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(null);
          }}
          placeholder={t('product.backInStock.placeholder')}
          autoComplete="email"
          isInvalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={styles.input}
        />
        <Button type="submit" variant="ms-dark" className={styles.submit} disabled={status === 'sending'}>
          {status === 'sending' && <Spinner animation="border" size="sm" aria-hidden="true" />}
          {t('product.backInStock.submit')}
        </Button>
      </div>
      {error && (
        <p id={`${inputId}-error`} className={styles.error} role="alert">
          {t(`product.backInStock.errors.${error}`)}
        </p>
      )}
    </Form>
  );
}
