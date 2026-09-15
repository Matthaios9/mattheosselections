import styles from './SectionHeading.module.css';

/**
 * Consistent section header: eyebrow, serif title, supporting text and an optional action.
 * `align="center"` stacks everything centered; `align="split"` puts the action on the opposite side.
 */
export default function SectionHeading({
  eyebrow,
  title,
  text,
  action,
  align = 'start',
  light = false,
  as: Heading = 'h2',
  className = '',
}) {
  return (
    <div className={`${styles.heading} ${styles[align]} ${light ? styles.light : ''} ${className}`}>
      <div className={styles.copy}>
        {eyebrow && <span className={`eyebrow ${light ? 'eyebrow-light' : ''}`}>{eyebrow}</span>}
        <Heading className={`section-title ${styles.title}`}>{title}</Heading>
        {text && <p className={styles.text}>{text}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
