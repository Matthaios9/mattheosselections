'use client';

import Link from 'next/link';
import { PiUsers } from 'react-icons/pi';
import AdminPagination from '@/components/admin/AdminPagination';
import AdminTable from '@/components/admin/AdminTable';
import EmptyState from '@/components/admin/EmptyState';
import FilterBar from '@/components/admin/FilterBar';
import PageHeader from '@/components/admin/PageHeader';
import QueryState from '@/components/admin/QueryState';
import StatusPill from '@/components/admin/StatusPill';
import UserAvatar from '@/components/admin/UserAvatar';
import { CreateUserButton, UserRowActions } from '@/components/admin/users/UserControls';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useUrlParams } from '@/hooks/useUrlParams';
import { getAllUsers } from '@/services/user';
import { formatDate, money } from '@/utils/format';

const FILTERS = [
  {
    name: 'role',
    label: 'All roles',
    options: [
      { value: 'customer', label: 'Customers' },
      { value: 'admin', label: 'Admins' },
    ],
  },
  {
    name: 'status',
    label: 'Any status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'disabled', label: 'Disabled' },
    ],
  },
];

export default function UserList() {
  const [params, setParams] = useUrlParams();
  const filters = { q: params.q ?? '', role: params.role ?? '', status: params.status ?? '' };
  const page = Number(params.page) || 1;
  const users = useApiQuery(['admin-users', filters, page], () => getAllUsers({ ...filters, page }));

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (user) => (
        <div className="d-flex align-items-center gap-3">
          <UserAvatar name={user.name} />
          <div>
            <Link href={`/admin/users/${user.id}`} className="row-link">
              {user.name}
            </Link>
            <div className="cell-muted">{user.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (user) => <StatusPill kind="role" value={user.role} /> },
    { key: 'status', header: 'Status', render: (user) => <StatusPill kind="user" value={user.status} /> },
    { key: 'orders', header: 'Orders', render: (user) => user.orderCount },
    { key: 'spent', header: 'Spent', className: 'text-nowrap', render: (user) => money(user.totalSpent) },
    { key: 'joined', header: 'Joined', className: 'cell-muted text-nowrap', render: (user) => formatDate(user.createdAt) },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-end',
      render: (user) => <UserRowActions user={user} onChanged={users.refetch} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Customers who registered in the store and team members with admin access."
        actions={<CreateUserButton onCreated={users.refetch} />}
      />

      <section className="admin-card">
        <FilterBar key={filters.q} values={filters} placeholder="Search by name or email" filters={FILTERS} onChange={setParams} />

        <QueryState query={users} loadingLabel="Loading users…">
          {(result) => (
            <>
              <AdminTable
                list
                columns={columns}
                rows={result.items}
                loading={users.loading}
                empty={
                  <EmptyState icon={PiUsers} title="No users found">
                    {Object.values(filters).some(Boolean)
                      ? 'Try adjusting the filters.'
                      : 'Customers appear here after they create an account.'}
                  </EmptyState>
                }
              />
              <AdminPagination {...result} onPageChange={(next) => setParams({ page: next })} />
            </>
          )}
        </QueryState>
      </section>
    </>
  );
}
