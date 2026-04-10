'use client';

import { useEffect, useState, useCallback } from 'react';
import { Network, Server, Cpu, Thermometer, Wifi, Monitor } from 'lucide-react';
import { fetchTopology, fetchNodes, fetchSensors } from '@/lib/api';
import { TopologyNode, TopologyLink, NodeMetrics, IoTSensor } from '@/types';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  proxmox:     <Server size={16} />,
  monitoring:  <Monitor size={16} />,
  iot_gateway: <Thermometer size={16} />,
  switch:      <Network size={16} />,
};

const TYPE_COLORS: Record<string, string> = {
  proxmox:     '#2563EB',
  monitoring:  '#10B981',
  iot_gateway: '#06B6D4',
  switch:      '#8B5CF6',
};

const STATUS_GLOW: Record<string, string> = {
  online:   'rgba(16,185,129,0.2)',
  offline:  'rgba(239,68,68,0.2)',
  degraded: 'rgba(249,115,22,0.2)',
};

interface NodeWithMetrics extends TopologyNode {
  cpu?: number;
  memory?: number;
}

export default function TopologyPage() {
  const [topoNodes, setTopoNodes] = useState<NodeWithMetrics[]>([]);
  const [links, setLinks] = useState<TopologyLink[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [topo, nodes] = await Promise.all([fetchTopology(), fetchNodes()]);
    const nodesMap: Record<string, NodeMetrics> = {};
    nodes.forEach((n) => { nodesMap[n.id] = n; });

    // Fusionne les métriques réelles dans la topologie
    const enriched: NodeWithMetrics[] = topo.nodes.map((tn) => {
      const found = nodesMap[tn.id];
      return {
        ...tn,
        // Écrase le statut avec les données live si dispo
        status: (found?.status ?? tn.status) as 'online' | 'offline' | 'degraded',
        cpu: found?.cpu,
        memory: found?.memory.percent,
      };
    });

    setTopoNodes(enriched);
    setLinks(topo.links);
    setLoading(false);
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Taille du canvas SVG
  const W = 800;
  const H = 420;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">Topologie du Réseau</h2>
          <p className="text-xs font-medium text-slate-500 mt-1">Vue logique du réseau — positions des équipements et connexions en temps réel.</p>
        </div>
      </div>

      <div className="glass-card p-6 overflow-auto border-4 border-slate-50">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="min-w-[600px]">
          {/* Lignes de connexion */}
          {links.map(({ source, target }) => {
            const s = topoNodes.find((n) => n.id === source);
            const t = topoNodes.find((n) => n.id === target);
            if (!s || !t) return null;
            const sx = (s.position.x / 100) * W;
            const sy = (s.position.y / 100) * H;
            const tx = (t.position.x / 100) * W;
            const ty = (t.position.y / 100) * H;
            return (
              <line
                key={`${source}-${target}`}
                x1={sx} y1={sy} x2={tx} y2={ty}
                stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 4"
              />
            );
          })}

          {/* Nœuds */}
          {topoNodes.map((node) => {
            const x = (node.position.x / 100) * W;
            const y = (node.position.y / 100) * H;
            const color = TYPE_COLORS[node.type] ?? '#94A3B8';
            const glow = STATUS_GLOW[node.status] ?? 'transparent';
            const isHov = hovered === node.id;

            return (
              <g key={node.id} transform={`translate(${x},${y})`}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer group">
                {/* Glow */}
                <circle r={isHov ? 42 : 36} fill={glow} opacity={0.6} className="transition-all duration-300 pointer-events-none" />
                
                {/* Cercle principal recouvert de blanc */}
                <circle r={24} fill="#ffffff" stroke={color} strokeWidth={isHov ? 3 : 2} className="transition-all duration-200 shadow-md" />
                
                {/* Status dot */}
                <circle cx={15} cy={-15} r={6} fill={node.status === 'online' ? '#10b981' : node.status === 'degraded' ? '#f97316' : '#ef4444'} stroke="#ffffff" strokeWidth="2" />

                {/* Label */}
                <text y={38} textAnchor="middle" fill="#334155" fontSize="10" fontWeight="bold">
                  {node.name}
                </text>
                <text y={48} textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="500">
                  {node.ip}
                </text>

                {/* Métriques si dispo */}
                {node.cpu !== undefined && (
                  <text y={60} textAnchor="middle" fill={node.cpu > 90 ? '#ef4444' : '#475569'} fontSize="9" fontWeight="bold">
                    CPU {node.cpu.toFixed(0)}%
                  </text>
                )}

                {/* Tooltip au survol */}
                {isHov && (
                  <g className="pointer-events-none">
                    <rect x={-65} y={-85} width={130} height={50} rx={8} fill="#ffffff" stroke={color} strokeWidth={2} opacity={0.98} filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.1))" />
                    <text x={0} y={-66} textAnchor="middle" fill={color} fontSize="11" fontWeight="bold">{node.type}</text>
                    {node.cpu !== undefined && (
                      <text x={0} y={-48} textAnchor="middle" fill="#475569" fontSize="10" fontWeight="500">
                        CPU {node.cpu.toFixed(1)}% · RAM {node.memory?.toFixed(1)}%
                      </text>
                    )}
                    {node.cpu === undefined && (
                      <text x={0} y={-48} textAnchor="middle" fill="#475569" fontSize="10" fontWeight="500">{node.status}</text>
                    )}
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-5 text-sm font-bold text-slate-500 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex gap-5 border-r border-slate-200 pr-5">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="capitalize">{type.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-5">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500" /> En ligne</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500" /> Dégradé</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500" /> Hors ligne</div>
        </div>
      </div>
    </div>
  );
}
