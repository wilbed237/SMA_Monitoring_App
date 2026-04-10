'use client';

import { useEffect, useState, useCallback } from 'react';
import { BarChart2 } from 'lucide-react';
import { fetchNodeHistory, fetchSensorHistory } from '@/lib/api';
import { HistoryData, TimeRange } from '@/types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const NODES = [
  { id: 'pve-node-1', name: 'PVE-Node-1' },
  { id: 'pve-node-2', name: 'PVE-Node-2' },
  { id: 'pve-node-3', name: 'PVE-Node-3' },
];
const SENSORS = [
  { id: 'dht22-1', name: 'Capteur Rack A' },
  { id: 'dht22-2', name: 'Capteur Rack B' },
  { id: 'dht22-3', name: 'Capteur Entrée' },
];
const NODE_METRICS = ['cpu', 'memory', 'disk', 'network_rx', 'network_tx'];
const SENSOR_METRICS = ['temperature', 'humidity', 'pressure'];
const RANGES: TimeRange[] = ['1h', '24h', '7d'];
const LINE_COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f97316', '#8b5cf6'];

function formatX(ts: number, range: TimeRange) {
  const d = new Date(ts);
  if (range === '1h') return format(d, 'HH:mm', { locale: fr });
  if (range === '24h') return format(d, 'HH:mm', { locale: fr });
  return format(d, 'dd/MM', { locale: fr });
}

export default function HistoryPage() {
  const [mode, setMode] = useState<'node' | 'sensor'>('node');
  const [selectedIds, setSelectedIds] = useState<string[]>(['pve-node-1']);
  const [metric, setMetric] = useState('cpu');
  const [range, setRange] = useState<TimeRange>('1h');
  const [histories, setHistories] = useState<Record<string, HistoryData>>({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const entries = await Promise.all(
      selectedIds.map(async (id) => {
        const data = mode === 'node'
          ? await fetchNodeHistory(id, metric, range)
          : await fetchSensorHistory(id, metric, range);
        return [id, data] as [string, HistoryData];
      })
    );
    setHistories(Object.fromEntries(entries));
    setLoading(false);
  }, [selectedIds, metric, range, mode]);

  useEffect(() => { load(); }, [load]);

  // Fusionne les séries pour Recharts
  const chartData: Record<string, number | string>[] = [];
  const allTimestamps = new Set<number>();
  Object.values(histories).forEach((h) => h.points.forEach((p) => allTimestamps.add(p.timestamp)));
  const sorted = [...allTimestamps].sort();

  sorted.forEach((ts) => {
    const row: Record<string, number | string> = { ts, label: formatX(ts, range) };
    Object.entries(histories).forEach(([id, h]) => {
      const p = h.points.find((pt) => Math.abs(pt.timestamp - ts) < 60000);
      if (p) row[id] = parseFloat(p.value.toFixed(2));
    });
    chartData.push(row);
  });

  const items = mode === 'node' ? NODES : SENSORS;
  const metrics = mode === 'node' ? NODE_METRICS : SENSOR_METRICS;

  function toggleId(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="glass-card p-6 border-t-4 border-blue-500 shadow-sm">
        <div className="flex flex-wrap items-center gap-5 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          {/* Mode */}
          <div className="flex gap-1.5 bg-slate-200 rounded-lg p-1.5 shadow-inner">
            {(['node', 'sensor'] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setSelectedIds([items[0].id]); setMetric(metrics[0]); }}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${mode === m ? 'bg-white text-blue-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}>
                {m === 'node' ? 'Nœuds' : 'Capteurs'}
              </button>
            ))}
          </div>

          {/* Sélection des items */}
          <div className="flex flex-wrap gap-2">
            {items.map(({ id, name }, i) => (
              <button key={id} onClick={() => toggleId(id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border-2 transition-all ${
                  selectedIds.includes(id)
                    ? `shadow-sm`
                    : 'border-slate-200 text-slate-500 bg-white hover:border-slate-300'
                }`}
                style={selectedIds.includes(id) ? { backgroundColor: LINE_COLORS[i % LINE_COLORS.length] + '15', borderColor: LINE_COLORS[i % LINE_COLORS.length], color: LINE_COLORS[i % LINE_COLORS.length] } : {}}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Métrique */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Métrique</span>
            <select value={metric} onChange={(e) => setMetric(e.target.value)}
              className="bg-white border-2 border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm cursor-pointer transition-colors">
              {metrics.map((m) => <option key={m} value={m} className="font-medium">{m}</option>)}
            </select>
          </div>

          {/* Plage */}
          <div className="flex gap-1.5 bg-slate-200 rounded-lg p-1.5 shadow-inner">
            {RANGES.map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${range === r ? 'bg-white text-blue-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Graphique */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
          {loading ? (
            <div className="flex justify-center items-center h-80">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex justify-center items-center h-80 text-slate-400 font-medium">Aucune donnée disponible pour cette sélection</div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={10} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={10} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#0f172a', fontSize: 13, fontWeight: 'bold', marginBottom: '8px' }}
                  itemStyle={{ fontSize: 12, fontWeight: 600, padding: '2px 0' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, color: '#475569', paddingTop: '20px' }} />
                {selectedIds.map((id, i) => (
                  <Line key={id} type="monotone" dataKey={id}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: LINE_COLORS[i % LINE_COLORS.length] }}
                    name={items.find((x) => x.id === id)?.name ?? id}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
