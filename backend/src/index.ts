import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';

import nodesRouter from './routes/nodes.route';
import iotRouter from './routes/iot.route';
import alertsRouter from './routes/alerts.route';
import historyRouter from './routes/history.route';
import topologyRouter from './routes/topology.route';

// Charge les variables d'environnement depuis .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const API_KEY = process.env.API_KEY;

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

/** Middleware d'authentification simple par API key */
app.use((req, res, next) => {
  // GET sur /api/health est toujours accessible
  if (req.path === '/api/health') return next();
  // Si API_KEY est défini, on vérifie le header
  if (API_KEY && req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ success: false, error: 'Non autorisé — API key invalide' });
  }
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Atlas Backend',
    version: '1.0.0',
    mode: process.env.MOCK_MODE === 'true' ? 'mock' : 'prometheus',
    prometheus: process.env.PROMETHEUS_URL,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/nodes',    nodesRouter);
app.use('/api/iot',      iotRouter);
app.use('/api/alerts',   alertsRouter);
app.use('/api/history',  historyRouter);
app.use('/api/topology', topologyRouter);

/** Route 404 générique */
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route non trouvée' });
});

/** Gestionnaire d'erreurs global */
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Atlas Error]', err.message);
  res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
});

// ─── Cron : vérification périodique des alertes ───────────────────────────────
if (process.env.MOCK_MODE !== 'true') {
  const interval = process.env.ALERT_CHECK_INTERVAL || '30';
  cron.schedule(`*/${interval} * * * * *`, () => {
    // En production : appel interne à /api/alerts/check avec les métriques actuelles
    console.log(`[Atlas Cron] Checking alerts at ${new Date().toISOString()}`);
  });
}

// ─── Démarrage ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n┌─────────────────────────────────────────┐`);
  console.log(`│  🚀 Atlas Backend démarré               │`);
  console.log(`│  Port      : ${PORT}                       │`);
  console.log(`│  Mode      : ${process.env.MOCK_MODE === 'true' ? 'Mock (simulation)   ' : 'Prometheus          '} │`);
  console.log(`│  Prometheus: ${process.env.PROMETHEUS_URL || 'http://localhost:9090'} │`);
  console.log(`└─────────────────────────────────────────┘\n`);
});

export default app;
