import { Router, Request, Response } from 'express';
import { MOCK_ALERTS } from '../services/mock.service';
import { Alert, AlertThresholds } from '../types';

const router = Router();
const isMock = process.env.MOCK_MODE === 'true';

// Seuils par défaut — modifiables via la page Paramètres
let thresholds: AlertThresholds = {
  cpuWarning: 75,
  cpuCritical: 90,
  memoryWarning: 80,
  memoryCritical: 95,
  diskWarning: 80,
  diskCritical: 95,
  tempWarning: 28,
  tempCritical: 35,
  humidityMin: 30,
  humidityMax: 70,
};

// Stockage en mémoire des alertes actives (en prod, utiliser Alertmanager)
let activeAlerts: Alert[] = [...MOCK_ALERTS];

/** GET /api/alerts — toutes les alertes */
router.get('/', (req: Request, res: Response) => {
  const { severity, resolved, type } = req.query;

  let filtered = activeAlerts;

  if (severity) {
    filtered = filtered.filter((a) => a.severity === severity);
  }
  if (resolved !== undefined) {
    filtered = filtered.filter((a) => a.resolved === (resolved === 'true'));
  }
  if (type) {
    filtered = filtered.filter((a) => a.type === type);
  }

  // Tri : non-résolues d'abord, puis par timestamp décroissant
  filtered.sort((a, b) => {
    if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  res.json({
    success: true,
    data: filtered,
    meta: {
      total: filtered.length,
      active: filtered.filter((a) => !a.resolved).length,
      critical: filtered.filter((a) => !a.resolved && a.severity === 'critical').length,
    },
    source: isMock ? 'mock' : 'prometheus',
  });
});

/** GET /api/alerts/thresholds — seuils actuels */
router.get('/thresholds', (_req: Request, res: Response) => {
  res.json({ success: true, data: thresholds });
});

/** PUT /api/alerts/thresholds — mettre à jour les seuils */
router.put('/thresholds', (req: Request, res: Response) => {
  thresholds = { ...thresholds, ...req.body };
  res.json({ success: true, data: thresholds, message: 'Seuils mis à jour' });
});

/** POST /api/alerts/:id/resolve — résoudre une alerte manuellement */
router.post('/:id/resolve', (req: Request, res: Response) => {
  const alert = activeAlerts.find((a) => a.id === req.params.id);
  if (!alert) return res.status(404).json({ success: false, error: 'Alerte non trouvée' });

  alert.resolved = true;
  alert.resolvedAt = new Date().toISOString();
  res.json({ success: true, data: alert });
});

/** POST /api/alerts/check — évaluation manuelle des métriques (en prod, géré par cron) */
router.post('/check', (req: Request, res: Response) => {
  const { metrics } = req.body as {
    metrics: Array<{ nodeId?: string; sensorId?: string; type: string; value: number }>;
  };

  const newAlerts: Alert[] = [];

  for (const metric of metrics) {
    let severity: 'critical' | 'warning' | 'info' | null = null;
    let threshold = 0;
    let message = '';

    if (metric.type === 'cpu') {
      if (metric.value >= thresholds.cpuCritical) {
        severity = 'critical'; threshold = thresholds.cpuCritical;
        message = `CPU critique sur ${metric.nodeId} : ${metric.value.toFixed(1)}%`;
      } else if (metric.value >= thresholds.cpuWarning) {
        severity = 'warning'; threshold = thresholds.cpuWarning;
        message = `CPU élevé sur ${metric.nodeId} : ${metric.value.toFixed(1)}%`;
      }
    } else if (metric.type === 'memory') {
      if (metric.value >= thresholds.memoryCritical) {
        severity = 'critical'; threshold = thresholds.memoryCritical;
        message = `Mémoire critique sur ${metric.nodeId} : ${metric.value.toFixed(1)}%`;
      } else if (metric.value >= thresholds.memoryWarning) {
        severity = 'warning'; threshold = thresholds.memoryWarning;
        message = `Mémoire élevée sur ${metric.nodeId} : ${metric.value.toFixed(1)}%`;
      }
    } else if (metric.type === 'temperature') {
      if (metric.value >= thresholds.tempCritical) {
        severity = 'critical'; threshold = thresholds.tempCritical;
        message = `Température critique sur ${metric.sensorId} : ${metric.value.toFixed(1)}°C`;
      } else if (metric.value >= thresholds.tempWarning) {
        severity = 'warning'; threshold = thresholds.tempWarning;
        message = `Température élevée sur ${metric.sensorId} : ${metric.value.toFixed(1)}°C`;
      }
    }

    if (severity) {
      newAlerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: metric.type as Alert['type'],
        severity,
        nodeId: metric.nodeId,
        sensorId: metric.sensorId,
        message,
        value: metric.value,
        threshold,
        timestamp: new Date().toISOString(),
        resolved: false,
      });
    }
  }

  activeAlerts = [...newAlerts, ...activeAlerts];
  res.json({ success: true, data: newAlerts, created: newAlerts.length });
});

export default router;
