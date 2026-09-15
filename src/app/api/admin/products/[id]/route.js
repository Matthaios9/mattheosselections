import { deleteProduct, getProduct, setProductFlags, updateProduct } from '@/server/domain/products';
import { notFound, parseBody, revalidateStorefront, withApi } from '@/server/http';
import { productFlagsInput, productInput } from '@/server/validation';

const missing = () => notFound('Product not found.');

/** GET /api/admin/products/:id */
export const GET = withApi(
  async ({ params }) => {
    const product = await getProduct(params.id);
    if (!product) throw missing();
    return product;
  },
  { auth: 'admin' }
);

/** PUT /api/admin/products/:id — save the full product form. */
export const PUT = withApi(
  async ({ request, params }) => {
    const product = await updateProduct(params.id, await parseBody(request, productInput));
    if (!product) throw missing();
    revalidateStorefront();
    return product;
  },
  { auth: 'admin' }
);

/** PATCH /api/admin/products/:id — quick toggles: `{ featured }` and/or `{ status }`. */
export const PATCH = withApi(
  async ({ request, params }) => {
    const product = await setProductFlags(params.id, await parseBody(request, productFlagsInput));
    if (!product) throw missing();
    revalidateStorefront();
    return product;
  },
  { auth: 'admin' }
);

/** DELETE /api/admin/products/:id — also removes its Cloudinary images. */
export const DELETE = withApi(
  async ({ params }) => {
    if (!(await deleteProduct(params.id))) throw missing();
    revalidateStorefront();
    return { ok: true };
  },
  { auth: 'admin' }
);
