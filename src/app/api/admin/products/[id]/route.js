import { after } from 'next/server';
import { deleteProduct, getProduct, setProductFlags, updateProduct } from '@/server/domain/products';
import { sendBackInStockEmails } from '@/server/domain/stock-alerts';
import { notFound, parseBody, requestOrigin, revalidateStorefront, withApi } from '@/server/http';
import { productFlagsInput, productInput } from '@/server/validation';

const missing = () => notFound('Product not found.');

/** After a save, email customers waiting for a size of this product that is back in stock. */
function notifyRestock(request, productId) {
  const origin = requestOrigin(request);
  after(() =>
    sendBackInStockEmails({ productIds: [productId], origin }).catch((error) =>
      console.error('[stock-alerts] Could not send back-in-stock emails:', error.message)
    )
  );
}

/** GET /api/admin/products/:id */
export const GET = withApi(
  async ({ params }) => {
    const product = await getProduct(params.id);
    if (!product) throw missing();
    return product;
  },
  { auth: 'admin' }
);

/** PUT /api/admin/products/:id — save the full product form (restocked sizes trigger back-in-stock emails). */
export const PUT = withApi(
  async ({ request, params }) => {
    const product = await updateProduct(params.id, await parseBody(request, productInput));
    if (!product) throw missing();
    revalidateStorefront();
    notifyRestock(request, params.id);
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
    notifyRestock(request, params.id); // publishing a draft can make it available again
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
