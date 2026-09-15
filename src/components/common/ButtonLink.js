'use client';

import Link from 'next/link';
import Button from 'react-bootstrap/Button';

/** React-Bootstrap button rendered as a Next.js <Link> (usable from Server Components). */
export default function ButtonLink({ href, variant = 'ms-dark', size, className, children, ...rest }) {
  return (
    <Button as={Link} href={href} variant={variant} size={size} className={className} {...rest}>
      {children}
    </Button>
  );
}
