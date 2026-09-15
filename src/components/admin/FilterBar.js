'use client';

import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { PiMagnifyingGlass, PiX } from 'react-icons/pi';
import styles from './FilterBar.module.css';

/**
 * Search box + select filters for admin lists (controlled — pair it with useUrlParams).
 * `filters`: [{ name, label, options: [{ value, label }] }]; `onChange(patch)` receives the change.
 * Remount it with `key={values.q}` so the search box follows back/forward navigation.
 */
export default function FilterBar({ values = {}, filters = [], placeholder = 'Search…', onChange }) {
  const [query, setQuery] = useState(values.q ?? '');
  const hasFilters = Boolean(values.q) || filters.some((filter) => values[filter.name]);

  const clear = () => {
    setQuery('');
    onChange({ q: '', ...Object.fromEntries(filters.map((filter) => [filter.name, ''])) });
  };

  return (
    <Form
      className={styles.bar}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onChange({ q: query.trim() });
      }}
    >
      <div className={styles.search}>
        <PiMagnifyingGlass className={styles.icon} aria-hidden="true" />
        <Form.Control
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
      </div>
      {filters.map((filter) => (
        <Form.Select
          key={filter.name}
          value={values[filter.name] ?? ''}
          onChange={(event) => onChange({ q: query.trim(), [filter.name]: event.target.value })}
          aria-label={filter.label}
          className={styles.select}
        >
          <option value="">{filter.label}</option>
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      ))}
      <Button type="submit" variant="ms-dark">
        Search
      </Button>
      {hasFilters && (
        <Button variant="ms-outline" onClick={clear}>
          <PiX aria-hidden="true" /> Clear
        </Button>
      )}
    </Form>
  );
}
