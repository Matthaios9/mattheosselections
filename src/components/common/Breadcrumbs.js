'use client';

import Link from 'next/link';
import Breadcrumb from 'react-bootstrap/Breadcrumb';

/** items: [{ label, href? }] — the last item is rendered as the active page. */
export default function Breadcrumbs({ items, className }) {
  return (
    <Breadcrumb className={className}>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <Breadcrumb.Item
            key={item.label}
            active={last}
            linkAs={last ? undefined : Link}
            href={last ? undefined : item.href}
          >
            {item.label}
          </Breadcrumb.Item>
        );
      })}
    </Breadcrumb>
  );
}
