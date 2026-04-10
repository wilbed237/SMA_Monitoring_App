'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Clock, Menu } from 'lucide-react';

// Map des titres de pages
const PAGE_TITLES: Record<string, string> = {
  '/':          'Dashboard',
  '/nodes':     'Nœuds du Cluster',
  '/iot':       'Capteurs IoT',
  '/alerts':    'Alertes',
  '/history':   'Historique & Tendances',
  '/topology':  'Topologie Réseau',
  '/settings':  'Paramètres',
};

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const [time, setTime] = useState(new Date());
  const [path, setPath] = useState('/');

  useEffect(() => {
    setPath(window.location.pathname);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const title = PAGE_TITLES[path] ?? 'Atlas';

  return (
    <header className="h-14 px-4 md:px-6 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md shrink-0 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-1.5 -ml-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-bold text-slate-800">{title}</h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-5 text-xs text-slate-500 font-medium">
        {/* Heure */}
        <div className="flex items-center gap-1.5">
          <Clock size={12} />
          <span className="font-mono">{time.toLocaleTimeString('fr-FR')}</span>
        </div>

        {/* Tag version */}
        <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold tracking-wide">
          v1.0.0
        </span>

        {/* Bouton refresh (cosmétique) */}
        <button
          onClick={() => window.location.reload()}
          className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          title="Rafraîchir"
        >
          <RefreshCw size={12} />
        </button>
      </div>
    </header>
  );
}
