'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Dropdown from 'react-bootstrap/Dropdown';
import Offcanvas from 'react-bootstrap/Offcanvas';
import {
  PiArrowSquareOut,
  PiBellSimpleRinging,
  PiList,
  PiPackage,
  PiReceipt,
  PiSignOut,
  PiSquaresFour,
  PiTag,
  PiUsers,
} from 'react-icons/pi';
import { AdminToastProvider } from './AdminToast';
import { AdminSessionProvider, useAdminSession } from '@/context/AdminSessionContext';
import { logout } from '@/services/auth';
import { initial } from '@/utils/format';
import styles from './AdminShell.module.css';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: PiSquaresFour, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: PiReceipt, badge: 'pending' },
  { href: '/admin/products', label: 'Products', icon: PiPackage },
  { href: '/admin/categories', label: 'Categories', icon: PiTag },
  { href: '/admin/stock-alerts', label: 'Stock alerts', icon: PiBellSimpleRinging },
  { href: '/admin/users', label: 'Users', icon: PiUsers },
];

/** Sign out through the API, then leave the panel. */
function useLogout() {
  const router = useRouter();
  return async () => {
    await logout().catch(() => {});
    router.replace('/admin/login');
    router.refresh();
  };
}

function SidebarContent({ pathname, pendingOrders, onNavigate }) {
  const handleLogout = useLogout();
  const isActive = (item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));

  return (
    <div className={styles.sidebarInner}>
      <Link href="/admin" className={styles.brand} onClick={onNavigate} aria-label="Mattheos Selections admin">
        <Image src="/images/brand/logo-mark.svg" alt="" width={42} height={40} />
        <span className={styles.brandText}>
          <Image src="/images/brand/logo-wordmark-light.svg" alt="" width={124} height={23} className={styles.brandWordmark} />
          <span className={styles.brandTag}>Admin</span>
        </span>
      </Link>

      <nav className={styles.nav} aria-label="Admin">
        <p className={styles.navHeading}>Manage</p>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${active ? styles.navActive : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={onNavigate}
            >
              <Icon className={styles.navIcon} aria-hidden="true" />
              <span>{item.label}</span>
              {item.badge === 'pending' && pendingOrders > 0 && <span className={styles.navBadge}>{pendingOrders}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <a href="/en" target="_blank" rel="noopener noreferrer" className={styles.navLink}>
          <PiArrowSquareOut className={styles.navIcon} aria-hidden="true" />
          <span>View storefront</span>
        </a>
        <button type="button" className={styles.navLink} onClick={handleLogout}>
          <PiSignOut className={styles.navIcon} aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}

/** Admin chrome: sidebar, top bar and account menu around every panel page. */
export default function AdminShell({ admin, children }) {
  return (
    <AdminSessionProvider admin={admin}>
      <AdminToastProvider>
        <ShellLayout>{children}</ShellLayout>
      </AdminToastProvider>
    </AdminSessionProvider>
  );
}

function ShellLayout({ children }) {
  const pathname = usePathname();
  const { admin, orderCounts } = useAdminSession();
  const handleLogout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);
  const pendingOrders = orderCounts.pending ?? 0;
  const current = NAV.find((item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href)));

  return (
    <div className={styles.shell}>
      <aside className={`d-none d-lg-block ${styles.sidebar}`}>
        <SidebarContent pathname={pathname} pendingOrders={pendingOrders} />
      </aside>

      <Offcanvas show={menuOpen} onHide={() => setMenuOpen(false)} className={styles.offcanvas} aria-label="Admin menu">
        <SidebarContent pathname={pathname} pendingOrders={pendingOrders} onNavigate={() => setMenuOpen(false)} />
      </Offcanvas>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button type="button" className={`icon-btn d-lg-none ${styles.menuButton}`} onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <PiList />
          </button>
          <span className={styles.crumb}>{current?.label ?? 'Admin'}</span>

          <Dropdown align="end" className="ms-auto">
            <Dropdown.Toggle as="button" type="button" className={styles.account}>
              <span className={styles.avatar}>{initial(admin.name)}</span>
              <span className={`d-none d-sm-flex ${styles.accountText}`}>
                <strong>{admin.name}</strong>
                <small>Administrator</small>
              </span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Header>{admin.email}</Dropdown.Header>
              <Dropdown.Item href="/en" target="_blank" rel="noopener noreferrer">
                View storefront
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item as="button" onClick={handleLogout}>
                Log out
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
