/** Label + colour tone for every status the admin displays. */
export const STATUS_META = {
  order: {
    pending: { label: 'Pending', tone: 'warning' },
    processing: { label: 'Processing', tone: 'info' },
    shipped: { label: 'Shipped', tone: 'accent' },
    delivered: { label: 'Delivered', tone: 'success' },
    cancelled: { label: 'Cancelled', tone: 'danger' },
  },
  payment: {
    unpaid: { label: 'Unpaid', tone: 'warning' },
    authorized: { label: 'Authorized', tone: 'info' },
    paid: { label: 'Paid', tone: 'success' },
    refunded: { label: 'Refunded', tone: 'neutral' },
  },
  product: {
    active: { label: 'Active', tone: 'success' },
    draft: { label: 'Draft', tone: 'neutral' },
  },
  stock: {
    in: { label: 'In stock', tone: 'success' },
    out: { label: 'Sold out', tone: 'danger' },
  },
  role: {
    admin: { label: 'Admin', tone: 'accent' },
    customer: { label: 'Customer', tone: 'neutral' },
  },
  user: {
    active: { label: 'Active', tone: 'success' },
    disabled: { label: 'Disabled', tone: 'danger' },
  },
  stockAlert: {
    waiting: { label: 'Waiting', tone: 'warning' },
    notified: { label: 'Emailed', tone: 'success' },
  },
  contactMessage: {
    new: { label: 'New', tone: 'warning' },
    read: { label: 'Read', tone: 'neutral' },
  },
};

export const ORDER_STATUS_OPTIONS = Object.entries(STATUS_META.order).map(([value, meta]) => ({ value, ...meta }));
export const PAYMENT_STATUS_OPTIONS = Object.entries(STATUS_META.payment).map(([value, meta]) => ({ value, ...meta }));
