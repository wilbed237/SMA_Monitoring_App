import axios from 'axios';
import { NodeMetrics, IoTSensor, Alert, ClusterHealth, HistoryData, TopologyNode, TopologyLink, TimeRange } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

/** Client axios pré-configuré avec auth header et timeout */
const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: API_KEY ? { 'x-api-key': API_KEY } : {},
});

// ─── Nodes ────────────────────────────────────────────────────────────────────

export async function fetchNodes(): Promise<NodeMetrics[]> {
  const res = await client.get('/api/nodes');
  return res.data.data;
}

export async function fetchNode(id: string): Promise<NodeMetrics> {
  const res = await client.get(`/api/nodes/${id}`);
  return res.data.data;
}

export async function fetchClusterHealth(): Promise<ClusterHealth> {
  const res = await client.get('/api/nodes/health');
  return res.data.data;
}

// ─── IoT Sensors ─────────────────────────────────────────────────────────────

export async function fetchSensors(): Promise<IoTSensor[]> {
  const res = await client.get('/api/iot');
  return res.data.data;
}

export async function fetchSensor(id: string): Promise<IoTSensor> {
  const res = await client.get(`/api/iot/${id}`);
  return res.data.data;
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export async function fetchAlerts(params?: {
  severity?: string;
  resolved?: boolean;
  type?: string;
}): Promise<{ alerts: Alert[]; meta: { total: number; active: number; critical: number } }> {
  const res = await client.get('/api/alerts', { params });
  return { alerts: res.data.data, meta: res.data.meta };
}

export async function resolveAlert(id: string): Promise<Alert> {
  const res = await client.post(`/api/alerts/${id}/resolve`);
  return res.data.data;
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function fetchNodeHistory(
  nodeId: string,
  metric: string,
  range: TimeRange
): Promise<HistoryData> {
  const res = await client.get(`/api/history/node/${nodeId}`, { params: { metric, range } });
  return res.data.data;
}

export async function fetchSensorHistory(
  sensorId: string,
  metric: string,
  range: TimeRange
): Promise<HistoryData> {
  const res = await client.get(`/api/history/sensor/${sensorId}`, { params: { metric, range } });
  return res.data.data;
}

// ─── Topology ────────────────────────────────────────────────────────────────

export async function fetchTopology(): Promise<{
  nodes: TopologyNode[];
  links: TopologyLink[];
}> {
  const res = await client.get('/api/topology');
  return res.data.data;
}
