import { Suspense } from 'react';
import Container from 'react-bootstrap/Container';
import AccountView from '@/components/account/AccountView';
import { getDictionary } from '@/i18n/dictionaries';
import { pageMetadata } from '@/i18n/metadata';

/**
 * The signed-in customer's account: profile, password and orders. Everything personal is loaded in
 * the browser through the account API, so the page itself is the same for everyone — and kept out of
 * search results and sitemap.js.
 */
export async function generateMetadata({ params }) {
  const { lang } = await params;
  const { dict } = await getDictionary(lang);
  return {
    ...pageMetadata({
      dict,
      locale: lang,
      path: '/account',
      title: dict.meta.account.title,
      description: dict.meta.account.description,
    }),
    robots: { index: false, follow: false },
  };
}

export default function AccountPage() {
  return (
    <section className="section">
      <Container>
        {/* AccountView reads the open tab from the URL (useSearchParams). */}
        <Suspense>
          <AccountView />
        </Suspense>
      </Container>
    </section>
  );
}
