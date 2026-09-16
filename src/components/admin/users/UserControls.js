'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { PiCheckCircle, PiProhibit, PiShieldCheck, PiShieldSlash, PiTrash, PiUserCircle, PiUserPlus } from 'react-icons/pi';
import TextField from '@/components/common/TextField';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import RowActions, { RowAction, RowActionDivider } from '@/components/admin/RowActions';
import { useAdminSession } from '@/context/AdminSessionContext';
import { useAdminAction } from '@/hooks/useAdminAction';
import { useFormState } from '@/hooks/useFormState';
import { createUser, deleteUser, updateUserRole, updateUserStatus } from '@/services/user';
import { getErrorMessage, getFieldErrors } from '@/utils/errors';

const EMPTY_USER = { name: '', email: '', password: '', role: 'admin' };

/** "Add user" button + modal. `onCreated` reloads the list. */
export function CreateUserButton({ onCreated }) {
  const [show, setShow] = useState(false);
  const form = useFormState(EMPTY_USER);
  const [formError, setFormError] = useState(null);
  const [run, pending] = useAdminAction();

  const close = () => {
    setShow(false);
    form.reset();
    setFormError(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    const result = await run(() => createUser(form.values), {
      success: `${form.values.role === 'admin' ? 'Admin' : 'Customer'} account created`,
      onError: (error) => {
        form.setErrors(getFieldErrors(error));
        setFormError(getErrorMessage(error));
      },
    });
    if (!result.ok) return;
    close();
    onCreated?.();
  };

  return (
    <>
      <Button variant="ms-dark" onClick={() => setShow(true)}>
        <PiUserPlus aria-hidden="true" /> Add user
      </Button>
      <Modal show={show} onHide={pending ? undefined : close} centered>
        <Form noValidate onSubmit={submit}>
          <Modal.Header closeButton={!pending}>
            <Modal.Title as="h2" className="h4 mb-0">
              Add a user
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column gap-3">
            {formError && <Alert variant="danger" className="mb-0">{formError}</Alert>}
            <TextField id="new-user-name" label="Full name" autoComplete="off" {...form.field('name')} error={form.errors.name} />
            <TextField
              id="new-user-email"
              label="Email address"
              type="email"
              autoComplete="off"
              {...form.field('email')}
              error={form.errors.email}
            />
            <TextField
              id="new-user-password"
              label="Temporary password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              {...form.field('password')}
              error={form.errors.password}
            />
            <Form.Group controlId="new-user-role">
              <Form.Label>Role</Form.Label>
              <Form.Select {...form.field('role')}>
                <option value="admin">Admin — full access to this panel</option>
                <option value="customer">Customer — storefront account only</option>
              </Form.Select>
              {form.values.role === 'admin' && (
                <Form.Text>
                  Admins sign in to this panel with the Google account for this email. The password is for the
                  storefront.
                </Form.Text>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ms-outline" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" variant="ms-dark" disabled={pending}>
              {pending && <Spinner animation="border" size="sm" aria-hidden="true" />}
              Create account
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

/**
 * "•••" menu for a user: role, status, delete. Your own account shows "You" instead.
 * `onChanged(user)` receives the updated user (or nothing after a delete).
 */
export function UserRowActions({ user, onChanged, redirectAfterDelete }) {
  const router = useRouter();
  const { admin } = useAdminSession();
  const [run, pending] = useAdminAction();
  const [confirm, setConfirm] = useState(false);

  if (user.id === admin.id) return <span className="small text-muted-ms">You</span>;

  const isAdmin = user.role === 'admin';
  const isActive = user.status === 'active';

  const destroy = async () => {
    const result = await run(() => deleteUser(user.id), { success: 'User deleted' });
    setConfirm(false);
    if (!result.ok) return;
    if (redirectAfterDelete) router.push(redirectAfterDelete);
    else onChanged?.();
  };

  return (
    <>
      <RowActions label={`Actions for ${user.name}`} title={user.name} pending={pending}>
        {!redirectAfterDelete && (
          <>
            <RowAction as={Link} href={`/admin/users/${user.id}`} icon={PiUserCircle}>
              View details
            </RowAction>
            <RowActionDivider />
          </>
        )}
        <RowAction
          as="button"
          icon={isAdmin ? PiShieldSlash : PiShieldCheck}
          onClick={() =>
            run(() => updateUserRole(user.id, isAdmin ? 'customer' : 'admin'), {
              success: isAdmin ? 'Admin access removed' : 'Promoted to admin',
              onSuccess: onChanged,
            })
          }
        >
          {isAdmin ? 'Remove admin access' : 'Make admin'}
        </RowAction>
        <RowAction
          as="button"
          icon={isActive ? PiProhibit : PiCheckCircle}
          onClick={() =>
            run(() => updateUserStatus(user.id, isActive ? 'disabled' : 'active'), {
              success: isActive ? 'Account disabled' : 'Account enabled',
              onSuccess: onChanged,
            })
          }
        >
          {isActive ? 'Disable account' : 'Enable account'}
        </RowAction>
        <RowActionDivider />
        <RowAction as="button" icon={PiTrash} danger onClick={() => setConfirm(true)}>
          Delete user
        </RowAction>
      </RowActions>
      <ConfirmDialog
        show={confirm}
        title="Delete this user?"
        message={`${user.name} (${user.email}) will be permanently removed. Their past orders are kept.`}
        pending={pending}
        onConfirm={destroy}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}
