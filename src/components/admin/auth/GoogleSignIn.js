'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { adminGoogleLogin } from '@/services/auth';
import { getErrorMessage } from '@/utils/errors';
import styles from './GoogleSignIn.module.css';

const safeNext = (value) => (typeof value === 'string' && value.startsWith('/admin') ? value : '/admin');

/**
 * "Sign in with Google" (Google Identity Services, popup). Google returns a signed
 * ID token, which /api/admin/auth/google verifies before starting the admin session.
 */
export default function GoogleSignIn({ clientId, next }) {
  const router = useRouter();
  const buttonRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);

  const handleCredential = useEffectEvent(async (credential) => {
    setVerifying(true);
    setError(null);
    try {
      await adminGoogleLogin(credential);
      router.replace(safeNext(next));
      router.refresh();
    } catch (failure) {
      setError(getErrorMessage(failure, 'Google sign-in failed. Please try again.'));
      setVerifying(false);
    }
  });

  useEffect(() => {
    const google = window.google?.accounts?.id;
    if (!scriptReady || !google || !buttonRef.current) return;
    google.initialize({
      client_id: clientId,
      callback: ({ credential }) => handleCredential(credential),
      ux_mode: 'popup',
      auto_select: false,
      context: 'signin',
    });
    google.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      logo_alignment: 'center',
      width: Math.min(400, buttonRef.current.offsetWidth || 320),
    });
  }, [scriptReady, clientId]);

  return (
    <div className={styles.wrap}>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      {error && (
        <Alert variant="danger" className="mb-0" role="alert">
          {error}
        </Alert>
      )}
      <div className={styles.buttonArea} aria-busy={verifying}>
        <div ref={buttonRef} className={styles.button} />
        {!scriptReady && (
          <span className={styles.placeholder}>
            <Spinner animation="border" size="sm" aria-hidden="true" /> Loading Google sign-in…
          </span>
        )}
        {verifying && (
          <span className={styles.verifying}>
            <Spinner animation="border" size="sm" aria-hidden="true" /> Signing you in…
          </span>
        )}
      </div>
      <p className={styles.note}>Only Google accounts registered as store administrators can sign in.</p>
    </div>
  );
}
