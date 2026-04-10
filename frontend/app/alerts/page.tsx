'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCircle, Filter } from 'lucide-react';
import { fetchAlerts, resolveAlert } from '@/lib/api';
import { Alert } from '@/types';
import { severityStyle, formatDateTime } from '@/lib/utils';

const TYPE_LABELS: Record<string, string> = {
  cpu: 'CPU', memory: 'Mémoire', disk: 'Disque',
  temperature: 'Température', humidity: 'Humidité',
  node_down: 'Nœud hors ligne', network: 'Réseau',
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [meta, setMeta] = useState({ total: 0, active: 0, critical: 0 });
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const params = filter === 'active' ? { resolved: false } :
                   filter === 'resolved' ? { resolved: true } : {};
    const { alerts: a, meta: m } = await fetchAlerts(params);
    setAlerts(a);
    setMeta(m);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  async function handleResolve(id: string) {
    await resolveAlert(id);
    load();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: 'Total', value: meta.total, color: 'text-slate-800' },
          { label: 'Actives', value: meta.active, color: 'text-orange-500' },
          { label: 'Critiques', value: meta.critical, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-5 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
            <p className={`text-4xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filtre */}
      <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
        <Filter size={16} className="text-slate-400 ml-2" />
        {(['active', 'resolved', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === f
                ? 'bg-blue-50 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {{ active: 'Actives', resolved: 'Résolues', all: 'Toutes' }[f]}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="glass-card p-12 text-center border-dashed">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <p className="font-bold text-slate-600">Aucune alerte {filter === 'active' ? 'active' : filter === 'resolved' ? 'résolue' : ''}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const s = severityStyle(alert.severity);
            return (
              <div key={alert.id} className={`${s.bg} border ${s.border} rounded-xl p-5 flex items-start gap-4 shadow-sm transition-all hover:shadow-md`}>
                <span className={`w-3 h-3 rounded-full mt-1 shrink-0 shadow-sm ${s.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-black tracking-widest uppercase bg-white px-2 py-0.5 rounded-md border ${s.border} ${s.text}`}>{alert.severity}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                      {TYPE_LABELS[alert.type] ?? alert.type}
                    </span>
                    {alert.nodeId && <span className="text-[11px] font-medium text-slate-500">• {alert.nodeId}</span>}
                    {alert.sensorId && <span className="text-[11px] font-medium text-slate-500">• {alert.sensorId}</span>}
                  </div>
                  <p className="text-base font-bold text-slate-800 mb-2">{alert.message}</p>
                  <div className="flex items-center gap-6 mt-2 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1.5"><Bell size={12} className="text-slate-400" /> {formatDateTime(alert.timestamp)}</span>
                    <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-600">Valeur: <strong>{alert.value.toFixed(1)}</strong> / Seuil: <strong>{alert.threshold}</strong></span>
                    {alert.resolved && alert.resolvedAt && (
                      <span className="text-emerald-600 flex items-center gap-1.5 font-bold bg-emerald-50 px-2 py-1 rounded-md">
                        <CheckCircle size={14} /> Résolue à {formatDateTime(alert.resolvedAt)}
                      </span>
                    )}
                  </div>
                </div>
                {!alert.resolved && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    <CheckCircle size={14} /> Résoudre
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
