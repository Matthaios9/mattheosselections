'use client';

import Dropdown from 'react-bootstrap/Dropdown';
import Spinner from 'react-bootstrap/Spinner';
import { PiDotsThreeBold } from 'react-icons/pi';
import DropdownToggleButton from '@/components/common/DropdownToggleButton';
import styles from './RowActions.module.css';

// Fixed positioning lets the menu escape the table's scroll container, so it is never cut off.
// Top/left (not transform) positioning keeps the open animation from starting in the page corner.
const POPPER_CONFIG = {
  strategy: 'fixed',
  modifiers: [{ name: 'computeStyles', options: { gpuAcceleration: false } }],
};

/** The "•••" actions menu at the end of an admin table row. */
export default function RowActions({ label, title, pending = false, children }) {
  return (
    <Dropdown align="end">
      <Dropdown.Toggle as={DropdownToggleButton} className={styles.toggle} aria-label={label} disabled={pending}>
        {pending ? <Spinner animation="border" size="sm" /> : <PiDotsThreeBold aria-hidden="true" />}
      </Dropdown.Toggle>
      <Dropdown.Menu className={styles.menu} popperConfig={POPPER_CONFIG}>
        {title && <Dropdown.Header className={styles.title}>{title}</Dropdown.Header>}
        {children}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export function RowAction({ icon: Icon, danger = false, children, ...props }) {
  return (
    <Dropdown.Item className={`${styles.item} ${danger ? styles.danger : ''}`} {...props}>
      {Icon && <Icon className={styles.icon} aria-hidden="true" />}
      {children}
    </Dropdown.Item>
  );
}

export function RowActionDivider() {
  return <Dropdown.Divider className={styles.divider} />;
}
