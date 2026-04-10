import axios from 'axios';
import { PrometheusQueryResult, NodeMetrics, IoTSensor, MetricPoint } from '../types';

/**
 * Service d'accès à l'API Prometheus.
 * Encapsule toutes les requêtes PromQL utilisées par Atlas.
 */
export class PrometheusService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Supprime le slash final
  }

  /** Requête instantanée (valeur courante) */
  async query(promql: string): Promise<PrometheusQueryResult> {
    const res = await axios.get(`${this.baseUrl}/api/v1/query`, {
      params: { query: promql },
      timeout: 5000,
    });
    return res.data;
  }

  /** Requête sur une plage temporelle (pour les graphiques) */
  async queryRange(
    promql: string,
    start: number,
    end: number,
    step: string
  ): Promise<PrometheusQueryResult> {
    const res = await axios.get(`${this.baseUrl}/api/v1/query_range`, {
      params: { query: promql, start, end, step },
      timeout: 8000,
    });
    return res.data;
  }

  /** Retourne la liste des instances qui scrappent le job "node" */
  async getNodeInstances(): Promise<string[]> {
    const result = await this.query('up{job="node"}');
    return result.data.result.map((r) => r.metric['instance'] ?? '');
  }

  /** CPU usage par instance (%) */
  async getCpuUsage(instance: string): Promise<number> {
    const q = `100 - (avg(irate(node_cpu_seconds_total{mode="idle",instance="${instance}"}[5m])) * 100)`;
    const result = await this.query(q);
    const val = result.data.result[0]?.value?.[1];
    return val ? parseFloat(val) : 0;
  }

  /** RAM usage par instance (%) */
  async getMemoryUsage(instance: string): Promise<{ used: number; total: number; percent: number }> {
    const [usedRes, totalRes] = await Promise.all([
      this.query(`node_memory_MemTotal_bytes{instance="${instance}"} - node_memory_MemAvailable_bytes{instance="${instance}"}`),
      this.query(`node_memory_MemTotal_bytes{instance="${instance}"}`),
    ]);
    const used = parseFloat(usedRes.data.result[0]?.value?.[1] ?? '0');
    const total = parseFloat(totalRes.data.result[0]?.value?.[1] ?? '0');
    return { used, total, percent: total > 0 ? (used / total) * 100 : 0 };
  }

  /** Disk usage root partition (%) */
  async getDiskUsage(instance: string): Promise<{ used: number; total: number; percent: number }> {
    const [sizeRes, availRes] = await Promise.all([
      this.query(`node_filesystem_size_bytes{instance="${instance}",mountpoint="/",fstype!="tmpfs"}`),
      this.query(`node_filesystem_avail_bytes{instance="${instance}",mountpoint="/",fstype!="tmpfs"}`),
    ]);
    const total = parseFloat(sizeRes.data.result[0]?.value?.[1] ?? '0');
    const avail = parseFloat(availRes.data.result[0]?.value?.[1] ?? '0');
    const used = total - avail;
    return { used, total, percent: total > 0 ? (used / total) * 100 : 0 };
  }

  /** Trafic réseau (bytes/s) */
  async getNetworkUsage(instance: string): Promise<{ rxBytesPerSec: number; txBytesPerSec: number }> {
    const [rxRes, txRes] = await Promise.all([
      this.query(`sum(irate(node_network_receive_bytes_total{instance="${instance}",device!="lo"}[5m]))`),
      this.query(`sum(irate(node_network_transmit_bytes_total{instance="${instance}",device!="lo"}[5m]))`),
    ]);
    return {
      rxBytesPerSec: parseFloat(rxRes.data.result[0]?.value?.[1] ?? '0'),
      txBytesPerSec: parseFloat(txRes.data.result[0]?.value?.[1] ?? '0'),
    };
  }

  /** Uptime du nœud (secondes) */
  async getUptime(instance: string): Promise<number> {
    const result = await this.query(`node_time_seconds{instance="${instance}"} - node_boot_time_seconds{instance="${instance}"}`);
    return parseFloat(result.data.result[0]?.value?.[1] ?? '0');
  }

  /** Vérifie si un nœud est en ligne */
  async isNodeUp(instance: string): Promise<boolean> {
    const result = await this.query(`up{instance="${instance}"}`);
    return result.data.result[0]?.value?.[1] === '1';
  }

  /** Température IoT via custom exporter */
  async getIoTTemperature(sensor: string): Promise<number> {
    const result = await this.query(`iot_temperature_celsius{sensor="${sensor}"}`);
    return parseFloat(result.data.result[0]?.value?.[1] ?? '0');
  }

  /** Humidité IoT */
  async getIoTHumidity(sensor: string): Promise<number> {
    const result = await this.query(`iot_humidity_percent{sensor="${sensor}"}`);
    return parseFloat(result.data.result[0]?.value?.[1] ?? '0');
  }

  /** Pression IoT (optionnel) */
  async getIoTPressure(sensor: string): Promise<number | undefined> {
    try {
      const result = await this.query(`iot_pressure_hpa{sensor="${sensor}"}`);
      const val = result.data.result[0]?.value?.[1];
      return val ? parseFloat(val) : undefined;
    } catch {
      return undefined;
    }
  }

  /** Récupère l'historique d'une métrique sur une plage */
  async getMetricHistory(
    promql: string,
    rangeSeconds: number,
    stepSeconds: number
  ): Promise<MetricPoint[]> {
    const end = Math.floor(Date.now() / 1000);
    const start = end - rangeSeconds;
    const result = await this.queryRange(promql, start, end, `${stepSeconds}s`);
    const series = result.data.result[0];
    if (!series?.values) return [];
    return series.values.map(([ts, val]) => ({
      timestamp: ts * 1000,
      value: parseFloat(val),
    }));
  }
}
