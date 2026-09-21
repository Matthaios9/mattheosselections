'use client';

import PageHeader from '@/components/admin/PageHeader';
import ContactMessages from './ContactMessages';
import NewsletterSubscribers from './NewsletterSubscribers';
import { useAdminSession } from '@/context/AdminSessionContext';
import { useUrlParams } from '@/hooks/useUrlParams';
import lists from '@/components/admin/AdminLists.module.css';
import styles from './Submissions.module.css';

const TABS = [
  { value: 'newsletter', label: 'Newsletter', count: 'subscribers' },
  { value: 'contact', label: 'Contact', count: 'messages' },
];

/** What visitors sent from the storefront: newsletter sign-ups and contact form messages, one tab each. */
export default function Submissions() {
  const [params, setParams] = useUrlParams();
  const tab = TABS.some((item) => item.value === params.tab) ? params.tab : TABS[0].value;
  const { submissionCounts } = useAdminSession();
  const unread = submissionCounts.unread ?? 0;

  return (
    <>
      <PageHeader title="Submissions" subtitle="Newsletter sign-ups and messages sent with the contact form." />

      <section className="admin-card">
        <nav className={lists.tabs} aria-label="Submission type">
          {TABS.map((item) => (
            <button
              key={item.value}
              type="button"
              // Each tab starts without the other tab's search and filters.
              onClick={() => setParams({ tab: item.value, q: '', status: '' })}
              className={`${lists.tab} ${tab === item.value ? lists.tabActive : ''}`}
              aria-current={tab === item.value ? 'page' : undefined}
            >
              {item.label}
              <span className={lists.tabCount}>{submissionCounts[item.count] ?? 0}</span>
              {item.value === 'contact' && unread > 0 && <span className={styles.newCount}>{unread} new</span>}
            </button>
          ))}
        </nav>

        {tab === 'contact' ? (
          <ContactMessages params={params} setParams={setParams} />
        ) : (
          <NewsletterSubscribers params={params} setParams={setParams} />
        )}
      </section>
    </>
  );
}
