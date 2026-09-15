import AdminShell from '@/components/admin/AdminShell';
import { requireAdmin } from '@/server/auth/dal';

/** Every page in this group requires an active admin (verified against the database). */
export default async function AdminPanelLayout({ children }) {
  const admin = await requireAdmin();
  return <AdminShell admin={admin}>{children}</AdminShell>;
}
