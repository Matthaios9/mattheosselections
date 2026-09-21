'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Spinner from 'react-bootstrap/Spinner';
import { PiPlus, PiStarFill, PiTrash } from 'react-icons/pi';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import ImageUploader from '@/components/admin/ImageUploader';
import LocaleTabs from '@/components/admin/LocaleTabs';
import { locales } from '@/i18n/config';
import { useAdminAction } from '@/hooks/useAdminAction';
import { createProduct, deleteProduct, updateProduct } from '@/services/product';
import { getErrorMessage, getFieldErrors } from '@/utils/errors';
import { variantKeyFrom } from '@/utils/variant-key';
import styles from './ProductForm.module.css';

const BADGES = [
  { value: '', label: 'No badge' },
  { value: 'bestseller', label: 'Bestseller' },
  { value: 'signature', label: 'Signature' },
  { value: 'limited', label: 'Limited harvest' },
  { value: 'new', label: 'New' },
  { value: 'gift', label: 'Gift favourite' },
];

const emptyLocalized = () => Object.fromEntries(locales.map((locale) => [locale.code, '']));
const emptySize = () => ({ key: '', label: emptyLocalized(), price: '', stock: '', image: '' });

function toFormState(product) {
  if (!product) {
    return {
      name: emptyLocalized(),
      sku: '',
      slug: '',
      category: '',
      description: emptyLocalized(),
      images: [],
      variants: [emptySize()],
      defaultIndex: 0,
      badge: '',
      featured: false,
      status: 'active',
    };
  }
  return {
    name: product.name,
    sku: product.sku,
    slug: product.slug,
    category: product.category ?? '',
    description: product.description,
    images: product.images,
    variants: product.variants.map((variant) => ({ ...variant, price: String(variant.price), stock: String(variant.stock) })),
    defaultIndex: Math.max(0, product.variants.findIndex((variant) => variant.key === product.defaultVariant)),
    badge: product.badge,
    featured: product.featured,
    status: product.status,
  };
}

/** Existing sizes keep their internal id; new sizes get one generated from the English label. */
function toPayload(form) {
  const used = new Set(form.variants.map((variant) => variant.key).filter(Boolean));
  const variants = form.variants.map((variant, index) => {
    let key = variant.key;
    if (!key) {
      const base = variantKeyFrom(variant.label.en) || `size-${index + 1}`;
      key = base;
      for (let n = 2; used.has(key); n += 1) key = `${base}-${n}`;
      used.add(key);
    }
    const toNumber = (value) => (value === '' ? NaN : Number(value));
    return { ...variant, key, price: toNumber(variant.price), stock: toNumber(variant.stock) };
  });
  const { defaultIndex, ...rest } = form;
  return { ...rest, variants, defaultVariant: variants[defaultIndex]?.key ?? variants[0]?.key ?? '' };
}

/** Clicking into a number selects it, so typing replaces the value instead of turning "0" into "200". */
const selectAll = (event) => event.target.select();

/** Immutable update of a nested path: setIn(obj, ['variants', 0, 'price'], '120') */
function setIn(target, [head, ...rest], value) {
  const next = rest.length ? setIn(target[head], rest, value) : value;
  if (Array.isArray(target)) return target.map((item, index) => (index === head ? next : item));
  return { ...target, [head]: next };
}

/**
 * Create / edit a product. `onSaved(product)` receives the saved product after an
 * edit (a new product redirects to its edit page instead).
 */
export default function ProductForm({ product, categories, onSaved }) {
  const router = useRouter();
  const isNew = !product;
  const [initial] = useState(() => toFormState(product));
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [save, saving] = useAdminAction();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [remove, deleting] = useAdminAction();

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const totalUnits = form.variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const update = (path, value) => {
    setForm((current) => setIn(current, path, value));
    const key = path.join('.');
    if (errors[key]) setErrors(({ [key]: _cleared, ...rest }) => rest);
  };
  const error = (key) => errors[key];

  const addSize = () => setForm((current) => ({ ...current, variants: [...current.variants, emptySize()] }));

  const removeSize = (index) =>
    setForm((current) => {
      const variants = current.variants.filter((_, i) => i !== index);
      let { defaultIndex } = current;
      if (index === defaultIndex) defaultIndex = 0;
      else if (index < defaultIndex) defaultIndex -= 1;
      return { ...current, variants, defaultIndex };
    });

  const localeStatus = Object.fromEntries(
    locales.map((locale) => {
      const hasError = ['name', 'description'].some((field) => errors[`${field}.${locale.code}`]);
      const missing = locale.code !== 'en' && form.name.en && !form.name[locale.code];
      return [locale.code, hasError ? 'error' : missing ? 'missing' : null];
    })
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    const payload = toPayload(form);
    const result = await save(() => (isNew ? createProduct(payload) : updateProduct(product.id, payload)), {
      success: isNew ? 'Product created' : 'Product saved',
      onError: (error) => {
        setErrors(getFieldErrors(error));
        setFormError(getErrorMessage(error, 'Could not save the product.'));
      },
    });
    if (!result.ok) return;
    setErrors({});
    if (isNew) router.push(`/admin/products/${result.data.id}`);
    else onSaved?.(result.data);
  };

  const handleDelete = async () => {
    const result = await remove(() => deleteProduct(product.id), { success: 'Product deleted' });
    if (result.ok) router.push('/admin/products');
    else setConfirmDelete(false);
  };

  return (
    <Form noValidate onSubmit={handleSubmit}>
      {formError && (
        <Alert variant="danger" onClose={() => setFormError(null)} dismissible>
          {formError}
        </Alert>
      )}

      <div className={styles.grid}>
        <div className={styles.main}>
          <section className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Product details</h2>
            </div>
            <LocaleTabs id="product-locale" status={localeStatus}>
              {(locale) => (
                <>
                  <Form.Group controlId={`name-${locale}`}>
                    <Form.Label>Name {locale === 'en' && <span className="text-danger">*</span>}</Form.Label>
                    <Form.Control
                      value={form.name[locale]}
                      onChange={(event) => update(['name', locale], event.target.value)}
                      isInvalid={Boolean(error(`name.${locale}`))}
                      placeholder={locale === 'en' ? 'e.g. Thyme Honey' : form.name.en}
                    />
                    <Form.Control.Feedback type="invalid">{error(`name.${locale}`)}</Form.Control.Feedback>
                  </Form.Group>
                  <Form.Group controlId={`description-${locale}`}>
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={form.description[locale]}
                      onChange={(event) => update(['description', locale], event.target.value)}
                      isInvalid={Boolean(error(`description.${locale}`))}
                    />
                    <Form.Control.Feedback type="invalid">{error(`description.${locale}`)}</Form.Control.Feedback>
                  </Form.Group>
                </>
              )}
            </LocaleTabs>
          </section>

          <section className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Images</h2>
              <span className="small text-muted-ms">{form.images.length}/12 · first image is the cover</span>
            </div>
            <div className="admin-card-body">
              <ImageUploader
                value={form.images}
                onChange={(updater) => setForm((current) => ({ ...current, images: updater(current.images) }))}
                target="products"
              />
              {error('images') && <p className="text-danger small mt-2 mb-0">{error('images')}</p>}
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">Sizes, prices & stock</h2>
                <span className="small text-muted-ms">{totalUnits} units in stock in total</span>
              </div>
              <Button variant="ms-outline" size="sm" onClick={addSize} disabled={form.variants.length >= 12}>
                <PiPlus aria-hidden="true" /> Add size
              </Button>
            </div>
            <div className="admin-card-body d-flex flex-column gap-3">
              {error('variants') && (
                <Alert variant="danger" className="mb-0 py-2">
                  {error('variants')}
                </Alert>
              )}
              {form.variants.map((variant, index) => (
                <div key={index} className={styles.variant}>
                  <div className={styles.variantHead}>
                    <span className={styles.variantIndex}>Size {index + 1}</span>
                    {form.variants.length > 1 && (
                      <Form.Check
                        type="radio"
                        name="default-size"
                        id={`default-${index}`}
                        label="Selected by default"
                        checked={form.defaultIndex === index}
                        onChange={() => update(['defaultIndex'], index)}
                      />
                    )}
                    {form.variants.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeVariant}
                        onClick={() => removeSize(index)}
                        aria-label={`Remove size ${index + 1}`}
                      >
                        <PiTrash />
                      </button>
                    )}
                  </div>
                  <div className={styles.variantGrid}>
                    {locales.map((locale) => (
                      <Form.Group key={locale.code} controlId={`variant-${index}-label-${locale.code}`}>
                        <Form.Label>
                          Size name ({locale.shortLabel}) {locale.code === 'en' && <span className="text-danger">*</span>}
                        </Form.Label>
                        <Form.Control
                          value={variant.label[locale.code]}
                          onChange={(event) => update(['variants', index, 'label', locale.code], event.target.value)}
                          placeholder={locale.code === 'en' ? 'e.g. 450 g or Large' : variant.label.en}
                          isInvalid={Boolean(error(`variants.${index}.label.${locale.code}`))}
                        />
                        <Form.Control.Feedback type="invalid">
                          {error(`variants.${index}.label.${locale.code}`)}
                        </Form.Control.Feedback>
                      </Form.Group>
                    ))}
                  </div>
                  <div className={styles.priceGrid}>
                    <Form.Group controlId={`variant-${index}-price`}>
                      <Form.Label>
                        Price <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup hasValidation>
                        <Form.Control
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={variant.price}
                          onFocus={selectAll}
                          onChange={(event) => update(['variants', index, 'price'], event.target.value)}
                          isInvalid={Boolean(error(`variants.${index}.price`))}
                        />
                        <InputGroup.Text>kr</InputGroup.Text>
                        <Form.Control.Feedback type="invalid">{error(`variants.${index}.price`)}</Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                    <Form.Group controlId={`variant-${index}-stock`}>
                      <Form.Label>
                        Quantity in stock <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup hasValidation>
                        <Form.Control
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={variant.stock}
                          onFocus={selectAll}
                          onChange={(event) => update(['variants', index, 'stock'], event.target.value)}
                          isInvalid={Boolean(error(`variants.${index}.stock`))}
                          placeholder="0"
                        />
                        <InputGroup.Text>units</InputGroup.Text>
                        <Form.Control.Feedback type="invalid">{error(`variants.${index}.stock`)}</Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </div>
                  {form.images.length > 1 && (
                    <div className={styles.variantImages}>
                      <span className="form-label mb-0">Image for this size</span>
                      <div className={styles.imagePicker}>
                        <button
                          type="button"
                          className={`${styles.pick} ${!variant.image ? styles.picked : ''}`}
                          onClick={() => update(['variants', index, 'image'], '')}
                        >
                          Cover
                        </button>
                        {form.images.map((image) => (
                          <button
                            key={image.url}
                            type="button"
                            className={`${styles.pickThumb} ${variant.image === image.url ? styles.picked : ''}`}
                            onClick={() => update(['variants', index, 'image'], image.url)}
                            aria-label="Use this image"
                          >
                            <Image src={image.url} alt="" fill sizes="48px" className="img-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.side}>
          <section className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Visibility</h2>
            </div>
            <div className="admin-card-body d-flex flex-column gap-3">
              <Form.Group controlId="status">
                <Form.Label>Status</Form.Label>
                <Form.Select value={form.status} onChange={(event) => update(['status'], event.target.value)}>
                  <option value="active">Active — visible in the shop</option>
                  <option value="draft">Draft — hidden</option>
                </Form.Select>
              </Form.Group>
              <Form.Check
                type="switch"
                id="featured"
                label={
                  <span className="d-inline-flex align-items-center gap-1">
                    Featured on the home page <PiStarFill className="text-warning" aria-hidden="true" />
                  </span>
                }
                checked={form.featured}
                onChange={(event) => update(['featured'], event.target.checked)}
              />
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Organisation</h2>
            </div>
            <div className="admin-card-body d-flex flex-column gap-3">
              <Form.Group controlId="category">
                <Form.Label>Category</Form.Label>
                <Form.Select
                  value={form.category}
                  onChange={(event) => update(['category'], event.target.value)}
                  isInvalid={Boolean(error('category'))}
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name.en}
                      {!category.active ? ' (hidden)' : ''}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{error('category')}</Form.Control.Feedback>
                {categories.length === 0 && (
                  <Form.Text>
                    No categories yet — <Link href="/admin/categories">create one</Link>.
                  </Form.Text>
                )}
              </Form.Group>
              <Form.Group controlId="badge">
                <Form.Label>Badge</Form.Label>
                <Form.Select value={form.badge} onChange={(event) => update(['badge'], event.target.value)}>
                  {BADGES.map((badge) => (
                    <option key={badge.value} value={badge.value}>
                      {badge.label}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text>“Signature” appears in the home page hero, “Gift favourite” in the gifting banner.</Form.Text>
              </Form.Group>
              <Form.Group controlId="sku">
                <Form.Label>SKU (optional)</Form.Label>
                <Form.Control value={form.sku} onChange={(event) => update(['sku'], event.target.value)} />
              </Form.Group>
              <Form.Group controlId="slug">
                <Form.Label>URL slug</Form.Label>
                <Form.Control
                  value={form.slug}
                  onChange={(event) => update(['slug'], event.target.value)}
                  placeholder="Generated from the name"
                  isInvalid={Boolean(error('slug'))}
                />
                <Form.Control.Feedback type="invalid">{error('slug')}</Form.Control.Feedback>
                <Form.Text>
                  The product page address: /sv/product/<strong>{form.slug || 'slug'}</strong>. Changing it breaks links to the old
                  address.
                </Form.Text>
              </Form.Group>
            </div>
          </section>

          {!isNew && (
            <section className="admin-card">
              <div className="admin-card-header">
                <h2 className="admin-card-title">Danger zone</h2>
              </div>
              <div className="admin-card-body">
                <p className="small text-muted-ms">
                  Deleting removes the product and its uploaded images. Past orders keep their details.
                </p>
                <Button variant="ms-outline" className="w-100 text-danger" onClick={() => setConfirmDelete(true)}>
                  <PiTrash aria-hidden="true" /> Delete product
                </Button>
              </div>
            </section>
          )}
        </aside>
      </div>

      <div className={styles.saveBar}>
        <span className={styles.saveHint}>{dirty ? 'You have unsaved changes' : isNew ? 'New product' : 'All changes saved'}</span>
        <Link href="/admin/products" className="btn btn-ms-outline">
          Cancel
        </Link>
        <Button type="submit" variant="ms-dark" disabled={saving || (!dirty && !isNew)}>
          {saving && <Spinner animation="border" size="sm" aria-hidden="true" />}
          {isNew ? 'Create product' : 'Save changes'}
        </Button>
      </div>

      {!isNew && (
        <ConfirmDialog
          show={confirmDelete}
          title="Delete this product?"
          message={`“${product.name.en}” will be removed from the store. This cannot be undone.`}
          pending={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </Form>
  );
}
