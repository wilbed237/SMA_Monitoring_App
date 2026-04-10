/** Formate des bytes en valeur lisible (KB, MB, GB) */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/** Formate un uptime en secondes en chaîne lisible */
export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}j ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Détermine la couleur d'un pourcentage (vert → orange → rouge) */
export function percentColor(value: number, warn = 75, critical = 90): string {
  if (value >= critical) return 'text-red-500';
  if (value >= warn) return 'text-orange-500';
  return 'text-emerald-500';
}

/** Détermine la couleur de la jauge en CSS */
export function gaugeColor(value: number, warn = 75, critical = 90): string {
  if (value >= critical) return '#ef4444';   // red-500
  if (value >= warn) return '#f97316';       // orange-500
  return '#10b981';                          // emerald-500
}

/** Retourne la classe CSS du badge de statut */
export function statusClass(status: 'online' | 'offline' | 'degraded'): string {
  switch (status) {
    case 'online':   return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    case 'offline':  return 'bg-red-50 text-red-600 border-red-200';
    case 'degraded': return 'bg-orange-50 text-orange-600 border-orange-200';
  }
}

/** Retourne icon et couleur selon la sévérité d'une alerte */
export function severityStyle(severity: 'critical' | 'warning' | 'info') {
  switch (severity) {
    case 'critical': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', dot: 'bg-red-500' };
    case 'warning':  return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', dot: 'bg-orange-500' };
    case 'info':     return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', dot: 'bg-blue-500' };
  }
}

/** Formate un timestamp ISO en heure locale courte */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Formate un timestamp ISO en date + heure */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}
