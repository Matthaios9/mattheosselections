'use client';

import { useEffect, useRef, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { PiLockSimple } from 'react-icons/pi';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './KlarnaPayment.module.css';

const SDK_URL = 'https://x.klarnacdn.net/kp/lib/v1/api.js';
const CONTAINER_ID = 'klarna-payments-container';

let sdk = null;

/** Loads Klarna's JavaScript SDK once per page. */
function loadKlarna() {
  sdk ??= new Promise((resolve, reject) => {
    if (window.Klarna?.Payments) {
      resolve(window.Klarna);
      return;
    }
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => (window.Klarna?.Payments ? resolve(window.Klarna) : reject(new Error('Klarna SDK missing')));
    script.onerror = () => {
      sdk = null; // try again next time
      script.remove();
      reject(new Error('Klarna SDK failed to load'));
    };
    document.body.append(script);
  });
  return sdk;
}

/**
 * Klarna's payment options for an open payment session (e.g. Pay now, Pay later, Pay over time —
 * whatever Klarna offers for the order), the widget for the chosen one and the Pay button. Pay opens
 * Klarna's authorization pop-up, so it runs straight from the click (browsers block delayed pop-ups).
 * `address` must be the one returned with the session: Klarna checks it again when the order is
 * placed. Calls `onApproved(authorizationToken)` once the customer approves.
 */
export default function KlarnaPayment({ clientToken, categories, address, amount, onApproved }) {
  const { t } = useI18n();
  const [category, setCategory] = useState(categories[0]?.id);
  const [state, setState] = useState('loading'); // loading | ready | authorizing | unavailable
  const [error, setError] = useState(null); // translation key
  const initialized = useRef(null);

  useEffect(() => {
    let active = true;
    loadKlarna()
      .then((Klarna) => {
        if (initialized.current !== clientToken) {
          Klarna.Payments.init({ client_token: clientToken });
          initialized.current = clientToken;
        }
        Klarna.Payments.load({ container: `#${CONTAINER_ID}`, payment_method_category: category }, {}, (result) => {
          if (active) setState(result.show_form ? 'ready' : 'unavailable');
        });
      })
      .catch(() => {
        if (active) setState('unavailable');
      });
    return () => {
      active = false;
    };
  }, [clientToken, category]);

  const chooseCategory = (id) => {
    setError(null);
    setState('loading');
    setCategory(id);
  };

  const pay = () => {
    setError(null);
    setState('authorizing');
    window.Klarna.Payments.authorize(
      { payment_method_category: category },
      { billing_address: address, shipping_address: address },
      (result) => {
        if (result.approved && result.authorization_token) {
          onApproved(result.authorization_token);
          return;
        }
        // Closed or cancelled by the customer: nothing to say. Otherwise Klarna didn't approve.
        setState(result.show_form ? 'ready' : 'unavailable');
        if (result.error?.invalid_fields?.length) setError('checkout.errors.checkDetails');
        else if (!result.show_form) setError('checkout.errors.declined');
      }
    );
  };

  const message = error ?? (state === 'unavailable' ? 'checkout.errors.klarnaUnavailable' : null);

  return (
    <div className={styles.payment}>
      {categories.length > 1 && (
        <div className={styles.categories} role="radiogroup" aria-label={t('checkout.paymentMethod')}>
          {categories.map((option) => (
            <Form.Check
              key={option.id}
              type="radio"
              id={`klarna-${option.id}`}
              name="klarna-category"
              label={option.name}
              checked={option.id === category}
              disabled={state === 'authorizing'}
              onChange={() => chooseCategory(option.id)}
            />
          ))}
        </div>
      )}

      <div id={CONTAINER_ID} className={styles.widget} />

      {state === 'loading' && (
        <p className={styles.loading}>
          <Spinner animation="border" size="sm" aria-hidden="true" /> {t('checkout.loadingPayment')}
        </p>
      )}
      {message && (
        <Alert variant="danger" className="mb-0">
          {t(message)}
        </Alert>
      )}

      <Button variant="ms-dark" size="lg" className="w-100" disabled={state !== 'ready'} onClick={pay}>
        {state === 'authorizing' ? (
          <>
            <Spinner animation="border" size="sm" aria-hidden="true" />
            {t('checkout.paying')}
          </>
        ) : (
          <>
            <PiLockSimple className="btn-icon" aria-hidden="true" />
            {t('checkout.pay')} · {amount}
          </>
        )}
      </Button>
    </div>
  );
}
