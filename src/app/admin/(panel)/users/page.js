import { Suspense } from 'react';
import UserList from '@/components/admin/users/UserList';

export const metadata = { title: 'Users' };

export default function UsersPage() {
  return (
    <Suspense>
      <UserList />
    </Suspense>
  );
}
