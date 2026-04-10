'use client';

import { useEffect, useState, useCallback } from 'react';
import { Server, Thermometer, Bell, Activity, Cpu, MemoryStick, HardDrive, Wifi } from 'lucide-react';
import { fetchNodes, fetchSensors, fetchAlerts, fetchClusterHealth } from '@/lib/api';
import { NodeMetrics, IoTSensor, Alert, ClusterHealth } from '@/types';
import MetricCard from '@/components/shared/MetricCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatBytes, formatUptime, formatDateTime, severityStyle } from '@/lib/utils';
import Link from 'next/link';

const REFRESH_MS = parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL || '15000');

export default function DashboardPage() {
  const [nodes, setNodes] = useState<NodeMetrics[]>([]);
  const [sensors, setSensors] = useState<IoTSensor[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [health, setHealth] = useState<ClusterHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const [n, s, a, h] = await Promise.all([
        fetchNodes(), fetchSensors(),
        fetchAlerts({ resolved: false }),
        fetchClusterHealth(),
      ]);
      setNodes(n);
      setSensors(s);
      setAlerts(a.alerts.slice(0, 5));
      setHealth(h);
      setLastUpdate(new Date());
    } catch (e) {
      console.error('[Dashboard] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500">Chargement des métriques…</p>
        </div>
      </div>
    );
  }

  const healthScore = health?.healthScore ?? 0;
  const healthColor = healthScore >= 80 ? 'text-emerald-500' : healthScore >= 60 ? 'text-orange-500' : 'text-red-500';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── En-tête ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white px-4 md:px-6 py-4 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-200">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Vue d'ensemble du cluster</h2>
          {lastUpdate && (
            <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}
            </p>
          )}
        </div>
        {/* Score de santé global */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 px-5 py-3 rounded-xl shadow-sm">
          <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
            <Activity size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Santé globale</p>
            <p className={`text-3xl font-black tabular-nums tracking-tighter ${healthColor}`}>{healthScore}<span className="text-sm font-semibold text-slate-400">/100</span></p>
          </div>
        </div>
      </div>

      {/* ── Métriques cluster ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <MetricCard
          label="Nœuds en ligne"
          value={`${health?.onlineNodes ?? '–'}/${health?.totalNodes ?? '–'}`}
          icon={<Server size={18} />}
          subtitle={health?.offlineNodes ? `${health.offlineNodes} hors ligne` : 'Tous opérationnels'}
        />
        <MetricCard
          label="CPU moyen"
          value={health?.avgCpu?.toFixed(1) ?? '–'}
          unit="%"
          percent={health?.avgCpu}
          icon={<Cpu size={18} />}
        />
        <MetricCard
          label="Mémoire moyenne"
          value={health?.avgMemory?.toFixed(1) ?? '–'}
          unit="%"
          percent={health?.avgMemory}
          warnAt={80}
          criticalAt={95}
          icon={<MemoryStick size={18} />}
        />
        <MetricCard
          label="Alertes actives"
          value={health?.activeAlerts ?? 0}
          icon={<Bell size={18} />}
          subtitle={health?.criticalAlerts ? `${health.criticalAlerts} critiques` : 'Aucune critique'}
        />
      </div>

      {/* ── Environnement IoT ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
        <MetricCard
          label="Température moyenne salle"
          value={health?.avgTemperature?.toFixed(1) ?? '–'}
          unit="°C"
          icon={<Thermometer size={18} />}
          percent={health?.avgTemperature ? (health.avgTemperature / 50) * 100 : undefined}
          warnAt={56}
          criticalAt={70}
        />
        <MetricCard
          label="Humidité moyenne salle"
          value={health?.avgHumidity?.toFixed(1) ?? '–'}
          unit="%"
          icon={<Wifi size={18} />}
          percent={health?.avgHumidity}
          warnAt={70}
          criticalAt={85}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── État des nœuds ──────────────────────────── */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              <Server size={18} className="text-blue-600" /> Nœuds
            </h3>
            <Link href="/nodes" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">Voir tout &rarr;</Link>
          </div>
          <div className="flex-1 space-y-4">
            {nodes.map((node) => (
              <div key={node.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors rounded-lg px-2 -mx-2 gap-3 sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${node.status === 'online' ? 'bg-emerald-500' : node.status === 'degraded' ? 'bg-orange-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-sm font-bold text-slate-800 cursor-pointer hover:text-blue-600 transition-colors">{node.name}</p>
                    <p className="text-[10px] font-medium text-slate-500">Uptime: {formatUptime(node.uptime)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-5 text-xs text-slate-500 font-medium tracking-wide">
                  <div className="flex gap-3">
                    <span>CPU <span className="text-slate-800 font-bold ml-1">{node.cpu.toFixed(0)}%</span></span>
                    <span>RAM <span className="text-slate-800 font-bold ml-1">{node.memory.percent.toFixed(0)}%</span></span>
                  </div>
                  <StatusBadge status={node.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Alertes récentes ─────────────────────────── */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              <Bell size={18} className="text-orange-500" /> Alertes récentes
            </h3>
            <Link href="/alerts" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">Voir tout &rarr;</Link>
          </div>
          <div className="flex-1 space-y-3">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">✓</span>
                <p className="text-sm font-bold text-slate-600">Aucune alerte active</p>
              </div>
            ) : alerts.map((alert) => {
              const s = severityStyle(alert.severity);
              return (
                <div key={alert.id} className={`${s.bg} border ${s.border} rounded-xl px-4 py-3 flex items-start gap-3 shadow-sm`}>
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${s.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 leading-snug">{alert.message}</p>
                    <p className="text-[11px] font-medium text-slate-500 mt-1">{formatDateTime(alert.timestamp)}</p>
                  </div>
                  <span className={`text-[10px] bg-white font-bold uppercase tracking-widest ${s.text} shrink-0 px-2.5 py-1 rounded-md border ${s.border}`}>{alert.severity}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Capteurs IoT compacts ─────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <Thermometer size={18} className="text-cyan-600" /> Capteurs IoT
          </h3>
          <Link href="/iot" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">Voir tout &rarr;</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {sensors.map((sensor) => (
            <div key={sensor.id} className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-slate-800 cursor-pointer hover:text-blue-600">{sensor.name}</p>
                <span className={`w-2 h-2 rounded-full ${sensor.status === 'online' ? 'bg-emerald-500 pulse-dot' : 'bg-red-500'}`} />
              </div>
              <p className="text-xs font-medium text-slate-500 mb-4">{sensor.location}</p>
              <div className="flex gap-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Temp.</p>
                  <p className={`text-xl font-black tabular-nums tracking-tight ${sensor.temperature >= 35 ? 'text-red-600' : sensor.temperature >= 28 ? 'text-orange-500' : 'text-emerald-600'}`}>
                    {sensor.temperature.toFixed(1)}°
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Hum.</p>
                  <p className="text-xl font-black tabular-nums tracking-tight text-cyan-600">{sensor.humidity.toFixed(1)}%</p>
                </div>
                {sensor.pressure && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pres.</p>
                    <p className="text-xl font-black tabular-nums tracking-tight text-blue-600">{sensor.pressure.toFixed(0)}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
