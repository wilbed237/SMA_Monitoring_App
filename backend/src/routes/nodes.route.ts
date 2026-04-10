import { Router, Request, Response } from 'express';
import { PrometheusService } from '../services/prometheus.service';
import { MOCK_NODES, getMockClusterHealth } from '../services/mock.service';
import { NodeMetrics } from '../types';

const router = Router();
const isMock = process.env.MOCK_MODE === 'true';
const prometheus = new PrometheusService(process.env.PROMETHEUS_URL || 'http://localhost:9090');

// Liste des nœuds configurés (en prod, on les découvre via Prometheus)
const NODE_CONFIG: Array<{ id: string; name: string; host: string }> = [
  { id: 'pve-node-1', name: 'PVE-Node-1', host: '192.168.1.10:9100' },
  { id: 'pve-node-2', name: 'PVE-Node-2', host: '192.168.1.11:9100' },
  { id: 'pve-node-3', name: 'PVE-Node-3', host: '192.168.1.12:9100' },
];

/** GET /api/nodes — liste tous les nœuds avec métriques */
router.get('/', async (_req: Request, res: Response) => {
  if (isMock) {
    // Raffraîchit légèrement les données mock pour simuler des valeurs vivantes
    const updated = MOCK_NODES.map((n) => ({
      ...n,
      cpu: parseFloat((n.cpu + (Math.random() - 0.5) * 5).toFixed(1)),
      memory: { ...n.memory, percent: parseFloat((n.memory.percent + (Math.random() - 0.5) * 3).toFixed(1)) },
      lastSeen: new Date().toISOString(),
    }));
    return res.json({ success: true, data: updated, source: 'mock' });
  }

  try {
    const nodes: NodeMetrics[] = await Promise.all(
      NODE_CONFIG.map(async (config) => {
        const isUp = await prometheus.isNodeUp(config.host);
        if (!isUp) {
          return {
            ...config,
            status: 'offline' as const,
            uptime: 0,
            cpu: 0,
            memory: { used: 0, total: 0, percent: 0 },
            disk: { used: 0, total: 0, percent: 0 },
            network: { rxBytesPerSec: 0, txBytesPerSec: 0 },
            lastSeen: new Date().toISOString(),
          };
        }

        const [cpu, memory, disk, network, uptime] = await Promise.all([
          prometheus.getCpuUsage(config.host),
          prometheus.getMemoryUsage(config.host),
          prometheus.getDiskUsage(config.host),
          prometheus.getNetworkUsage(config.host),
          prometheus.getUptime(config.host),
        ]);

        const status =
          cpu > 90 || memory.percent > 95
            ? 'degraded'
            : 'online';

        return {
          ...config,
          status,
          uptime,
          cpu,
          memory,
          disk,
          network,
          lastSeen: new Date().toISOString(),
        };
      })
    );
    res.json({ success: true, data: nodes, source: 'prometheus' });
  } catch (err: any) {
    res.status(502).json({ success: false, error: 'Prometheus unreachable', detail: err.message });
  }
});

/** GET /api/nodes/health — santé globale du cluster */
router.get('/health', async (_req: Request, res: Response) => {
  if (isMock) {
    return res.json({ success: true, data: getMockClusterHealth(), source: 'mock' });
  }
  try {
    // Récupère tous les nœuds et calcule un score global
    const upResult = await prometheus.query('up{job="node"}');
    const total = NODE_CONFIG.length;
    const online = upResult.data.result.filter((r) => r.value?.[1] === '1').length;
    res.json({
      success: true,
      data: { totalNodes: total, onlineNodes: online, offlineNodes: total - online },
      source: 'prometheus',
    });
  } catch (err: any) {
    res.status(502).json({ success: false, error: 'Prometheus unreachable', detail: err.message });
  }
});

/** GET /api/nodes/:id — détail d'un nœud spécifique */
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (isMock) {
    const node = MOCK_NODES.find((n) => n.id === id);
    if (!node) return res.status(404).json({ success: false, error: 'Nœud non trouvé' });
    return res.json({ success: true, data: node, source: 'mock' });
  }

  const config = NODE_CONFIG.find((n) => n.id === id);
  if (!config) return res.status(404).json({ success: false, error: 'Nœud non trouvé' });

  try {
    const [cpu, memory, disk, network, uptime, isUp] = await Promise.all([
      prometheus.getCpuUsage(config.host),
      prometheus.getMemoryUsage(config.host),
      prometheus.getDiskUsage(config.host),
      prometheus.getNetworkUsage(config.host),
      prometheus.getUptime(config.host),
      prometheus.isNodeUp(config.host),
    ]);

    res.json({
      success: true,
      data: {
        ...config,
        status: isUp ? 'online' : 'offline',
        uptime,
        cpu,
        memory,
        disk,
        network,
        lastSeen: new Date().toISOString(),
      },
      source: 'prometheus',
    });
  } catch (err: any) {
    res.status(502).json({ success: false, error: 'Prometheus unreachable', detail: err.message });
  }
});

export default router;
