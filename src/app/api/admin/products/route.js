import { createProduct, listProducts } from '@/server/domain/products';
import { created, parseBody, revalidateStorefront, withApi } from '@/server/http';
import { productInput } from '@/server/validation';

/** GET /api/admin/products — paginated list. Query: q, category (id | 'none'), status, stock (in|low|out), page. */
export const GET = withApi(
  ({ query: { q, category, status, stock, page } }) => listProducts({ q, category, status, stock, page }),
  { auth: 'admin' }
);

/** POST /api/admin/products — create a product. */
export const POST = withApi(
  async ({ request }) => {
    const product = await createProduct(await parseBody(request, productInput));
    revalidateStorefront();
    return created(product);
  },
  { auth: 'admin' }
);
