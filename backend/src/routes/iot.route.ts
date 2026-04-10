import { Router, Request, Response } from 'express';
import { PrometheusService } from '../services/prometheus.service';
import { MOCK_SENSORS } from '../services/mock.service';
import { IoTSensor } from '../types';

const router = Router();
const isMock = process.env.MOCK_MODE === 'true';
const prometheus = new PrometheusService(process.env.PROMETHEUS_URL || 'http://localhost:9090');

// Capteurs configurés
const SENSOR_CONFIG: Array<{ id: string; name: string; location: string }> = [
  { id: 'dht22-1', name: 'Capteur Rack A',       location: 'Rack A — Haut' },
  { id: 'dht22-2', name: 'Capteur Rack B',       location: 'Rack B — Milieu' },
  { id: 'dht22-3', name: 'Capteur Entrée Salle', location: 'Entrée salle serveurs' },
];

/** GET /api/iot — tous les capteurs */
router.get('/', async (_req: Request, res: Response) => {
  if (isMock) {
    const updated = MOCK_SENSORS.map((s) => ({
      ...s,
      temperature: parseFloat((s.temperature + (Math.random() - 0.5) * 1).toFixed(1)),
      humidity: parseFloat((s.humidity + (Math.random() - 0.5) * 2).toFixed(1)),
      lastSeen: new Date().toISOString(),
    }));
    return res.json({ success: true, data: updated, source: 'mock' });
  }

  try {
    const sensors: IoTSensor[] = await Promise.all(
      SENSOR_CONFIG.map(async (config) => {
        const [temp, humidity, pressure] = await Promise.all([
          prometheus.getIoTTemperature(config.id),
          prometheus.getIoTHumidity(config.id),
          prometheus.getIoTPressure(config.id),
        ]);
        return {
          ...config,
          status: 'online' as const,
          temperature: temp,
          humidity,
          ...(pressure !== undefined && { pressure }),
          lastSeen: new Date().toISOString(),
        };
      })
    );
    res.json({ success: true, data: sensors, source: 'prometheus' });
  } catch (err: any) {
    res.status(502).json({ success: false, error: 'IoT exporter unreachable', detail: err.message });
  }
});

/** GET /api/iot/:id — capteur spécifique */
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (isMock) {
    const sensor = MOCK_SENSORS.find((s) => s.id === id);
    if (!sensor) return res.status(404).json({ success: false, error: 'Capteur non trouvé' });
    return res.json({ success: true, data: sensor, source: 'mock' });
  }

  const config = SENSOR_CONFIG.find((s) => s.id === id);
  if (!config) return res.status(404).json({ success: false, error: 'Capteur non trouvé' });

  try {
    const [temp, humidity, pressure] = await Promise.all([
      prometheus.getIoTTemperature(id),
      prometheus.getIoTHumidity(id),
      prometheus.getIoTPressure(id),
    ]);
    res.json({
      success: true,
      data: {
        ...config,
        status: 'online',
        temperature: temp,
        humidity,
        ...(pressure !== undefined && { pressure }),
        lastSeen: new Date().toISOString(),
      },
      source: 'prometheus',
    });
  } catch (err: any) {
    res.status(502).json({ success: false, error: 'IoT exporter unreachable', detail: err.message });
  }
});

export default router;
