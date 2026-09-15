import { z } from 'zod';
import { deleteUser, getUser, updateUser, userChangeProblem } from '@/server/domain/users';
import { forbidden, notFound, parseBody, withApi } from '@/server/http';
import { userRoleInput, userStatusInput } from '@/server/validation';

const missing = () => notFound('User not found.');

/** GET /api/admin/users/:id — profile with order count and total spent. */
export const GET = withApi(
  async ({ params }) => {
    const user = await getUser(params.id);
    if (!user) throw missing();
    return user;
  },
  { auth: 'admin' }
);

/** PATCH /api/admin/users/:id — `{ role }` or `{ status }`. Admins can't lock themselves out or remove the last admin. */
export const PATCH = withApi(
  async ({ request, params, user: admin }) => {
    const body = await parseBody(request, z.union([userRoleInput, userStatusInput]));
    const removesAdmin = 'role' in body ? body.role !== 'admin' : body.status === 'disabled';
    const problem = await userChangeProblem(params.id, admin, { removesAdmin });
    if (problem) throw forbidden(problem, 'unsafe-change');
    const user = await updateUser(params.id, body);
    if (!user) throw missing();
    return user;
  },
  { auth: 'admin' }
);

/** DELETE /api/admin/users/:id — past orders are kept. */
export const DELETE = withApi(
  async ({ params, user: admin }) => {
    const problem = await userChangeProblem(params.id, admin, { removesAdmin: true });
    if (problem) throw forbidden(problem, 'unsafe-change');
    if (!(await deleteUser(params.id))) throw missing();
    return { ok: true };
  },
  { auth: 'admin' }
);
