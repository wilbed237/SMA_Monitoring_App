# Atlas — Monitoring Proxmox & IoT Cluster

A professional web application for monitoring a 3-node Proxmox cluster and environmental IoT sensors, built with Next.js and Express.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- Docker & Docker Compose (optional, for running Prometheus and Grafana local stack easily)

### 2. Setup the Stack (Prometheus & Grafana)
If you don't have an existing Prometheus server, you can use the provided Docker compose file:
```bash
docker-compose up -d
```
Prometheus will run on `http://localhost:9090` and Grafana on `http://localhost:3000`.
You can configure Prometheus sources in the `prometheus.yml` file.

### 3. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
The backend API server will listen on `http://localhost:4000`.
**Note:** By default, `.env` contains `MOCK_MODE=true` for demonstration purposes. Change it to `false` and set `PROMETHEUS_URL` to point to a real Prometheus server to fetch real metrics.

### 4. Setup Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local # Or just use the defaults
npm run dev
```
The dashboard will be available at `http://localhost:3000` (Next.js default) or `http://localhost:3001` if port 3000 is occupied by Grafana.

## 🏗️ Architecture
- **Frontend**: Next.js 14, Tailwind CSS v4, Recharts, Lucide React
- **Backend**: Express, TypeScript, Axios (for proxying Prometheus requests)
- **Data Source**: Prometheus (and Node Exporter + IoT HTTP metrics exporter)

## 🩺 Features
- **Dashboard Overview**: Global health score, cluster summaries, active alerts.
- **Node Monitoring**: Detailed granular metrics (CPU, RAM, Disk, Network) per node.
- **IoT Environmental Sensing**: Temperature, Humidity, and Pressure visualizations.
- **Alert System**: Alert evaluations, severity handling, threshold customizations.
- **History**: Rich historical graphs using Recharts.
- **Topology Map**: Real-time live visual logical map of the network and nodes.
