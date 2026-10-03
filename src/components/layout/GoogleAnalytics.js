import Script from 'next/script';

/**
 * Google Analytics 4 (gtag.js) for the storefront; the admin panel has its own layout and is not tracked.
 * The small inline snippet defines window.gtag before the page hydrates, so e-commerce events sent
 * on mount (see src/utils/analytics.js) are queued behind the config command until gtag.js loads.
 * Page views, including client-side navigations, are sent by GA's enhanced measurement. gtag.js loads once the
 * page is idle (lazyOnload) so it doesn't compete with the first paint; anything sent earlier waits in dataLayer.
 */
export default function GoogleAnalytics({ id }) {
  if (!id) return null;
  return (
    <>
      <script
        id="ga-init"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(id)});`,
        }}
      />
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`} strategy="lazyOnload" />
    </>
  );
}
