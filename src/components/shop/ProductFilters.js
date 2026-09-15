'use client';

import Accordion from 'react-bootstrap/Accordion';
import Form from 'react-bootstrap/Form';
import { useI18n } from '@/i18n/I18nProvider';
import { PRICE_RANGES } from '@/constants/shop';
import styles from './ProductFilters.module.css';

/**
 * Filter controls (category, price, size, availability). Purely controlled:
 * `filters` + `onChange(patch)`; `counts` shows how many products each option yields.
 */
export default function ProductFilters({ filters, onChange, categories, sizes, counts, idPrefix = 'filters' }) {
  const { t } = useI18n();

  const toggleSize = (id) =>
    onChange({ sizes: filters.sizes.includes(id) ? filters.sizes.filter((s) => s !== id) : [...filters.sizes, id] });

  return (
    <Accordion alwaysOpen defaultActiveKey={['category', 'price', 'size', 'availability']} className={styles.accordion}>
      {categories.length > 0 && (
        <Accordion.Item eventKey="category">
          <Accordion.Header>{t('shop.filters.categories')}</Accordion.Header>
          <Accordion.Body>
            <ul className={styles.options}>
              {[{ id: 'all', name: t('shop.filters.allCategories') }, ...categories].map((category) => (
                <li key={category.id}>
                  <Form.Check
                    type="radio"
                    id={`${idPrefix}-category-${category.id}`}
                    name={`${idPrefix}-category`}
                    checked={filters.category === category.id}
                    onChange={() => onChange({ category: category.id })}
                    className={styles.option}
                    label={
                      <>
                        <span>{category.name}</span>
                        <span className={styles.count}>{counts.category[category.id] ?? 0}</span>
                      </>
                    }
                  />
                </li>
              ))}
            </ul>
          </Accordion.Body>
        </Accordion.Item>
      )}

      <Accordion.Item eventKey="price">
        <Accordion.Header>{t('shop.filters.price')}</Accordion.Header>
        <Accordion.Body>
          <ul className={styles.options}>
            {[{ id: 'any' }, ...PRICE_RANGES].map((range) => (
              <li key={range.id}>
                <Form.Check
                  type="radio"
                  id={`${idPrefix}-price-${range.id}`}
                  name={`${idPrefix}-price`}
                  checked={filters.priceRange === range.id}
                  onChange={() => onChange({ priceRange: range.id })}
                  className={styles.option}
                  label={
                    <>
                      <span>
                        {range.id === 'any' ? t('shop.filters.anyPrice') : t(`shop.filters.priceRanges.${range.id}`)}
                      </span>
                      <span className={styles.count}>{counts.price[range.id] ?? 0}</span>
                    </>
                  }
                />
              </li>
            ))}
          </ul>
        </Accordion.Body>
      </Accordion.Item>

      {sizes.length > 0 && (
        <Accordion.Item eventKey="size">
          <Accordion.Header>{t('shop.filters.size')}</Accordion.Header>
          <Accordion.Body>
            <div className={styles.sizes}>
              {sizes.map((size) => {
                const active = filters.sizes.includes(size.id);
                return (
                  <button
                    key={size.id}
                    type="button"
                    className={`${styles.size} ${active ? styles.sizeActive : ''}`}
                    aria-pressed={active}
                    onClick={() => toggleSize(size.id)}
                  >
                    {size.label}
                    <span className={styles.sizeCount}>{counts.size[size.id] ?? 0}</span>
                  </button>
                );
              })}
            </div>
          </Accordion.Body>
        </Accordion.Item>
      )}

      <Accordion.Item eventKey="availability">
        <Accordion.Header>{t('shop.filters.availability')}</Accordion.Header>
        <Accordion.Body>
          <Form.Check
            type="switch"
            id={`${idPrefix}-stock`}
            label={t('shop.filters.inStockOnly')}
            checked={filters.inStockOnly}
            onChange={(event) => onChange({ inStockOnly: event.target.checked })}
            className={styles.switch}
          />
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}
