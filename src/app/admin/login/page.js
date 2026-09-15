import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PiArrowLeft, PiShieldCheck } from 'react-icons/pi';
import GoogleSignIn from '@/components/admin/auth/GoogleSignIn';
import { adminEmails } from '@/server/auth/admins';
import { getCurrentAdmin } from '@/server/auth/dal';
import { isGoogleConfigured } from '@/server/auth/google';
import { isDatabaseConfigured } from '@/server/db';
import styles from './login.module.css';

export const metadata = { title: 'Sign in' };

/** Admin sign-in: Google only. The account must be listed in ADMIN_EMAIL and be an admin in the database. */
export default async function AdminLoginPage({ searchParams }) {
  const { next } = await searchParams;
  if (isDatabaseConfigured() && (await getCurrentAdmin())) redirect('/admin');

  const missing = [
    !isDatabaseConfigured() && 'MONGODB_URI',
    !isGoogleConfigured() && 'GOOGLE_CLIENT_ID',
    !adminEmails().length && 'ADMIN_EMAIL',
  ].filter(Boolean);

  return (
    <div className={styles.screen}>
      <aside className={styles.brand}>
        <Image src="/images/editorial/honey-dipper-dark.jpg" alt="" fill sizes="50vw" className={styles.brandImage} preload />
        <div className={styles.brandContent}>
          <div className={styles.logo}>
            <Image src="/images/brand/logo-mark.png" alt="" width={44} height={41} />
            <span>
              Mattheos <em>Admin</em>
            </span>
          </div>
          <p className={styles.quote}>Manage the harvest — products, orders and customers in one place.</p>
        </div>
      </aside>

      <main className={styles.panel}>
        <div className={styles.card}>
          <span className={styles.badge}>
            <PiShieldCheck aria-hidden="true" /> Secure area
          </span>
          <h1 className={styles.title}>Sign in to the admin</h1>
          <p className={styles.subtitle}>Continue with the Google account of a store administrator.</p>

          {missing.length ? (
            <p className={styles.warning}>
              Admin sign-in is not set up yet. Add {missing.join(', ')} to .env and restart the server.
            </p>
          ) : (
            <GoogleSignIn clientId={process.env.GOOGLE_CLIENT_ID} next={next} />
          )}

          <Link href="/" className={styles.back}>
            <PiArrowLeft aria-hidden="true" /> Back to the store
          </Link>
        </div>
      </main>
    </div>
  );
}
