'use client';

import { useState } from 'react';
import { validate } from '@/utils/validation';

/**
 * Values + field errors for a form, with the change handling every form needs.
 *
 *   const form = useFormState({ email: '', remember: true });
 *   <Form.Control {...form.field('email')} />        // value, onChange, isInvalid
 *   <Form.Check {...form.checkbox('remember')} />    // checked, onChange
 *   if (!form.validate({ email: [required('…')] })) return;
 *
 * Editing a field clears its error.
 */
export function useFormState(initialValues) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const setValue = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  };

  const handleChange = (name) => (event) => {
    const { type, checked, value } = event.target;
    setValue(name, type === 'checkbox' ? checked : value);
  };

  return {
    values,
    errors,
    setValues,
    setErrors,
    setValue,
    field: (name) => ({ name, value: values[name] ?? '', onChange: handleChange(name), isInvalid: Boolean(errors[name]) }),
    checkbox: (name) => ({ name, checked: Boolean(values[name]), onChange: handleChange(name) }),
    /** Run the rules (see utils/validation.js); returns true when the form is valid. */
    validate: (rules) => {
      const next = validate(values, rules);
      setErrors(next);
      return Object.keys(next).length === 0;
    },
    reset: (next = initialValues) => {
      setValues(next);
      setErrors({});
    },
  };
}
