'use client';

import { useEffect, useRef } from 'react';
import styles from './KustomCheckout.module.css';

/**
 * Renders Kustom Checkout from the `html_snippet` returned when the checkout order is created.
 * The snippet contains <script> tags, which the browser doesn't run when inserted as HTML,
 * so they are re-created to execute. Each snippet is rendered once.
 */
export default function KustomCheckout({ snippet }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || container.dataset.snippet === snippet) return;
    container.dataset.snippet = snippet;
    container.innerHTML = snippet;
    container.querySelectorAll('script').forEach((original) => {
      const script = document.createElement('script');
      [...original.attributes].forEach((attribute) => script.setAttribute(attribute.name, attribute.value));
      script.text = original.text;
      original.replaceWith(script);
    });
  }, [snippet]);

  return <div ref={containerRef} className={styles.checkout} />;
}
