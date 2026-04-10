import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AppLayout from '@/components/layout/AppLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Atlas 1 — Monitoring Cluster Proxmox',
  description: 'Supervision temps réel du cluster Proxmox et des capteurs IoT environnementaux',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="light">
      <body className={`${inter.className} bg-slate-50 text-slate-800 min-h-screen flex selection:bg-blue-200 selection:text-blue-900`}>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
