// Types partagés côté frontend — miroir des types backend

export interface NodeMetrics {
  id: string;
  name: string;
  host: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number;
  cpu: number;
  memory: { used: number; total: number; percent: number };
  disk: { used: number; total: number; percent: number };
  network: { rxBytesPerSec: number; txBytesPerSec: number };
  lastSeen: string;
}

export interface IoTSensor {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline';
  temperature: number;
  humidity: number;
  pressure?: number;
  lastSeen: string;
}

export interface Alert {
  id: string;
  type: 'cpu' | 'memory' | 'disk' | 'temperature' | 'humidity' | 'node_down' | 'network';
  severity: 'critical' | 'warning' | 'info';
  nodeId?: string;
  sensorId?: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface MetricPoint {
  timestamp: number;
  value: number;
}

export interface HistoryData {
  nodeId?: string;
  sensorId?: string;
  metric: string;
  range: '1h' | '24h' | '7d';
  points: MetricPoint[];
}

export interface ClusterHealth {
  totalNodes: number;
  onlineNodes: number;
  offlineNodes: number;
  avgCpu: number;
  avgMemory: number;
  avgDisk: number;
  activeAlerts: number;
  criticalAlerts: number;
  healthScore: number;
  avgTemperature: number;
  avgHumidity: number;
}

export interface TopologyNode {
  id: string;
  name: string;
  type: 'proxmox' | 'iot_gateway' | 'monitoring' | 'switch';
  status: 'online' | 'offline' | 'degraded';
  ip: string;
  position: { x: number; y: number };
  connections: string[];
}

export interface TopologyLink {
  source: string;
  target: string;
}

export type TimeRange = '1h' | '24h' | '7d';
