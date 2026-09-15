import { forwardRef } from 'react';

/**
 * Plain <button> for React-Bootstrap's `<Dropdown.Toggle as={DropdownToggleButton}>`:
 * keeps our own styling (no default button look) and never submits a surrounding form.
 */
const DropdownToggleButton = forwardRef(function DropdownToggleButton({ onClick, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      onClick={(event) => {
        event.preventDefault();
        onClick(event);
      }}
    >
      {children}
    </button>
  );
});

export default DropdownToggleButton;
