import Container from 'react-bootstrap/Container';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { getDictionary } from '@/i18n/dictionaries';
import { pageMetadata } from '@/i18n/metadata';
import styles from './page.module.css';

/**
 * The page the link in the reset email opens: `/<lang>/reset-password?token=…`.
 * Kept out of search results — it is only ever reached from one personal email, and the
 * token in the URL has no business in an index (it is also left out of sitemap.js).
 */
export async function generateMetadata({ params }) {
  const { lang } = await params;
  const { dict } = await getDictionary(lang);
  return {
    ...pageMetadata({
      dict,
      locale: lang,
      path: '/reset-password',
      title: dict.auth.reset.title,
      description: dict.auth.reset.subtitle,
    }),
    robots: { index: false, follow: false },
  };
}

export default async function ResetPasswordPage({ params, searchParams }) {
  const [, query] = await Promise.all([params, searchParams]);
  const token = Array.isArray(query.token) ? query.token[0] : query.token;

  return (
    <section className="section">
      <Container>
        <div className={styles.card}>
          <ResetPasswordForm token={token ?? ''} />
        </div>
      </Container>
    </section>
  );
}
