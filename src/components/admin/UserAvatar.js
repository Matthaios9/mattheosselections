import { initial } from '@/utils/format';

/** Round initial badge for a person (users list, user detail). */
export default function UserAvatar({ name, size = '2.4rem' }) {
  return (
    <span
      className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0 font-serif"
      style={{ width: size, height: size, background: 'var(--ms-sand)', color: 'var(--ms-honey-deep)', fontSize: '1.1rem' }}
      aria-hidden="true"
    >
      {initial(name)}
    </span>
  );
}
