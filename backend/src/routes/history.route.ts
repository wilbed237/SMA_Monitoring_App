import { Router, Request, Response } from 'express';
import { PrometheusService } from '../services/prometheus.service';
import { generateMockHistory } from '../services/mock.service';

const router = Router();
const isMock = process.env.MOCK_MODE === 'true';
const prometheus = new PrometheusService(process.env.PROMETHEUS_URL || 'http://localhost:9090');

// Plages temporelles → secondes / step
const RANGES: Record<string, { seconds: number; step: number }> = {
  '1h':  { seconds: 3600,    step: 60 },
  '24h': { seconds: 86400,   step: 600 },
  '7d':  { seconds: 604800,  step: 3600 },
};

/** GET /api/history/node/:id — historique d'un nœud
 *  Query params: metric (cpu|memory|disk|network_rx|network_tx), range (1h|24h|7d)
 */
router.get('/node/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const metric = (req.query.metric as string) || 'cpu';
  const range = (req.query.range as string) || '1h';
  const rangeConfig = RANGES[range] || RANGES['1h'];

  if (isMock) {
    const baseValues: Record<string, number> = {
      cpu: 55, memory: 72, disk: 65, network_rx: 1200, network_tx: 800,
    };
    const variances: Record<string, number> = {
      cpu: 20, memory: 10, disk: 5, network_rx: 800, network_tx: 600,
    };
    const data = generateMockHistory(
      id,
      metric,
      range as '1h' | '24h' | '7d',
      baseValues[metric] ?? 50,
      variances[metric] ?? 10
    );
    return res.json({ success: true, data, source: 'mock' });
  }

  // Requêtes PromQL par métrique
  const NODE_HOSTS: Record<string, string> = {
    'pve-node-1': '192.168.1.10:9100',
    'pve-node-2': '192.168.1.11:9100',
    'pve-node-3': '192.168.1.12:9100',
  };
  const host = NODE_HOSTS[id];
  if (!host) return res.status(404).json({ success: false, error: 'Nœud non trouvé' });

  const QUERIES: Record<string, string> = {
    cpu: `100 - (avg(irate(node_cpu_seconds_total{mode="idle",instance="${host}"}[5m])) * 100)`,
    memory: `(1 - node_memory_MemAvailable_bytes{instance="${host}"} / node_memory_MemTotal_bytes{instance="${host}"}) * 100`,
    disk: `(1 - node_filesystem_avail_bytes{instance="${host}",mountpoint="/"} / node_filesystem_size_bytes{instance="${host}",mountpoint="/"}) * 100`,
    network_rx: `irate(node_network_receive_bytes_total{instance="${host}",device!="lo"}[5m])`,
    network_tx: `irate(node_network_transmit_bytes_total{instance="${host}",device!="lo"}[5m])`,
  };

  const query = QUERIES[metric];
  if (!query) return res.status(400).json({ success: false, error: 'Métrique inconnue' });

  try {
    const points = await prometheus.getMetricHistory(query, rangeConfig.seconds, rangeConfig.step);
    res.json({
      success: true,
      data: { nodeId: id, metric, range, points },
      source: 'prometheus',
    });
  } catch (err: any) {
    res.status(502).json({ success: false, error: 'Prometheus unreachable', detail: err.message });
  }
});

/** GET /api/history/sensor/:id — historique d'un capteur IoT
 *  Query params: metric (temperature|humidity|pressure), range (1h|24h|7d)
 */
router.get('/sensor/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const metric = (req.query.metric as string) || 'temperature';
  const range = (req.query.range as string) || '1h';
  const rangeConfig = RANGES[range] || RANGES['1h'];

  if (isMock) {
    const baseValues: Record<string, number> = { temperature: 26, humidity: 55, pressure: 1012 };
    const variances: Record<string, number> = { temperature: 3, humidity: 8, pressure: 3 };
    const data = generateMockHistory(
      id,
      metric,
      range as '1h' | '24h' | '7d',
      baseValues[metric] ?? 25,
      variances[metric] ?? 5
    );
    return res.json({ success: true, data, source: 'mock' });
  }

  const SENSOR_QUERIES: Record<string, string> = {
    temperature: `iot_temperature_celsius{sensor="${id}"}`,
    humidity:    `iot_humidity_percent{sensor="${id}"}`,
    pressure:    `iot_pressure_hpa{sensor="${id}"}`,
  };

  const query = SENSOR_QUERIES[metric];
  if (!query) return res.status(400).json({ success: false, error: 'Métrique inconnue' });

  try {
    const points = await prometheus.getMetricHistory(query, rangeConfig.seconds, rangeConfig.step);
    res.json({
      success: true,
      data: { sensorId: id, metric, range, points },
      source: 'prometheus',
    });
  } catch (err: any) {
    res.status(502).json({ success: false, error: 'IoT exporter unreachable', detail: err.message });
  }
});

export default router;
