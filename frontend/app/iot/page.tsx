'use client';

import { useEffect, useState, useCallback } from 'react';
import { Thermometer, Droplets, Gauge } from 'lucide-react';
import { fetchSensors } from '@/lib/api';
import { IoTSensor } from '@/types';
import StatusBadge from '@/components/shared/StatusBadge';

function TempRing({ value, max = 50 }: { value: number; max?: number }) {
  const pct = Math.min(value / max, 1);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const color = value >= 35 ? '#ef4444' : value >= 28 ? '#f97316' : '#10b981';

  return (
    <svg width="90" height="90" className="rotate-[-90deg]">
      <circle cx="45" cy="45" r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
      <circle
        cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

export default function IoTPage() {
  const [sensors, setSensors] = useState<IoTSensor[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setSensors(await fetchSensors()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const avgTemp = sensors.reduce((s, n) => s + n.temperature, 0) / (sensors.length || 1);
  const avgHum  = sensors.reduce((s, n) => s + n.humidity, 0)    / (sensors.length || 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Résumé global */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="glass-card p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Capteurs actifs</p>
          <p className="text-3xl font-black text-emerald-500">{sensors.filter(s => s.status === 'online').length}<span className="text-sm font-semibold text-slate-400">/{sensors.length}</span></p>
        </div>
        <div className="glass-card p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Temp. moy.</p>
          <p className={`text-3xl font-black tabular-nums ${avgTemp >= 35 ? 'text-red-500' : avgTemp >= 28 ? 'text-orange-500' : 'text-emerald-500'}`}>{avgTemp.toFixed(1)}°C</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Hum. moy.</p>
          <p className="text-3xl font-black tabular-nums text-cyan-600">{avgHum.toFixed(1)}%</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pression moy.</p>
          <p className="text-3xl font-black tabular-nums text-blue-600">
            {sensors.find(s => s.pressure)?.pressure?.toFixed(0) ?? '–'} <span className="text-sm font-semibold text-slate-400">hPa</span>
          </p>
        </div>
      </div>

      {/* Cartes détaillées des capteurs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sensors.map((sensor) => (
          <div key={sensor.id} className="glass-card p-6 flex flex-col">
            {/* En-tête */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 text-lg">{sensor.name}</h3>
              <StatusBadge status={sensor.status} />
            </div>
            <p className="text-xs font-medium text-slate-500 mb-6">{sensor.location}</p>

            {/* Anneau température */}
            <div className="flex items-center gap-6 mb-4">
              <div className="relative shrink-0 drop-shadow-sm">
                <TempRing value={sensor.temperature} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xl font-black tabular-nums tracking-tighter ${sensor.temperature >= 35 ? 'text-red-600' : sensor.temperature >= 28 ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {sensor.temperature.toFixed(1)}°
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                {/* Humidité */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Droplets size={12} className="text-cyan-600" /> Humidité</span>
                    <span className="text-xs font-black text-cyan-700">{sensor.humidity.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-cyan-500 rounded-full shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]" style={{ width: `${sensor.humidity}%` }} />
                  </div>
                </div>

                {/* Pression (si dispo) */}
                {sensor.pressure && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Gauge size={12} className="text-blue-600" /> Pression</span>
                      <span className="text-xs font-black text-blue-700">{sensor.pressure.toFixed(0)} hPa</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-blue-500 rounded-full shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]" style={{ width: `${((sensor.pressure - 980) / 60) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Seuils */}
            <div className="mt-auto pt-5 border-t border-slate-100 grid grid-cols-2 gap-3 text-[10px] font-medium text-slate-500">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Temp &gt; 28°C</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Temp &gt; 35°C</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Hum &lt; 30%</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> Hum &gt; 70%</span>
            </div>

            <p className="text-[10px] font-medium text-slate-400 mt-4 text-center">
              Dernier relevé à {new Date(sensor.lastSeen).toLocaleTimeString('fr-FR')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
