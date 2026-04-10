'use client';

import { useEffect, useState, useCallback } from 'react';
import { Server, Cpu, HardDrive, Wifi, Clock, RefreshCw, MemoryStick } from 'lucide-react';
import { fetchNodes } from '@/lib/api';
import { NodeMetrics } from '@/types';
import MetricCard from '@/components/shared/MetricCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatBytes, formatUptime } from '@/lib/utils';

export default function NodesPage() {
  const [nodes, setNodes] = useState<NodeMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NodeMetrics | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchNodes();
      setNodes(data);
      if (selected) setSelected(data.find((n) => n.id === selected.id) ?? null);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const activeNode = selected ?? nodes[0] ?? null;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Liste des nœuds */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {nodes.map((node) => (
          <button
            key={node.id}
            onClick={() => setSelected(node)}
            className={`glass-card p-5 text-left transition-all ${activeNode?.id === node.id
              ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-md transform -translate-y-0.5'
              : 'hover:border-blue-300 hover:shadow-sm'
              }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server size={18} className="text-blue-600" />
                <span className="font-bold text-slate-800">{node.name}</span>
              </div>
              <StatusBadge status={node.status} />
            </div>
            <p className="text-xs font-medium text-slate-500 mb-5">{node.host}</p>
            {/* Mini métriques */}
            <div className="space-y-3">
              {[
                { label: 'CPU', value: node.cpu, color: '#2563EB' },
                { label: 'RAM', value: node.memory.percent, color: '#0ea5e9' },
                { label: 'Disque', value: node.disk.percent, color: '#10B981' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 w-10 uppercase tracking-widest">{label}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full rounded-full transition-all duration-500 shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]" style={{ width: `${value}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 tabular-nums w-8 text-right">{value.toFixed(0)}%</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 mt-5 text-[10px] font-semibold text-slate-500">
              <Clock size={12} />
              <span>Uptime: {formatUptime(node.uptime)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Détail nœud sélectionné */}
      {activeNode && (
        <div className="glass-card p-6 border-t-4 border-t-blue-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
              <Server size={22} className="text-blue-600" />
              {activeNode.name}
            </h3>
            <StatusBadge status={activeNode.status} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
            <MetricCard label="CPU" value={activeNode.cpu.toFixed(1)} unit="%" percent={activeNode.cpu} icon={<Cpu size={16} />} />
            <MetricCard label="Mémoire" value={activeNode.memory.percent.toFixed(1)} unit="%" percent={activeNode.memory.percent} warnAt={80} criticalAt={95} icon={<MemoryStick size={16} />} />
            <MetricCard label="Disque (/)" value={activeNode.disk.percent.toFixed(1)} unit="%" percent={activeNode.disk.percent} warnAt={80} criticalAt={95} icon={<HardDrive size={16} />} />
            <MetricCard label="Uptime" value={formatUptime(activeNode.uptime)} icon={<Clock size={16} />} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">RAM utilisée</p>
              <p className="text-lg font-black text-slate-800">{formatBytes(activeNode.memory.used)}</p>
              <p className="text-[11px] font-medium text-slate-500">sur {formatBytes(activeNode.memory.total)}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Disque utilisé</p>
              <p className="text-lg font-black text-slate-800">{formatBytes(activeNode.disk.used)}</p>
              <p className="text-[11px] font-medium text-slate-500">sur {formatBytes(activeNode.disk.total)}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Wifi size={12} /> RX réseau</p>
              <p className="text-lg font-black text-slate-800">{formatBytes(activeNode.network.rxBytesPerSec)}<span className="text-xs text-slate-500 ml-1">/s</span></p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Wifi size={12} /> TX réseau</p>
              <p className="text-lg font-black text-slate-800">{formatBytes(activeNode.network.txBytesPerSec)}<span className="text-xs text-slate-500 ml-1">/s</span></p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100 text-[11px] font-medium text-slate-500">
            <span><strong>Hôte:</strong> {activeNode.host}</span>
            <span><strong>Dernière vue:</strong> {new Date(activeNode.lastSeen).toLocaleTimeString('fr-FR')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
