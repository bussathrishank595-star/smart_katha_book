import { getStatusInfo } from '../../utils/dateHelpers';

export default function StatusBadge({ status }) {
  const { label, badge, dot } = getStatusInfo(status);
  return (
    <span className={badge}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
