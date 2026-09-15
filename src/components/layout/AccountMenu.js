'use client';

import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import { PiSignOut, PiUser } from 'react-icons/pi';
import DropdownToggleButton from '@/components/common/DropdownToggleButton';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { useI18n } from '@/i18n/I18nProvider';
import { initial } from '@/utils/format';
import styles from './AccountMenu.module.css';

export default function AccountMenu({ className = '' }) {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const { openAuth } = useUI();
  const [show, setShow] = useState(false);
  const initialLetter = initial(user?.name);

  const open = (view) => {
    setShow(false);
    openAuth(view);
  };

  return (
    <Dropdown align="end" show={show} onToggle={(next) => setShow(next)} className={className}>
      <Dropdown.Toggle as={DropdownToggleButton} className={`icon-btn ${styles.toggle}`} aria-label={t('nav.account')}>
        {user ? <span className={styles.avatar}>{initialLetter}</span> : <PiUser />}
      </Dropdown.Toggle>
      <Dropdown.Menu className={styles.menu}>
        {user ? (
          <>
            <div className={styles.head}>
              <span className={styles.avatarLg}>{initialLetter}</span>
              <div>
                <p className={styles.title}>{t('account.greeting', { name: user.name })}</p>
                <p className={styles.text}>{t('account.memberText', { email: user.email })}</p>
              </div>
            </div>
            <Dropdown.Divider />
            <Dropdown.Item as="button" onClick={logout} className={styles.item}>
              <PiSignOut aria-hidden="true" /> {t('account.logout')}
            </Dropdown.Item>
          </>
        ) : (
          <div className={styles.guest}>
            <p className={styles.title}>{t('account.guestTitle')}</p>
            <p className={styles.text}>{t('account.guestText')}</p>
            <Button variant="ms-dark" className="w-100" onClick={() => open('login')}>
              {t('account.login')}
            </Button>
            <Button variant="ms-outline" className="w-100" onClick={() => open('signup')}>
              {t('account.signup')}
            </Button>
          </div>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}
