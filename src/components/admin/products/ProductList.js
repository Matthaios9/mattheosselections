'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PiPackage, PiPlus } from 'react-icons/pi';
import ButtonLink from '@/components/common/ButtonLink';
import AdminPagination from '@/components/admin/AdminPagination';
import AdminTable from '@/components/admin/AdminTable';
import EmptyState from '@/components/admin/EmptyState';
import FilterBar from '@/components/admin/FilterBar';
import PageHeader from '@/components/admin/PageHeader';
import QueryState from '@/components/admin/QueryState';
import StatusPill from '@/components/admin/StatusPill';
import StockPill from '@/components/admin/StockPill';
import ProductRowActions, { FeaturedToggle } from '@/components/admin/products/ProductRowActions';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useUrlParams } from '@/hooks/useUrlParams';
import { getAllCategories } from '@/services/category';
import { getAllProducts } from '@/services/product';
import { formatDate, money, plural } from '@/utils/format';
import styles from '@/components/admin/AdminLists.module.css';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
];

const STOCK_OPTIONS = [
  { value: 'in', label: 'In stock' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Sold out' },
];

export default function ProductList() {
  const [params, setParams] = useUrlParams();
  const filters = { q: params.q ?? '', category: params.category ?? '', status: params.status ?? '', stock: params.stock ?? '' };
  const page = Number(params.page) || 1;

  const products = useApiQuery(['admin-products', filters, page], () => getAllProducts({ ...filters, page }));
  const categories = useApiQuery(['admin-categories'], getAllCategories);
  const hasFilters = Object.values(filters).some(Boolean);

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (product) => (
        <div className={styles.product}>
          <span className="admin-thumb">
            {product.images[0] && <Image src={product.images[0].url} alt="" fill sizes="44px" />}
          </span>
          <span className={styles.productText}>
            <Link href={`/admin/products/${product.id}`} className="row-link">
              {product.name.en}
            </Link>
            <span className="cell-muted">
              {product.sku ? `${product.sku} · ` : ''}
              {plural(product.variants.length, 'size')}
            </span>
          </span>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (product) => product.categoryName || '—' },
    {
      key: 'price',
      header: 'Price',
      className: 'text-nowrap cell-strong',
      render: (product) => (
        <>
          {product.variants.length > 1 && <span className="cell-muted fw-normal">from </span>}
          {money(product.price)}
        </>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (product) => (
        <>
          <StockPill total={product.totalStock} />
          {product.variants.length > 1 && (
            <span className={`cell-muted ${styles.sizes}`}>
              {product.variants.map((variant) => `${variant.label.en}: ${variant.stock}`).join(' · ')}
            </span>
          )}
        </>
      ),
    },
    { key: 'status', header: 'Status', render: (product) => <StatusPill kind="product" value={product.status} /> },
    {
      key: 'featured',
      header: 'Featured',
      className: 'text-center',
      render: (product) => <FeaturedToggle product={product} onChanged={products.refetch} />,
    },
    { key: 'updated', header: 'Updated', className: 'cell-muted text-nowrap', render: (product) => formatDate(product.updatedAt) },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-end',
      render: (product) => <ProductRowActions product={product} onChanged={products.refetch} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={products.data ? `${plural(products.data.total, 'product')} in the catalogue` : 'Loading the catalogue…'}
        actions={
          <ButtonLink href="/admin/products/new">
            <PiPlus aria-hidden="true" /> Add product
          </ButtonLink>
        }
      />

      <section className="admin-card">
        <FilterBar
          key={filters.q}
          values={filters}
          placeholder="Search name or SKU"
          onChange={setParams}
          filters={[
            {
              name: 'category',
              label: 'All categories',
              options: [
                ...(categories.data ?? []).map((category) => ({ value: category.id, label: category.name.en })),
                { value: 'none', label: 'No category' },
              ],
            },
            { name: 'status', label: 'Any status', options: STATUS_OPTIONS },
            { name: 'stock', label: 'Any stock', options: STOCK_OPTIONS },
          ]}
        />

        <QueryState query={products} loadingLabel="Loading products…">
          {(result) => (
            <>
              <AdminTable
                list
                columns={columns}
                rows={result.items}
                loading={products.loading}
                empty={
                  <EmptyState icon={PiPackage} title="No products found">
                    {hasFilters ? 'Try adjusting the filters.' : 'Create your first product to start selling.'}
                  </EmptyState>
                }
              />
              <AdminPagination {...result} onPageChange={(next) => setParams({ page: next })} />
            </>
          )}
        </QueryState>
      </section>
    </>
  );
}
