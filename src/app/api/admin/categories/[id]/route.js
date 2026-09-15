import { deleteCategory, updateCategory } from '@/server/domain/categories';
import { notFound, parseBody, revalidateStorefront, withApi } from '@/server/http';
import { categoryInput } from '@/server/validation';

/** PUT /api/admin/categories/:id */
export const PUT = withApi(
  async ({ request, params }) => {
    const category = await updateCategory(params.id, await parseBody(request, categoryInput));
    if (!category) throw notFound('Category not found.');
    revalidateStorefront();
    return category;
  },
  { auth: 'admin' }
);

/** DELETE /api/admin/categories/:id — its products stay in the shop without a category. */
export const DELETE = withApi(
  async ({ params }) => {
    const result = await deleteCategory(params.id);
    if (!result) throw notFound('Category not found.');
    revalidateStorefront();
    return { ok: true, uncategorised: result.uncategorised };
  },
  { auth: 'admin' }
);
