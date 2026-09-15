import ProductEditor from '@/components/admin/products/ProductEditor';

export const metadata = { title: 'Edit product' };

export default async function EditProductPage({ params }) {
  const { id } = await params;
  return <ProductEditor id={id} />;
}
