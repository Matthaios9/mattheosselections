'use client';

import { useState } from 'react';
import Link from 'next/link';
import Spinner from 'react-bootstrap/Spinner';
import { PiArrowSquareOut, PiEye, PiEyeSlash, PiPencilSimple, PiStar, PiStarFill, PiTrash } from 'react-icons/pi';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import RowActions, { RowAction, RowActionDivider } from '@/components/admin/RowActions';
import { useAdminAction } from '@/hooks/useAdminAction';
import { deleteProduct, updateProductFlags } from '@/services/product';

/** Star toggle in the products table: feature / unfeature on the home page. */
export function FeaturedToggle({ product, onChanged }) {
  const [run, pending] = useAdminAction();

  return (
    <button
      type="button"
      className="icon-btn"
      style={{ width: '2rem', height: '2rem', fontSize: '1.05rem', color: product.featured ? 'var(--ms-honey)' : 'var(--ms-subtle)' }}
      disabled={pending}
      aria-pressed={product.featured}
      aria-label={product.featured ? 'Remove from featured' : 'Feature on home page'}
      title={product.featured ? 'Featured on the home page' : 'Feature on the home page'}
      onClick={() =>
        run(() => updateProductFlags(product.id, { featured: !product.featured }), {
          success: product.featured ? 'Removed from featured' : 'Featured on the home page',
          onSuccess: onChanged,
        })
      }
    >
      {pending ? <Spinner animation="border" size="sm" /> : product.featured ? <PiStarFill /> : <PiStar />}
    </button>
  );
}

/** "•••" menu for a product row. `onChanged` reloads the list after a change. */
export default function ProductRowActions({ product, onChanged }) {
  const [run, pending] = useAdminAction();
  const [confirm, setConfirm] = useState(false);
  const isActive = product.status === 'active';

  const destroy = async () => {
    await run(() => deleteProduct(product.id), { success: 'Product deleted', onSuccess: onChanged });
    setConfirm(false);
  };

  return (
    <>
      <RowActions label={`Actions for ${product.name.en}`} title={product.name.en} pending={pending}>
        <RowAction as={Link} href={`/admin/products/${product.id}`} icon={PiPencilSimple}>
          Edit product
        </RowAction>
        <RowAction
          href={`/en/shop?q=${encodeURIComponent(product.name.en)}`}
          target="_blank"
          rel="noopener noreferrer"
          icon={PiArrowSquareOut}
        >
          View in shop
        </RowAction>
        <RowAction
          as="button"
          icon={isActive ? PiEyeSlash : PiEye}
          onClick={() =>
            run(() => updateProductFlags(product.id, { status: isActive ? 'draft' : 'active' }), {
              success: isActive ? 'Moved to drafts' : 'Published',
              onSuccess: onChanged,
            })
          }
        >
          {isActive ? 'Unpublish (draft)' : 'Publish'}
        </RowAction>
        <RowActionDivider />
        <RowAction as="button" icon={PiTrash} danger onClick={() => setConfirm(true)}>
          Delete
        </RowAction>
      </RowActions>
      <ConfirmDialog
        show={confirm}
        title="Delete this product?"
        message={`“${product.name.en}” will be removed from the store. This cannot be undone.`}
        pending={pending}
        onConfirm={destroy}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}
