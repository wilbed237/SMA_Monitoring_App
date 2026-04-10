// Types partagés entre le backend et le frontend Atlas

export interface NodeMetrics {
  id: string;
  name: string;         // ex: "pve-node-1"
  host: string;         // ex: "192.168.1.10:9100"
  status: 'online' | 'offline' | 'degraded';
  uptime: number;       // secondes
  cpu: number;          // % 0-100
  memory: {
    used: number;       // bytes
    total: number;      // bytes
    percent: number;    // % 0-100
  };
  disk: {
    used: number;
    total: number;
    percent: number;
  };
  network: {
    rxBytesPerSec: number;
    txBytesPerSec: number;
  };
  lastSeen: string;     // ISO date
}

export interface IoTSensor {
  id: string;
  name: string;           // ex: "capteur-salle-1"
  location: string;       // ex: "Rack A"
  status: 'online' | 'offline';
  temperature: number;    // °C
  humidity: number;       // %
  pressure?: number;      // hPa
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
  timestamp: number;  // Unix timestamp ms
  value: number;
}

export interface HistoryData {
  nodeId: string;
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
  healthScore: number;   // 0-100
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
  connections: string[];  // ids des nœuds connectés
}

export interface PrometheusQueryResult {
  status: string;
  data: {
    resultType: string;
    result: Array<{
      metric: Record<string, string>;
      value?: [number, string];
      values?: Array<[number, string]>;
    }>;
  };
}

export interface AlertThresholds {
  cpuWarning: number;     // default 75
  cpuCritical: number;    // default 90
  memoryWarning: number;  // default 80
  memoryCritical: number; // default 95
  diskWarning: number;    // default 80
  diskCritical: number;   // default 95
  tempWarning: number;    // default 28
  tempCritical: number;   // default 35
  humidityMin: number;    // default 30
  humidityMax: number;    // default 70
}
