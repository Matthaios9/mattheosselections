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
import KustomCheckout from './KustomCheckout';
import { useStoreCart } from '@/context/CartContext';
import { useUI } from '@/context/UIContext';
import { useFormState } from '@/hooks/useFormState';
import { useI18n } from '@/i18n/I18nProvider';
import { confirmPayment, startCheckout } from '@/services/checkout';
import { calculateShipping, SHIPPING_COUNTRIES } from '@/utils/shipping';
import styles from './CheckoutModal.module.css';

/**
 * Checkout in two steps:
 * 1. details — order summary, delivery country (sets the shipping fee) and an optional note;
 * 2. payment — Kustom Checkout (embedded) collects the customer's details and payment.
 * After paying, Kustom redirects to ?payment=success&order_id=…, the order is created and the
 * items are taken out of stock. ?payment=unavailable means Kustom's last stock check stopped it.
 */
export default function CheckoutModal() {
  const { t, href, price, locale } = useI18n();
  const { checkoutOpen, openCheckout, closeCheckout } = useUI();
  const cart = useStoreCart();
  const form = useFormState({ country: 'SE', note: '' });
  const [status, setStatus] = useState('details'); // details | opening | payment | confirming | confirmed | failed
  const [snippet, setSnippet] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [outcome, setOutcome] = useState(null); // { number } when confirmed, { message } when failed

  const countryNames = new Intl.DisplayNames([locale], { type: 'region' });
  const shipping = calculateShipping(cart.subtotal, form.values.country);
  const total = cart.subtotal + shipping;
  const busy = status === 'opening' || status === 'confirming';

  const handlePaymentReturn = useEffectEvent(async (payment, orderId) => {
    openCheckout();
    if (payment === 'unavailable') {
      setOutcome({ message: t('checkout.soldOutBeforePayment') });
      setStatus('failed');
      return;
    }
    setStatus('confirming');
    try {
      const result = await confirmPayment(orderId);
      if (result.soldOut) {
        setOutcome({ message: t('checkout.soldOut') });
        setStatus('failed');
        return;
      }
      cart.emptyCart();
      setOutcome({ number: result.orderNumber });
      setStatus('confirmed');
    } catch {
      setOutcome({ message: t('checkout.errors.confirmFailed') });
      setStatus('failed');
    }
  });

  // Back from Kustom: read the result once, then clean the URL so a refresh doesn't repeat it.
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const payment = params.get('payment');
      const orderId = params.get('order_id');
      if (!(payment === 'success' && orderId) && payment !== 'unavailable') return;
      params.delete('payment');
      params.delete('order_id');
      const query = params.toString();
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
      handlePaymentReturn(payment, orderId);
    });
    return () => clearTimeout(timer);
  }, []);

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
    } else {
      setServerError(t(error.code === 'payments-unavailable' ? 'checkout.errors.paymentUnavailable' : 'checkout.errors.unavailable'));
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus('opening');
    setServerError(null);
    try {
      const checkout = await startCheckout({
        items: cart.items.map((item) => ({ productId: String(item.productId), variantId: item.variantId, quantity: item.quantity })),
        country: form.values.country,
        note: form.values.note,
        locale,
        returnPath: window.location.pathname,
      });
      setSnippet(checkout.snippet);
      setStatus('payment');
    } catch (error) {
      setStatus('details');
      showCheckoutError(error);
    }
  };

  const backToDetails = () => {
    setSnippet(null);
    setStatus('details');
  };

  // Closing the modal abandons an open Kustom checkout; the cart may change before it's reopened.
  const handleExited = () => {
    if (status === 'confirmed') form.reset();
    setSnippet(null);
    setOutcome(null);
    setServerError(null);
    setStatus('details');
  };

  return (
    <Modal
      show={checkoutOpen}
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

      {status === 'payment' && (
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
            <KustomCheckout snippet={snippet} />
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
                  <legend className={styles.legend}>{t('checkout.shippingTitle')}</legend>
                  <Form.Group controlId="checkout-country">
                    <Form.Label>{t('checkout.fields.country')}</Form.Label>
                    <Form.Select {...form.field('country')} autoComplete="country">
                      {SHIPPING_COUNTRIES.map((code) => (
                        <option key={code} value={code}>
                          {countryNames.of(code)}
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
