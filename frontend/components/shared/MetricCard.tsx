import { gaugeColor, percentColor } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: number | string;
  unit?: string;
  percent?: number;   // si fourni, affiche une barre de progression
  warnAt?: number;
  criticalAt?: number;
  icon?: React.ReactNode;
  subtitle?: string;
}

export default function MetricCard({
  label, value, unit, percent, warnAt = 75, criticalAt = 90, icon, subtitle,
}: MetricCardProps) {
  const barColor = percent !== undefined ? gaugeColor(percent, warnAt, criticalAt) : '#2563EB'; // blue-600
  const textColor = typeof value === 'number' && typeof percent === 'number'
    ? percentColor(percent, warnAt, criticalAt)
    : 'text-slate-800';

  return (
    <div className="glass-card p-5 flex flex-col gap-3">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</span>
        {icon && <span className="text-blue-600 bg-blue-100/50 p-1.5 rounded-md">{icon}</span>}
      </div>

      {/* Valeur principale */}
      <div className="flex items-baseline gap-1 mt-1">
        <span className={`text-3xl font-bold tabular-nums tracking-tight ${textColor}`}>{value}</span>
        {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
      </div>

      {/* Barre de progression */}
      {percent !== undefined && (
        <div className="space-y-1.5 mt-2">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-500 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]"
              style={{ width: `${Math.min(100, percent)}%`, backgroundColor: barColor }}
            />
          </div>
          <div className="flex justify-end">
            <span className="text-[10px] font-semibold text-slate-400">{percent.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {subtitle && <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>}
    </div>
  );
}
