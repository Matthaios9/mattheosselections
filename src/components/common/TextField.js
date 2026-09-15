import Form from 'react-bootstrap/Form';

/**
 * Label + input + validation message — the form field used across the storefront
 * and the admin. Extra props go to the input (`as="textarea"`, `type`, `autoComplete`…);
 * `className` styles the wrapper, `inputClassName` the input.
 * Pairs with `useFormState`: <TextField id="email" label="Email" {...form.field('email')} error={…} />
 */
export default function TextField({ id, label, error, hint, className, inputClassName, ...inputProps }) {
  return (
    <Form.Group controlId={id} className={className}>
      {label && <Form.Label>{label}</Form.Label>}
      <Form.Control {...inputProps} className={inputClassName} isInvalid={Boolean(error)} />
      {hint && <Form.Text>{hint}</Form.Text>}
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
    </Form.Group>
  );
}
