'use client';

import { useState } from 'react';
import Image from 'next/image';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { PiCheck, PiSealCheck, PiX } from 'react-icons/pi';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import { useUI } from '@/context/UIContext';
import { useI18n } from '@/i18n/I18nProvider';
import styles from './AuthModal.module.css';

const VIEWS = { login: LoginForm, signup: SignupForm, forgot: ForgotPasswordForm };

/** Login / signup / password reset in one modal — no separate auth pages. */
export default function AuthModal() {
  const { t } = useI18n();
  const { authView, setAuthView, closeAuth } = useUI();
  const [success, setSuccess] = useState(null);
  const [lastView, setLastView] = useState('login');
  if (authView && authView !== lastView) setLastView(authView);

  const view = authView ?? lastView;
  const ActiveForm = VIEWS[view] ?? LoginForm;

  return (
    <Modal
      show={Boolean(authView)}
      onHide={closeAuth}
      onExited={() => setSuccess(null)}
      centered
      size="lg"
      dialogClassName={styles.dialog}
      aria-labelledby="auth-title"
    >
      <button type="button" className={styles.close} onClick={closeAuth} aria-label={t('common.close')}>
        <PiX />
      </button>
      <div className={styles.layout}>
        <aside className={styles.brand}>
          <Image src="/images/editorial/honey-blossoms.jpg" alt="" fill sizes="380px" className={styles.brandImage} />
          <div className={styles.brandOverlay} aria-hidden="true" />
          <div className={styles.brandContent}>
            <span className="eyebrow eyebrow-light">Mattheos Selections</span>
            <p className={styles.brandTitle}>{t('auth.brandTitle')}</p>
            <p className={styles.brandText}>{t('auth.brandText')}</p>
            <ul className={styles.brandPoints}>
              {t('auth.brandPoints').map((point) => (
                <li key={point}>
                  <PiCheck aria-hidden="true" /> {point}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className={styles.panel}>
          {success ? (
            <div className={styles.success} key="success">
              <span className={styles.successIcon}>
                <PiSealCheck aria-hidden="true" />
              </span>
              <h2 className={styles.title} id="auth-title">
                {success}
              </h2>
              <Button variant="ms-dark" onClick={closeAuth}>
                {t('common.continueShopping')}
              </Button>
            </div>
          ) : (
            <div className={styles.view} key={view}>
              <ActiveForm onSwitch={setAuthView} onSuccess={setSuccess} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
