'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Server, Thermometer, Bell, BarChart2,
  Network, Settings, Wifi, Activity,
} from 'lucide-react';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/nodes', label: 'Nœuds', icon: Server },
  { href: '/iot', label: 'IoT', icon: Thermometer },
  { href: '/alerts', label: 'Alertes', icon: Bell },
  { href: '/history', label: 'Historique', icon: BarChart2 },
  { href: '/topology', label: 'Topologie', icon: Network },
  { href: '/settings', label: 'Paramètres', icon: Settings },
];

export default function Sidebar({ isOpen = false, setIsOpen }: { isOpen?: boolean; setIsOpen?: (v: boolean) => void }) {
  const pathname = usePathname();

  return (
    <aside className={`fixed inset-y-0 left-0 md:static md:h-screen w-72 md:w-64 shrink-0 flex flex-col bg-white border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.08)] z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-lg gradient-text">GridOne-Atlas 1</span>
            <p className="text-[10px] text-slate-500 -mt-1">Monitoring Cluster</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen?.(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium nav-item ${isActive ? 'nav-active' : ''}`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Indicateur de connexion en bas */}
      <div className="px-5 py-4 border-t border-slate-100 mt-auto bg-slate-50/50">
        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
          <Wifi size={14} className="text-emerald-500" />
          <span>Connecté au backend</span>
          <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
        </div>
      </div>
    </aside>
  );
}
