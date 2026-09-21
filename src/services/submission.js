import { GetApiData } from './api';

/* Storefront (public) ---------------------------------------------------------- */

/** Newsletter sign-up: `{ email, locale, website }` (`website` is the hidden honeypot field). */
export const subscribeNewsletter = async (values) => {
  await GetApiData('/newsletter', 'POST', values, false);
};

/** Contact form: `{ name, email, subject, message, locale, website }`. */
export const sendContactMessage = async (values) => {
  await GetApiData('/contact', 'POST', values, false);
};

/* Admin ----------------------------------------------------------------------- */

/** → { subscribers, messages, unread } */
export const getSubmissionCounts = async () => {
  const { data } = await GetApiData('/admin/stats/submissions', 'GET');
  return data;
};

/** params: { q, page } → { items, total, page, pageSize, pages } */
export const getNewsletterSubscribers = async (params) => {
  const { data } = await GetApiData('/admin/newsletter', 'GET', params);
  return data;
};

export const deleteNewsletterSubscriber = async (id) => {
  await GetApiData(`/admin/newsletter/${id}`, 'DELETE');
};

/** params: { status, q, page } → { items, total, page, pageSize, pages } */
export const getContactMessages = async (params) => {
  const { data } = await GetApiData('/admin/messages', 'GET', params);
  return data;
};

/** status: 'new' | 'read' → the updated message */
export const setContactMessageStatus = async (id, status) => {
  const { data } = await GetApiData(`/admin/messages/${id}`, 'PATCH', { status });
  return data;
};

export const deleteContactMessage = async (id) => {
  await GetApiData(`/admin/messages/${id}`, 'DELETE');
};
