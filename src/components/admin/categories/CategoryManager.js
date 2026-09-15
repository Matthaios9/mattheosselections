'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { PiPencilSimple, PiPlus, PiTag, PiTrash } from 'react-icons/pi';
import AdminTable from '@/components/admin/AdminTable';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import EmptyState from '@/components/admin/EmptyState';
import ImageUploader from '@/components/admin/ImageUploader';
import LocaleTabs from '@/components/admin/LocaleTabs';
import PageHeader from '@/components/admin/PageHeader';
import QueryState from '@/components/admin/QueryState';
import { useAdminAction } from '@/hooks/useAdminAction';
import { useApiQuery } from '@/hooks/useApiQuery';
import { locales } from '@/i18n/config';
import { createCategory, deleteCategory, getAllCategories, updateCategory } from '@/services/category';
import { getErrorMessage, getFieldErrors } from '@/utils/errors';
import { plural } from '@/utils/format';

const emptyLocalized = () => Object.fromEntries(locales.map((locale) => [locale.code, '']));

function toForm(category, nextOrder) {
  return category
    ? {
        name: category.name,
        description: category.description,
        image: category.image,
        sortOrder: category.sortOrder,
        active: category.active,
      }
    : { name: emptyLocalized(), description: emptyLocalized(), image: null, sortOrder: nextOrder, active: true };
}

function CategoryModal({ category, nextOrder, show, onHide, onSaved }) {
  const [form, setForm] = useState(() => toForm(category, nextOrder));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [run, pending] = useAdminAction();

  const setLocalized = (field, locale, value) =>
    setForm((current) => ({ ...current, [field]: { ...current[field], [locale]: value } }));

  const submit = async (event) => {
    event.preventDefault();
    await run(() => (category ? updateCategory(category.id, form) : createCategory(form)), {
      success: category ? 'Category saved' : 'Category created',
      onSuccess: onSaved,
      onError: (error) => {
        setErrors(getFieldErrors(error));
        setFormError(getErrorMessage(error));
      },
    });
  };

  const status = Object.fromEntries(
    locales.map((locale) => [
      locale.code,
      errors[`name.${locale.code}`] ? 'error' : locale.code !== 'en' && form.name.en && !form.name[locale.code] ? 'missing' : null,
    ])
  );

  return (
    <Modal show={show} onHide={pending ? undefined : onHide} centered size="lg">
      <Form noValidate onSubmit={submit}>
        <Modal.Header closeButton={!pending}>
          <Modal.Title as="h2" className="h4 mb-0">
            {category ? `Edit “${category.name.en}”` : 'New category'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {formError && <Alert variant="danger" className="m-3 mb-0">{formError}</Alert>}
          <LocaleTabs id="category-locale" status={status}>
            {(locale) => (
              <>
                <Form.Group controlId={`category-name-${locale}`}>
                  <Form.Label>Name {locale === 'en' && <span className="text-danger">*</span>}</Form.Label>
                  <Form.Control
                    value={form.name[locale]}
                    onChange={(event) => setLocalized('name', locale, event.target.value)}
                    placeholder={locale === 'en' ? 'e.g. Honey' : form.name.en}
                    isInvalid={Boolean(errors[`name.${locale}`])}
                  />
                  <Form.Control.Feedback type="invalid">{errors[`name.${locale}`]}</Form.Control.Feedback>
                </Form.Group>
                <Form.Group controlId={`category-description-${locale}`}>
                  <Form.Label>Short description</Form.Label>
                  <Form.Control
                    value={form.description[locale]}
                    onChange={(event) => setLocalized('description', locale, event.target.value)}
                    placeholder={locale === 'en' ? 'e.g. Raw honey from small Greek beekeepers' : form.description.en}
                  />
                </Form.Group>
              </>
            )}
          </LocaleTabs>
          <div className="p-4 pt-2 d-grid gap-3" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
            <Form.Group controlId="category-order" style={{ maxWidth: '12rem' }}>
              <Form.Label>Display order</Form.Label>
              <Form.Control
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                isInvalid={Boolean(errors.sortOrder)}
              />
              <Form.Control.Feedback type="invalid">{errors.sortOrder}</Form.Control.Feedback>
              <Form.Text>Lower numbers are shown first.</Form.Text>
            </Form.Group>
            <div>
              <Form.Label>Image</Form.Label>
              <ImageUploader
                value={form.image ? [form.image] : []}
                onChange={(updater) =>
                  setForm((current) => {
                    const next = updater(current.image ? [current.image] : []);
                    return { ...current, image: next[0] ?? null };
                  })
                }
                target="categories"
                multiple={false}
              />
            </div>
            <Form.Check
              type="switch"
              id="category-active"
              label="Visible in the shop"
              checked={form.active}
              onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ms-outline" onClick={onHide} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="ms-dark" disabled={pending}>
            {pending && <Spinner animation="border" size="sm" aria-hidden="true" />}
            {category ? 'Save category' : 'Create category'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default function CategoryManager() {
  const query = useApiQuery(['admin-categories'], getAllCategories);
  const categories = query.data ?? [];
  const [editing, setEditing] = useState(null); // category | 'new' | null
  const [deleting, setDeleting] = useState(null);
  const [run, pending] = useAdminAction();
  const nextOrder = categories.reduce((max, c) => Math.max(max, c.sortOrder), -1) + 1;

  const handleSaved = () => {
    setEditing(null);
    query.refetch();
  };

  const confirmDelete = async () => {
    await run(() => deleteCategory(deleting.id), {
      success: (result) =>
        result.uncategorised
          ? `Category deleted · ${plural(result.uncategorised, 'product')} now without a category`
          : 'Category deleted',
      onSuccess: query.refetch,
    });
    setDeleting(null);
  };

  const columns = [
    {
      key: 'category',
      header: 'Category',
      render: (category) => (
        <div className="d-flex align-items-center gap-3">
          <span className="admin-thumb">
            {category.image && <Image src={category.image.url} alt="" fill sizes="44px" />}
          </span>
          <div>
            <div className="cell-strong">{category.name.en}</div>
            <div className="cell-muted">
              {locales
                .filter((l) => l.code !== 'en')
                .map((l) => category.name[l.code] || '—')
                .join(' · ')}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'products',
      header: 'Products',
      render: (category) => (
        <Link href={`/admin/products?category=${category.id}`} className="row-link">
          {category.productCount}
        </Link>
      ),
    },
    { key: 'order', header: 'Order', render: (category) => category.sortOrder },
    {
      key: 'visibility',
      header: 'Visibility',
      render: (category) => (
        <span className={`status-pill ${category.active ? 'tone-success' : 'tone-neutral'}`}>
          {category.active ? 'Visible' : 'Hidden'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-end text-nowrap',
      render: (category) => (
        <>
          <Button variant="ms-outline" size="sm" onClick={() => setEditing(category)} className="me-1">
            <PiPencilSimple aria-hidden="true" /> Edit
          </Button>
          <Button
            variant="ms-outline"
            size="sm"
            className="text-danger"
            onClick={() => setDeleting(category)}
            aria-label={`Delete ${category.name.en}`}
          >
            <PiTrash aria-hidden="true" />
          </Button>
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Organise the catalogue. Categories appear on the home page, in the shop filters and the menu."
        actions={
          <Button variant="ms-dark" onClick={() => setEditing('new')}>
            <PiPlus aria-hidden="true" /> Add category
          </Button>
        }
      />

      <section className="admin-card">
        <QueryState query={query} loadingLabel="Loading categories…">
          {(list) => (
            <AdminTable
              list
              columns={columns}
              rows={list}
              loading={query.loading}
              empty={
                <EmptyState icon={PiTag} title="No categories yet">
                  Categories you create here appear on the home page, in the menu and as shop filters.
                </EmptyState>
              }
            />
          )}
        </QueryState>
      </section>

      {editing && (
        <CategoryModal
          key={editing === 'new' ? 'new' : editing.id}
          show
          category={editing === 'new' ? null : editing}
          nextOrder={nextOrder}
          onHide={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      <ConfirmDialog
        show={Boolean(deleting)}
        title="Delete this category?"
        message={
          deleting?.productCount
            ? `“${deleting.name.en}” will be removed. Its ${deleting.productCount} product${deleting.productCount === 1 ? '' : 's'} stay in the shop without a category.`
            : `“${deleting?.name.en}” will be removed. This cannot be undone.`
        }
        pending={pending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
