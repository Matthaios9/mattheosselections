import 'bootstrap/dist/css/bootstrap.min.css';
import '../globals.css';
import { sans, serif } from '../fonts';
import AppProviders from '@/context/AppProviders';
import Footer from '@/components/layout/Footer';
import GlobalOverlays from '@/components/layout/GlobalOverlays';
import Header from '@/components/layout/Header';
import { SHARE_IMAGE } from '@/config/photos';
import { siteConfig } from '@/config/site';
import { getLocaleConfig, locales } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { I18nProvider } from '@/i18n/I18nProvider';
import { getSpotlightProducts, getStoreCategories } from '@/server/domain/storefront';

export function generateStaticParams() {
  return locales.map((locale) => ({ lang: locale.code }));
}

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const { dict } = await getDictionary(lang);

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: `${dict.meta.siteName} — ${dict.meta.home.title}`,
      template: `%s — ${dict.meta.siteName}`,
    },
    description: dict.meta.home.description,
    // Canonical and hreflang are set per page (src/i18n/metadata.js); these are the fallbacks.
    openGraph: {
      siteName: dict.meta.siteName,
      locale: getLocaleConfig(lang).ogLocale,
      type: 'website',
      images: [{ url: SHARE_IMAGE, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image' },
  };
}

export const viewport = {
  themeColor: '#fbf8f3',
};

export default async function LocaleLayout({ children, params }) {
  const { lang } = await params;
  const { dict } = await getDictionary(lang);
  const { dir } = getLocaleConfig(lang);
  // Only small, shared data here; product lists are loaded per page or through the API.
  const [categories, spotlight] = await Promise.all([getStoreCategories(lang), getSpotlightProducts(lang)]);

  return (
    <html lang={lang} dir={dir} className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        {/* Right-to-left locales layer Bootstrap's RTL build on top (served from /public/vendor).
            A static CSS import can't be conditional on the route param, hence the tag. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        {dir === 'rtl' && <link rel="stylesheet" href="/vendor/bootstrap.rtl.min.css" />}
        <noscript>
          <style>{'.reveal{opacity:1!important;transform:none!important}'}</style>
        </noscript>
      </head>
      <body>
        <I18nProvider locale={lang} dict={dict}>
          <AppProviders categories={categories} spotlight={spotlight}>
            <a href="#main-content" className="skip-link">
              {dict.nav.skipToContent}
            </a>
            <Header />
            <main id="main-content">{children}</main>
            <Footer locale={lang} dict={dict} categories={categories} />
            <GlobalOverlays />
          </AppProviders>
        </I18nProvider>
      </body>
    </html>
  );
}
