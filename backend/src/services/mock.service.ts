import { NodeMetrics, IoTSensor, Alert, ClusterHealth, HistoryData, MetricPoint } from '../types';

/**
 * Données simulées pour la démonstration sans Prometheus.
 * Utilise des valeurs légèrement randomisées pour simuler des métriques vivantes.
 */

function rand(min: number, max: number, decimals = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

export const MOCK_NODES: NodeMetrics[] = [
  {
    id: 'pve-node-1',
    name: 'PVE-Node-1',
    host: '192.168.1.10:9100',
    status: 'online',
    uptime: 432000,    // 5 jours
    cpu: rand(20, 65),
    memory: { used: 1.2e9, total: 2e9, percent: rand(55, 75) },
    disk: { used: 18e9, total: 32e9, percent: rand(50, 65) },
    network: { rxBytesPerSec: rand(100, 5000, 0), txBytesPerSec: rand(50, 2000, 0) },
    lastSeen: new Date().toISOString(),
  },
  {
    id: 'pve-node-2',
    name: 'PVE-Node-2',
    host: '192.168.1.11:9100',
    status: 'online',
    uptime: 259200,    // 3 jours
    cpu: rand(30, 80),
    memory: { used: 1.5e9, total: 2e9, percent: rand(70, 85) },
    disk: { used: 22e9, total: 32e9, percent: rand(65, 75) },
    network: { rxBytesPerSec: rand(200, 8000, 0), txBytesPerSec: rand(100, 4000, 0) },
    lastSeen: new Date().toISOString(),
  },
  {
    id: 'pve-node-3',
    name: 'PVE-Node-3',
    host: '192.168.1.12:9100',
    status: 'degraded',
    uptime: 86400,     // 1 jour
    cpu: rand(60, 92),
    memory: { used: 1.8e9, total: 2e9, percent: rand(85, 96) },
    disk: { used: 28e9, total: 32e9, percent: rand(82, 90) },
    network: { rxBytesPerSec: rand(50, 1000, 0), txBytesPerSec: rand(20, 500, 0) },
    lastSeen: new Date(Date.now() - 120000).toISOString(),
  },
];

export const MOCK_SENSORS: IoTSensor[] = [
  {
    id: 'dht22-1',
    name: 'Capteur Rack A',
    location: 'Rack A — Haut',
    status: 'online',
    temperature: rand(23, 29),
    humidity: rand(45, 62),
    pressure: rand(1008, 1015),
    lastSeen: new Date().toISOString(),
  },
  {
    id: 'dht22-2',
    name: 'Capteur Rack B',
    location: 'Rack B — Milieu',
    status: 'online',
    temperature: rand(26, 33),
    humidity: rand(50, 68),
    lastSeen: new Date().toISOString(),
  },
  {
    id: 'dht22-3',
    name: 'Capteur Entrée Salle',
    location: 'Entrée salle serveurs',
    status: 'online',
    temperature: rand(20, 24),
    humidity: rand(40, 55),
    pressure: rand(1009, 1016),
    lastSeen: new Date().toISOString(),
  },
];

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'alert-1',
    type: 'memory',
    severity: 'critical',
    nodeId: 'pve-node-3',
    message: 'Mémoire critique sur PVE-Node-3 : 91% utilisé',
    value: 91,
    threshold: 90,
    timestamp: new Date(Date.now() - 300000).toISOString(),
    resolved: false,
  },
  {
    id: 'alert-2',
    type: 'temperature',
    severity: 'warning',
    sensorId: 'dht22-2',
    message: 'Température élevée sur Capteur Rack B : 31°C',
    value: 31,
    threshold: 28,
    timestamp: new Date(Date.now() - 900000).toISOString(),
    resolved: false,
  },
  {
    id: 'alert-3',
    type: 'cpu',
    severity: 'warning',
    nodeId: 'pve-node-3',
    message: 'Surcharge CPU sur PVE-Node-3 : 87%',
    value: 87,
    threshold: 75,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    resolved: false,
  },
  {
    id: 'alert-4',
    type: 'disk',
    severity: 'info',
    nodeId: 'pve-node-2',
    message: 'Disque à 72% sur PVE-Node-2',
    value: 72,
    threshold: 70,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    resolved: true,
    resolvedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

/** Génère des points d'historique simulés */
export function generateMockHistory(
  nodeId: string,
  metric: string,
  rangeLabel: '1h' | '24h' | '7d',
  baseValue: number,
  variance: number
): HistoryData {
  const rangeMs = rangeLabel === '1h' ? 3600000 : rangeLabel === '24h' ? 86400000 : 604800000;
  const step = rangeMs / 50; // 50 points par série
  const now = Date.now();
  const points: MetricPoint[] = [];

  for (let i = 50; i >= 0; i--) {
    points.push({
      timestamp: now - i * step,
      value: parseFloat((baseValue + (Math.random() - 0.5) * variance * 2).toFixed(2)),
    });
  }
  return { nodeId, metric, range: rangeLabel, points };
}

export function getMockClusterHealth(): ClusterHealth {
  const online = MOCK_NODES.filter((n) => n.status === 'online').length;
  const offline = MOCK_NODES.filter((n) => n.status === 'offline').length;
  const activeAlerts = MOCK_ALERTS.filter((a) => !a.resolved).length;
  const criticalAlerts = MOCK_ALERTS.filter((a) => !a.resolved && a.severity === 'critical').length;

  const avgCpu = MOCK_NODES.reduce((s, n) => s + n.cpu, 0) / MOCK_NODES.length;
  const avgMem = MOCK_NODES.reduce((s, n) => s + n.memory.percent, 0) / MOCK_NODES.length;
  const avgDisk = MOCK_NODES.reduce((s, n) => s + n.disk.percent, 0) / MOCK_NODES.length;
  const avgTemp = MOCK_SENSORS.reduce((s, n) => s + n.temperature, 0) / MOCK_SENSORS.length;
  const avgHum = MOCK_SENSORS.reduce((s, n) => s + n.humidity, 0) / MOCK_SENSORS.length;

  // Score de santé : pénalités sur les ressources et alertes
  let score = 100;
  score -= offline * 20;
  score -= criticalAlerts * 10;
  score -= activeAlerts * 3;
  if (avgCpu > 85) score -= 10;
  if (avgMem > 90) score -= 10;
  if (avgDisk > 85) score -= 5;

  return {
    totalNodes: MOCK_NODES.length,
    onlineNodes: online,
    offlineNodes: offline,
    avgCpu: parseFloat(avgCpu.toFixed(1)),
    avgMemory: parseFloat(avgMem.toFixed(1)),
    avgDisk: parseFloat(avgDisk.toFixed(1)),
    activeAlerts,
    criticalAlerts,
    healthScore: Math.max(0, Math.min(100, score)),
    avgTemperature: parseFloat(avgTemp.toFixed(1)),
    avgHumidity: parseFloat(avgHum.toFixed(1)),
  };
}
