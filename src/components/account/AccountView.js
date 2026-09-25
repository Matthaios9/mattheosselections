'use client';

import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { PiLockKey, PiPackage, PiUser, PiUserCircle } from 'react-icons/pi';
import ChangePasswordForm from './ChangePasswordForm';
import OrderHistory from './OrderHistory';
import ProfileForm from './ProfileForm';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { useUrlParams } from '@/hooks/useUrlParams';
import { useI18n } from '@/i18n/I18nProvider';
import { initial } from '@/utils/format';
import styles from './Account.module.css';

const TABS = [
  { id: 'profile', icon: PiUser, Panel: ProfileForm },
  { id: 'orders', icon: PiPackage, Panel: OrderHistory },
  { id: 'password', icon: PiLockKey, Panel: ChangePasswordForm },
];

/**
 * The signed-in customer's account: profile, orders and password, one tab each. The open tab is
 * in the URL (`?tab=orders`), so the account menu can link straight to it and refresh keeps it.
 * Everything is read through the account API, which checks the session on every request.
 */
export default function AccountView() {
  const { t } = useI18n();
  const { user, ready } = useAuth();
  const { openAuth } = useUI();
  const [params, setParams] = useUrlParams();
  const active = TABS.find((tab) => tab.id === params.tab) ?? TABS[0];

  if (!ready) {
    return (
      <div className={styles.centre}>
        <Spinner animation="border" aria-label={t('account.page.loading')} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`${styles.card} ${styles.guest}`}>
        <div className={styles.centre}>
          <span className={styles.badgeIcon}>
            <PiUserCircle aria-hidden="true" />
          </span>
          <h2 className={styles.title}>{t('account.page.signInTitle')}</h2>
          <p className={styles.text}>{t('account.page.signInText')}</p>
          <div className={styles.guestActions}>
            <Button variant="ms-dark" onClick={() => openAuth('login')}>
              {t('account.login')}
            </Button>
            <Button variant="ms-outline" onClick={() => openAuth('signup')}>
              {t('account.signup')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { Panel } = active;

  return (
    <div className={styles.layout}>
      <aside className={styles.side}>
        <div className={styles.identity}>
          <span className={styles.avatar} aria-hidden="true">
            {initial(user.name)}
          </span>
          <div className={styles.identityText}>
            <p className={styles.name}>{user.name}</p>
            <p className={styles.email}>{user.email}</p>
          </div>
        </div>
        <nav className={styles.tabs} aria-label={t('account.tabs.label')}>
          {TABS.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`${styles.tab} ${id === active.id ? styles.tabActive : ''}`}
              aria-current={id === active.id ? 'page' : undefined}
              onClick={() => setParams({ tab: id === 'profile' ? undefined : id })}
            >
              <Icon aria-hidden="true" />
              {t(`account.tabs.${id}`)}
            </button>
          ))}
        </nav>
      </aside>

      <section className={styles.card} aria-labelledby="account-panel-title">
        <Panel key={active.id} />
      </section>
    </div>
  );
}
