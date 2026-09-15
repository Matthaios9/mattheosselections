'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import Link from 'next/link';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { PiArrowLeft, PiCheck, PiLockSimple, PiWarningCircle, PiX } from 'react-icons/pi';
import CartLine from './CartLine';
import KlarnaPayment from './KlarnaPayment';
import TextField from '@/components/common/TextField';
import { useAuth } from '@/context/AuthContext';
import { useStoreCart } from '@/context/CartContext';
import { useUI } from '@/context/UIContext';
import { useFormState } from '@/hooks/useFormState';
import { useI18n } from '@/i18n/I18nProvider';
import { confirmPayment, startCheckout } from '@/services/checkout';
import { calculateShipping, SHIPPING_COUNTRIES } from '@/utils/shipping';
import { email, minLength, required } from '@/utils/validation';
import styles from './CheckoutModal.module.css';

const EMPTY_DETAILS = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  street: '',
  street2: '',
  postalCode: '',
  city: '',
  country: 'SE',
  note: '',
};

const CONFIRM_ERRORS = { 'sold-out': 'checkout.soldOut', declined: 'checkout.errors.declined' };

/**
 * Checkout in two steps, like the WooCommerce shop with Klarna Payments:
 * 1. details — contact details, delivery address and country (sets the shipping fee), an optional note;
 * 2. payment — Klarna's payment options and widget; the customer approves the payment with Klarna.
 * The order is then placed and the items taken out of stock. Klarna's redirect page brings the
 * customer back here with ?payment=success&order=…, which shows the confirmation.
 */
export default function CheckoutModal() {
  const { t, href, price, locale } = useI18n();
  const { user } = useAuth();
  const { checkoutOpen, openCheckout, closeCheckout } = useUI();
  const cart = useStoreCart();
  const form = useFormState(EMPTY_DETAILS);
  const [status, setStatus] = useState('details'); // details | opening | payment | confirming | confirmed | failed
  const [payment, setPayment] = useState(null); // { sessionId, clientToken, categories, address }
  const [serverError, setServerError] = useState(null);
  const [outcome, setOutcome] = useState(null); // { number } when confirmed, { message } when failed

  const countryNames = new Intl.DisplayNames([locale], { type: 'region' });
  const countries = SHIPPING_COUNTRIES.map((code) => ({ code, name: countryNames.of(code) })).sort((a, b) =>
    a.name.localeCompare(b.name, locale)
  );
  const shipping = calculateShipping(cart.subtotal, form.values.country);
  const total = cart.subtotal + shipping;
  const busy = status === 'opening' || status === 'confirming';
  const errorText = (name) => form.errors[name] && t(form.errors[name]);

  const showConfirmation = useEffectEvent((number) => {
    cart.emptyCart();
    setOutcome({ number });
    setStatus('confirmed');
    openCheckout();
  });

  // Back from Klarna's redirect: show the confirmation once, then clean the URL so a refresh doesn't repeat it.
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const number = params.get('order');
      if (params.get('payment') !== 'success' || !number) return;
      params.delete('payment');
      params.delete('order');
      const query = params.toString();
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
      showConfirmation(number);
    });
    return () => clearTimeout(timer);
  }, []);

  // Signed-in customers start with their name and email filled in.
  const prefill = () => {
    if (!user) return;
    const [first = '', ...rest] = (user.name ?? '').trim().split(/\s+/);
    form.setValues((values) => ({
      ...values,
      firstName: values.firstName || first,
      lastName: values.lastName || rest.join(' '),
      email: values.email || user.email,
    }));
  };

  const showCheckoutError = (error) => {
    const problems = error.details?.problems;
    if (problems?.length) {
      const names = problems
        .map((problem) => {
          const item = cart.items.find(
            (entry) => String(entry.productId) === problem.productId && entry.variantId === problem.variantId
          );
          return item ? `${item.name} (${item.variantLabel})` : null;
        })
        .filter(Boolean);
      setServerError(t('checkout.errors.itemsUnavailable', { items: [...new Set(names)].join(', ') }));
    } else if (error.code === 'country-unavailable') {
      setServerError(t('checkout.errors.countryUnavailable', { country: countryNames.of(form.values.country) }));
    } else if (error.fieldErrors) {
      setServerError(t('checkout.errors.checkDetails'));
    } else {
      setServerError(t(error.code === 'payments-unavailable' ? 'checkout.errors.paymentUnavailable' : 'checkout.errors.unavailable'));
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const valid = form.validate({
      firstName: [required('auth.errors.required')],
      lastName: [required('auth.errors.required')],
      email: [required('auth.errors.required'), email('auth.errors.email')],
      phone: [required('auth.errors.required'), minLength(5, 'checkout.errors.phone')],
      street: [required('auth.errors.required')],
      postalCode: [required('auth.errors.required')],
      city: [required('auth.errors.required')],
    });
    if (!valid) return;

    setStatus('opening');
    setServerError(null);
    try {
      const session = await startCheckout({
        ...form.values,
        items: cart.items.map((item) => ({ productId: String(item.productId), variantId: item.variantId, quantity: item.quantity })),
        locale,
        returnPath: window.location.pathname,
      });
      setPayment(session);
      setStatus('payment');
    } catch (error) {
      setStatus('details');
      showCheckoutError(error);
    }
  };

  // The customer approved the payment in Klarna's widget: place the order.
  const handleApproved = async (authorizationToken) => {
    setStatus('confirming');
    try {
      const result = await confirmPayment(payment.sessionId, authorizationToken);
      cart.emptyCart();
      if (result.redirectUrl) {
        window.location.assign(result.redirectUrl); // Klarna sends the customer back with ?payment=success
        return;
      }
      setOutcome({ number: result.orderNumber });
      setStatus('confirmed');
    } catch (error) {
      setOutcome({ message: t(CONFIRM_ERRORS[error.code] ?? 'checkout.errors.confirmFailed') });
      setStatus('failed');
    }
  };

  const backToDetails = () => {
    setPayment(null);
    setStatus('details');
  };

  // Closing the modal abandons an open Klarna payment; the cart may change before it's reopened.
  const handleExited = () => {
    if (status === 'confirmed') form.reset();
    setPayment(null);
    setOutcome(null);
    setServerError(null);
    setStatus('details');
  };

  return (
    <Modal
      show={checkoutOpen}
      onShow={prefill}
      onHide={busy ? undefined : closeCheckout}
      onExited={handleExited}
      centered
      scrollable
      size={status === 'details' || status === 'opening' || status === 'payment' ? 'lg' : undefined}
      aria-labelledby="checkout-title"
      contentClassName={styles.content}
    >
      <button type="button" className={styles.close} onClick={closeCheckout} disabled={busy} aria-label={t('common.close')}>
        <PiX />
      </button>

      {status === 'confirming' && (
        <Modal.Body className={styles.confirmed}>
          <Spinner animation="border" aria-hidden="true" />
          <h2 className={styles.title} id="checkout-title">
            {t('checkout.confirming')}
          </h2>
        </Modal.Body>
      )}

      {status === 'confirmed' && (
        <Modal.Body className={styles.confirmed}>
          <span className={styles.check}>
            <PiCheck aria-hidden="true" />
          </span>
          <h2 className={styles.title} id="checkout-title">
            {t('checkout.confirmedTitle')}
          </h2>
          <p className={styles.text}>{t('checkout.confirmedText', { number: outcome?.number })}</p>
          <Button as={Link} href={href('/shop')} variant="ms-dark" className="btn-block-mobile" onClick={closeCheckout}>
            {t('checkout.backToShop')}
          </Button>
        </Modal.Body>
      )}

      {status === 'failed' && (
        <Modal.Body className={styles.confirmed}>
          <span className={`${styles.check} ${styles.checkWarning}`}>
            <PiWarningCircle aria-hidden="true" />
          </span>
          <h2 className={styles.title} id="checkout-title">
            {t('checkout.failedTitle')}
          </h2>
          <p className={styles.text}>{outcome?.message}</p>
          <div className={styles.outcomeActions}>
            <Button as={Link} href={href('/contact')} variant="ms-outline" className="btn-block-mobile" onClick={closeCheckout}>
              {t('nav.contact')}
            </Button>
            <Button variant="ms-dark" className="btn-block-mobile" onClick={closeCheckout}>
              {t('checkout.backToShop')}
            </Button>
          </div>
        </Modal.Body>
      )}

      {status === 'payment' && payment && (
        <>
          <Modal.Header className={styles.header}>
            <div>
              <h2 className={styles.title} id="checkout-title">
                {t('checkout.paymentTitle')}
              </h2>
              <p className={styles.subtitle}>{t('checkout.paymentSubtitle')}</p>
            </div>
          </Modal.Header>
          <Modal.Body className={styles.body}>
            <button type="button" className={styles.backLink} onClick={backToDetails}>
              <PiArrowLeft className="flip-rtl" aria-hidden="true" /> {t('checkout.back')}
            </button>
            <KlarnaPayment
              clientToken={payment.clientToken}
              categories={payment.categories}
              address={payment.address}
              amount={price(total)}
              onApproved={handleApproved}
            />
          </Modal.Body>
        </>
      )}

      {(status === 'details' || status === 'opening') && (
        <Form noValidate onSubmit={submit} className={styles.form}>
          <Modal.Header className={styles.header}>
            <div>
              <h2 className={styles.title} id="checkout-title">
                {t('checkout.title')}
              </h2>
              <p className={styles.subtitle}>{t('checkout.subtitle')}</p>
            </div>
          </Modal.Header>
          <Modal.Body className={styles.body}>
            <div className={styles.layout}>
              <div className={styles.details}>
                {serverError && (
                  <Alert variant="danger" className="mb-0">
                    {serverError}
                  </Alert>
                )}
                <fieldset className={styles.fieldset}>
                  <legend className={styles.legend}>{t('checkout.contactTitle')}</legend>
                  <div className={styles.row}>
                    <TextField
                      id="checkout-first-name"
                      label={t('checkout.fields.firstName')}
                      autoComplete="given-name"
                      {...form.field('firstName')}
                      error={errorText('firstName')}
                    />
                    <TextField
                      id="checkout-last-name"
                      label={t('checkout.fields.lastName')}
                      autoComplete="family-name"
                      {...form.field('lastName')}
                      error={errorText('lastName')}
                    />
                  </div>
                  <TextField
                    id="checkout-email"
                    type="email"
                    label={t('checkout.fields.email')}
                    autoComplete="email"
                    {...form.field('email')}
                    error={errorText('email')}
                  />
                  <TextField
                    id="checkout-phone"
                    type="tel"
                    label={t('checkout.fields.phone')}
                    autoComplete="tel"
                    {...form.field('phone')}
                    error={errorText('phone')}
                  />
                </fieldset>

                <fieldset className={styles.fieldset}>
                  <legend className={styles.legend}>{t('checkout.shippingTitle')}</legend>
                  <TextField
                    id="checkout-street"
                    label={t('checkout.fields.street')}
                    autoComplete="address-line1"
                    {...form.field('street')}
                    error={errorText('street')}
                  />
                  <TextField
                    id="checkout-street2"
                    label={t('checkout.fields.street2')}
                    autoComplete="address-line2"
                    {...form.field('street2')}
                    error={errorText('street2')}
                  />
                  <div className={styles.row}>
                    <TextField
                      id="checkout-postal-code"
                      label={t('checkout.fields.postalCode')}
                      autoComplete="postal-code"
                      {...form.field('postalCode')}
                      error={errorText('postalCode')}
                    />
                    <TextField
                      id="checkout-city"
                      label={t('checkout.fields.city')}
                      autoComplete="address-level2"
                      {...form.field('city')}
                      error={errorText('city')}
                    />
                  </div>
                  <Form.Group controlId="checkout-country">
                    <Form.Label>{t('checkout.fields.country')}</Form.Label>
                    <Form.Select {...form.field('country')} autoComplete="country">
                      {countries.map(({ code, name }) => (
                        <option key={code} value={code}>
                          {name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group controlId="checkout-note">
                    <Form.Label>{t('checkout.fields.note')}</Form.Label>
                    <Form.Control as="textarea" rows={3} {...form.field('note')} placeholder={t('checkout.placeholders.note')} />
                  </Form.Group>
                </fieldset>
              </div>

              <aside className={styles.summary}>
                <p className={styles.legend}>{t('checkout.summaryTitle')}</p>
                <ul className={styles.lines}>
                  {cart.items.map((item) => (
                    <CartLine key={item.id} item={item} compact />
                  ))}
                </ul>
                <dl className={styles.totals}>
                  <div>
                    <dt>{t('cart.subtotal')}</dt>
                    <dd>{price(cart.subtotal)}</dd>
                  </div>
                  <div>
                    <dt>{t('checkout.shipping')}</dt>
                    <dd>{shipping === 0 ? t('checkout.free') : price(shipping)}</dd>
                  </div>
                  <div className={styles.grand}>
                    <dt>{t('checkout.total')}</dt>
                    <dd>{price(total)}</dd>
                  </div>
                </dl>
              </aside>
            </div>
          </Modal.Body>
          <Modal.Footer className={styles.footer}>
            <p className={styles.paymentNote}>
              <PiLockSimple aria-hidden="true" /> {t('checkout.paymentNote')}
            </p>
            <Button type="submit" variant="ms-dark" size="lg" className="w-100" disabled={busy || cart.isEmpty}>
              {status === 'opening' ? (
                <>
                  <Spinner animation="border" size="sm" aria-hidden="true" />
                  {t('checkout.placing')}
                </>
              ) : (
                <>
                  <PiLockSimple className="btn-icon" aria-hidden="true" />
                  {t('checkout.placeOrder')} · {price(total)}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      )}
    </Modal>
  );
}
