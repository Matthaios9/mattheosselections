import { checkPackRules, createProduct, listProducts } from '@/server/domain/products';
import { created, invalidFields, parseBody, revalidateStorefront, withApi } from '@/server/http';
import { productInput } from '@/server/validation';

/** GET /api/admin/products — paginated list. Query: q, category (id | 'none'), status, stock (in|low|out), page. */
export const GET = withApi(
  ({ query: { q, category, status, stock, page } }) => listProducts({ q, category, status, stock, page }),
  { auth: 'admin' }
);

/** POST /api/admin/products — create a product (or a pack of other products). */
export const POST = withApi(
  async ({ request }) => {
    const input = await parseBody(request, productInput);
    const problems = await checkPackRules(input);
    if (problems) throw invalidFields(problems);
    const product = await createProduct(input);
    revalidateStorefront();
    return created(product);
  },
  { auth: 'admin' }
);
