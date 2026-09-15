import { createCategory, listCategories } from '@/server/domain/categories';
import { created, parseBody, revalidateStorefront, withApi } from '@/server/http';
import { categoryInput } from '@/server/validation';

/** GET /api/admin/categories — every category (hidden ones too) with its product count. */
export const GET = withApi(() => listCategories(), { auth: 'admin' });

/** POST /api/admin/categories */
export const POST = withApi(
  async ({ request }) => {
    const category = await createCategory(await parseBody(request, categoryInput));
    revalidateStorefront();
    return created(category);
  },
  { auth: 'admin' }
);
