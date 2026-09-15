'use client';

import PageHeader from '@/components/admin/PageHeader';
import QueryState from '@/components/admin/QueryState';
import StatusPill from '@/components/admin/StatusPill';
import StockPill from '@/components/admin/StockPill';
import ProductForm from '@/components/admin/products/ProductForm';
import { useApiQuery } from '@/hooks/useApiQuery';
import { getAllCategories } from '@/services/category';
import { getProductById } from '@/services/product';
import { formatDateTime } from '@/utils/format';

const BACK = { href: '/admin/products', label: 'All products' };

/** New product (no `id`) or edit an existing one: loads the product and the category list. */
export default function ProductEditor({ id }) {
  const categories = useApiQuery(['admin-categories'], getAllCategories);
  const product = useApiQuery(['admin-product', id], () => getProductById(id), { enabled: Boolean(id) });

  if (!id) {
    return (
      <>
        <PageHeader
          back={BACK}
          title="New product"
          subtitle="Add names in each language — English is required, missing translations fall back to English."
        />
        <QueryState query={categories}>{(list) => <ProductForm categories={list} />}</QueryState>
      </>
    );
  }

  // Both requests must finish before the form can render.
  const both = {
    data: product.data && categories.data ? product.data : undefined,
    error: product.error ?? categories.error,
    refetch: () => {
      product.refetch();
      categories.refetch();
    },
  };

  return (
    <QueryState query={both}>
      {(current) => (
        <>
          <PageHeader
            back={BACK}
            title={current.name.en}
            subtitle={`Last updated ${formatDateTime(current.updatedAt)}`}
            actions={
              <div className="d-flex gap-2 align-items-center">
                <StockPill total={current.totalStock} />
                <StatusPill kind="product" value={current.status} />
              </div>
            }
          />
          {/* Keyed on updatedAt so the form re-seeds from the saved product */}
          <ProductForm key={current.updatedAt} product={current} categories={categories.data} onSaved={product.mutate} />
        </>
      )}
    </QueryState>
  );
}
