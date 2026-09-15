import UserDetail from '@/components/admin/users/UserDetail';

export const metadata = { title: 'User' };

export default async function UserPage({ params }) {
  const { id } = await params;
  return <UserDetail id={id} />;
}
