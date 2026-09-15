import { STATUS_META } from '@/constants/status';

export default function StatusPill({ kind, value }) {
  const meta = STATUS_META[kind]?.[value] ?? { label: value, tone: 'neutral' };
  return <span className={`status-pill tone-${meta.tone}`}>{meta.label}</span>;
}
