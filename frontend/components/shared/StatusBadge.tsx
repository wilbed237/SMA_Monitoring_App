import { statusClass } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'degraded';
  showDot?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  online:   'En ligne',
  offline:  'Hors ligne',
  degraded: 'Dégradé',
};

export default function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] border tracking-wide font-bold uppercase ${statusClass(status)}`}>
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          status === 'online' ? 'bg-emerald-500 pulse-dot' :
          status === 'offline' ? 'bg-red-500' : 'bg-orange-500'
        }`} />
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}
