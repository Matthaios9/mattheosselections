'use client';

import Button from 'react-bootstrap/Button';
import { PiHandbagSimple } from 'react-icons/pi';
import { useAddToCart } from '@/hooks/useAddToCart';

export default function PromoAddButton({ product, label }) {
  const addToCart = useAddToCart();

  return (
    <Button variant="ms-ghost-light" size="lg" onClick={() => addToCart(product, product.defaultVariant)}>
      <PiHandbagSimple className="btn-icon" aria-hidden="true" />
      {label}
    </Button>
  );
}
