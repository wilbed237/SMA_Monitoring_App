import { Router, Request, Response } from 'express';
import { TopologyNode } from '../types';

const router = Router();

/** Topologie statique du cluster — positions logiques dans la salle */
const TOPOLOGY: TopologyNode[] = [
  {
    id: 'switch-main',
    name: 'Switch Principal',
    type: 'switch',
    status: 'online',
    ip: '192.168.1.1',
    position: { x: 50, y: 10 },
    connections: ['pve-node-1', 'pve-node-2', 'pve-node-3', 'monitoring-pc'],
  },
  {
    id: 'pve-node-1',
    name: 'PVE-Node-1',
    type: 'proxmox',
    status: 'online',
    ip: '192.168.1.10',
    position: { x: 10, y: 45 },
    connections: ['switch-main'],
  },
  {
    id: 'pve-node-2',
    name: 'PVE-Node-2',
    type: 'proxmox',
    status: 'online',
    ip: '192.168.1.11',
    position: { x: 50, y: 45 },
    connections: ['switch-main'],
  },
  {
    id: 'pve-node-3',
    name: 'PVE-Node-3',
    type: 'proxmox',
    status: 'degraded',
    ip: '192.168.1.12',
    position: { x: 90, y: 45 },
    connections: ['switch-main'],
  },
  {
    id: 'monitoring-pc',
    name: 'PC Monitoring',
    type: 'monitoring',
    status: 'online',
    ip: '192.168.1.20',
    position: { x: 50, y: 80 },
    connections: ['switch-main', 'iot-gateway'],
  },
  {
    id: 'iot-gateway',
    name: 'Passerelle IoT (ESP32)',
    type: 'iot_gateway',
    status: 'online',
    ip: '192.168.1.30',
    position: { x: 85, y: 80 },
    connections: ['monitoring-pc'],
  },
];

/** GET /api/topology — retourne les nœuds et liens du cluster */
router.get('/', (_req: Request, res: Response) => {
  // Calcule les liens depuis les connexions
  const links: Array<{ source: string; target: string }> = [];
  const seen = new Set<string>();

  TOPOLOGY.forEach((node) => {
    node.connections.forEach((targetId) => {
      const key = [node.id, targetId].sort().join('-');
      if (!seen.has(key)) {
        seen.add(key);
        links.push({ source: node.id, target: targetId });
      }
    });
  });

  res.json({ success: true, data: { nodes: TOPOLOGY, links } });
});

export default router;
