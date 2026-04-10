'use client';

import { useState } from 'react';
import { Save, Info, Sliders, Database, Bell } from 'lucide-react';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean';
  description: string;
}

const FIELDS: Field[] = [
  { key: 'prometheusUrl',  label: 'URL Prometheus',     type: 'text',    description: 'URL de connexion directe pour le backend.' },
  { key: 'grafanaUrl',     label: 'URL Grafana',        type: 'text',    description: 'Lien direct vers l\'instance Grafana publique.' },
  { key: 'apiKey',         label: 'Clé API Backend',    type: 'text',    description: 'Laisser vide pour désactiver l\'authentification.' },
  { key: 'refreshInterval',label: 'Intervalle (ms)',    type: 'number',  description: 'Mise à jour automatique des graphiques et dashboards.' },
  { key: 'mockMode',       label: 'Données de test',    type: 'boolean', description: 'Simuler des valeurs pour la démonstration académique.' },
];

const THRESHOLD_FIELDS = [
  { key: 'cpuWarning',     label: 'CPU',                unit: '%' },
  { key: 'memoryWarning',  label: 'RAM',                unit: '%' },
  { key: 'diskWarning',    label: 'Disque',             unit: '%' },
  { key: 'tempWarning',    label: 'Temp.',              unit: '°C' },
  { key: 'cpuCritical',    label: 'CPU',                unit: '%' },
  { key: 'memoryCritical', label: 'RAM',                unit: '%' },
  { key: 'diskCritical',   label: 'Disque',             unit: '%' },
  { key: 'tempCritical',   label: 'Temp.',              unit: '°C' },
  { key: 'humidityMin',    label: 'Hum. min',           unit: '%' },
  { key: 'humidityMax',    label: 'Hum. max',           unit: '%' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    prometheusUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    grafanaUrl: process.env.NEXT_PUBLIC_GRAFANA_URL ?? 'http://localhost:3000',
    apiKey: process.env.NEXT_PUBLIC_API_KEY ?? '',
    refreshInterval: 15000,
    mockMode: true,
  });

  const [thresholds, setThresholds] = useState({
    cpuWarning: 75, cpuCritical: 90,
    memoryWarning: 80, memoryCritical: 95,
    diskWarning: 80, diskCritical: 95,
    tempWarning: 28, tempCritical: 35,
    humidityMin: 30, humidityMax: 70,
  });

  const [saved, setSaved] = useState(false);

  function handleSave() {
    localStorage.setItem('atlas_settings', JSON.stringify(settings));
    localStorage.setItem('atlas_thresholds', JSON.stringify(thresholds));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Paramètres</h2>
          <p className="text-xs font-medium text-slate-500 mt-1">Gérer la connexion aux métriques et les règles d'alerting.</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <Save size={18} />
          {saved ? 'Sauvegardé avec succès' : 'Sauvegarder les modifications'}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Connexion */}
        <div className="glass-card p-8">
          <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
            <Database size={20} className="text-blue-600" /> Connexion & API
          </h3>
          <div className="space-y-6">
            {FIELDS.map(({ key, label, type, description }) => (
              <div key={key}>
                <label className="block text-sm font-bold text-slate-600 mb-2">{label}</label>
                {type === 'boolean' ? (
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <button
                      onClick={() => setSettings((s) => ({ ...s, [key]: !s[key as keyof typeof s] }))}
                      className={`w-12 h-6 rounded-full transition-all relative shadow-inner ${
                        settings[key as keyof typeof settings] ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                        settings[key as keyof typeof settings] ? 'left-[26px]' : 'left-1'
                      }`} />
                    </button>
                    <p className="text-[11px] font-medium text-slate-500 flex-1">{description}</p>
                  </div>
                ) : (
                  <>
                    <input
                      type={type === 'number' ? 'number' : 'text'}
                      value={settings[key as keyof typeof settings] as string | number}
                      onChange={(e) => setSettings((s) => ({
                        ...s,
                        [key]: type === 'number' ? parseInt(e.target.value) : e.target.value,
                      }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-slate-400 shadow-sm"
                    />
                    <p className="text-[10px] font-bold text-slate-400 mt-2 ml-1 uppercase tracking-widest">{description}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Seuils d'alertes */}
          <div className="glass-card p-8">
            <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
              <Sliders size={20} className="text-orange-500" /> Seuils d'alertes
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-6 mb-2">
                <div className="text-xs font-black uppercase tracking-widest text-orange-500 pb-2 border-b-2 border-orange-200">Avertissement</div>
                <div className="text-xs font-black uppercase tracking-widest text-red-600 pb-2 border-b-2 border-red-200">Critique</div>
              </div>
              
              {THRESHOLD_FIELDS.map(({ key, label, unit }) => (
                <div key={key} className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {label} <span className="text-slate-300">({unit})</span>
                  </label>
                  <input
                    type="number"
                    value={thresholds[key as keyof typeof thresholds]}
                    onChange={(e) => setThresholds((s) => ({ ...s, [key]: parseFloat(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
              ))}
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-6 pt-4 border-t border-slate-100 text-center flex items-center justify-center gap-1.5"><Bell size={14}/> Les alertes s'activent lorsque ces règles sont franchies.</p>
          </div>

          {/* Intégration Grafana */}
          <div className="glass-card p-8 bg-gradient-to-br from-white to-slate-50">
            <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
              <Info size={18} className="text-blue-600" /> Tableaux de bord Grafana
            </h3>
            <p className="text-xs font-medium text-slate-500 mb-5 leading-relaxed">Pour des requêtes PromQL plus avancées ou des exports massifs en CSV, vous pouvez utiliser l'interface native Grafana.</p>
            <a
              href={settings.grafanaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full gap-2 px-5 py-3 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl text-sm font-bold hover:bg-orange-100 hover:border-orange-300 transition-colors shadow-sm"
            >
              Ouvrir Grafana Explore &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
