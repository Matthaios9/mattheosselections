'use client';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Spinner from 'react-bootstrap/Spinner';
import { PiPlus, PiTrash } from 'react-icons/pi';
import { plural } from '@/utils/format';
import styles from './ProductForm.module.css';

export const emptyPackItem = () => ({ product: '', variantKey: '', quantity: '1' });

/** Clicking into a number selects it, so typing replaces the value instead of turning "1" into "12". */
const selectAll = (event) => event.target.select();

/**
 * What goes into one pack (one size of a pack product): rows of quantity × product × size.
 * `choices` is the query of products a pack can hold; `error(key)` reads field errors
 * relative to this list (e.g. '0.product'); `onChange(contents)` receives the new rows.
 */
export default function PackContents({ id, contents, choices, error, onChange }) {
  const byId = new Map((choices.data ?? []).map((choice) => [choice.id, choice]));
  const sizeOf = (item) => byId.get(item.product)?.variants.find((variant) => variant.key === item.variantKey);

  const change = (position, fields) =>
    onChange(contents.map((item, index) => (index === position ? { ...item, ...fields } : item)));
  const pickProduct = (position, productId) => {
    const choice = byId.get(productId);
    change(position, { product: productId, variantKey: choice?.defaultVariant || choice?.variants[0]?.key || '' });
  };

  // How many complete packs the current stock makes up: the scarcest product decides.
  const complete = contents.filter((item) => sizeOf(item) && Number(item.quantity) >= 1);
  const available =
    choices.data && complete.length === contents.length && complete.length
      ? Math.min(...complete.map((item) => Math.floor(sizeOf(item).stock / Number(item.quantity))))
      : null;

  if (!choices.data) {
    return (
      <div className={styles.pack}>
        {choices.error ? (
          <p className="text-danger small mb-0">
            Could not load the products.{' '}
            <Button variant="link" size="sm" className="p-0 align-baseline" onClick={choices.refetch}>
              Try again
            </Button>
          </p>
        ) : (
          <span className="small text-muted-ms d-inline-flex align-items-center gap-2">
            <Spinner animation="border" size="sm" aria-hidden="true" /> Loading products…
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={styles.pack}>
      <span className="form-label mb-0">
        What goes into one pack <span className="text-danger">*</span>
      </span>
      {error('') && <p className="text-danger small mb-0">{error('')}</p>}

      {contents.map((item, position) => {
        const choice = byId.get(item.product);
        const size = sizeOf(item);
        return (
          <div key={position} className={styles.packRow}>
            <div className={styles.packQty}>
              <InputGroup hasValidation>
                <Form.Control
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  aria-label="Quantity in each pack"
                  value={item.quantity}
                  onFocus={selectAll}
                  onChange={(event) => change(position, { quantity: event.target.value })}
                  isInvalid={Boolean(error(`${position}.quantity`))}
                />
                <InputGroup.Text>×</InputGroup.Text>
                <Form.Control.Feedback type="invalid">{error(`${position}.quantity`)}</Form.Control.Feedback>
              </InputGroup>
            </div>
            <div className={styles.packProduct}>
              <Form.Select
                id={`${id}-product-${position}`}
                aria-label="Product"
                value={item.product}
                onChange={(event) => pickProduct(position, event.target.value)}
                isInvalid={Boolean(error(`${position}.product`))}
              >
                <option value="">Choose a product…</option>
                {item.product && !choice && <option value={item.product}>Product not available</option>}
                {choices.data.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                    {option.status === 'draft' ? ' (draft)' : ''}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{error(`${position}.product`)}</Form.Control.Feedback>
            </div>
            <div className={styles.packSize}>
              <Form.Select
                aria-label="Size"
                value={item.variantKey}
                disabled={!choice}
                onChange={(event) => change(position, { variantKey: event.target.value })}
                isInvalid={Boolean(error(`${position}.variantKey`))}
              >
                {!size && <option value={item.variantKey}>{choice ? 'Choose a size…' : 'Size'}</option>}
                {choice?.variants.map((variant) => (
                  <option key={variant.key} value={variant.key}>
                    {variant.label}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{error(`${position}.variantKey`)}</Form.Control.Feedback>
              {size && <Form.Text className={size.stock === 0 ? 'text-danger' : undefined}>{size.stock} in stock</Form.Text>}
            </div>
            <button
              type="button"
              className={styles.removeVariant}
              onClick={() => onChange(contents.filter((_, index) => index !== position))}
              aria-label={`Remove ${choice?.name ?? 'product'} from the pack`}
            >
              <PiTrash />
            </button>
          </div>
        );
      })}

      <div className="d-flex flex-wrap align-items-center gap-3">
        <Button
          variant="ms-outline"
          size="sm"
          onClick={() => onChange([...contents, emptyPackItem()])}
          disabled={contents.length >= 30}
        >
          <PiPlus aria-hidden="true" /> Add product
        </Button>
        {available !== null && (
          <span className={`small ${available === 0 ? 'text-danger' : 'text-muted-ms'}`}>
            The current stock makes <strong>{plural(available, 'pack')}</strong>.
          </span>
        )}
      </div>
    </div>
  );
}
