import { DEMO_MANAGER_STORES } from './demo-manager-stores';

export type EventLevel = 'error' | 'warning' | 'info' | 'success';

export interface MonitoringEvent {
  id: string;
  timestamp: string;
  level: EventLevel;
  service: string;
  message: string;
  storeId?: string;
  acknowledged: boolean;
}

export interface ServiceHealth {
  name: string;
  uptime: number;
  latencyMs: number;
  errorRate: number;
  status: 'operational' | 'degraded' | 'down';
}

export const DEMO_SERVICES: ServiceHealth[] = [
  { name: 'API Catalogue', uptime: 99.98, latencyMs: 142, errorRate: 0.12, status: 'operational' },
  { name: 'Service Paiement', uptime: 99.82, latencyMs: 318, errorRate: 0.84, status: 'degraded' },
  { name: 'Générateur QR', uptime: 100, latencyMs: 61, errorRate: 0.02, status: 'operational' },
  { name: 'Scanner vendeur', uptime: 99.94, latencyMs: 97, errorRate: 0.21, status: 'operational' },
  { name: 'Synchronisation Gmail', uptime: 98.71, latencyMs: 640, errorRate: 1.9, status: 'degraded' },
  { name: 'Entrepôt analytique', uptime: 99.99, latencyMs: 210, errorRate: 0.05, status: 'operational' },
];

const MESSAGES: Array<{ level: EventLevel; service: string; message: string }> = [
  { level: 'error', service: 'Service Paiement', message: 'Échec de règlement mobile money — délai dépassé' },
  { level: 'warning', service: 'Scanner vendeur', message: 'Latence caméra élevée sur poste de retrait' },
  { level: 'info', service: 'API Catalogue', message: 'Réindexation du catalogue terminée' },
  { level: 'success', service: 'Générateur QR', message: 'Lot de codes QR généré sans erreur' },
  { level: 'warning', service: 'Entrepôt analytique', message: 'Fraîcheur des données au-delà du seuil de 30 min' },
  { level: 'error', service: 'Synchronisation Gmail', message: 'Jeton de synchronisation expiré pour 4 comptes' },
  { level: 'info', service: 'Scanner vendeur', message: 'Nouveau poste de scan enregistré' },
  { level: 'warning', service: 'Service Paiement', message: "Taux de codes QR expirés au-dessus de la normale" },
];

export function buildDemoMonitoringEvents(): MonitoringEvent[] {
  return Array.from({ length: 42 }).map((_, i) => {
    const m = MESSAGES[i % MESSAGES.length];
    const store = DEMO_MANAGER_STORES[i % DEMO_MANAGER_STORES.length];
    return {
      id: `ev-${i}`,
      timestamp: new Date(Date.now() - i * (7 + (i % 88)) * 60000).toISOString(),
      level: m.level,
      service: m.service,
      message: m.message,
      storeId: i % 3 === 0 ? store.id : undefined,
      acknowledged: i % 3 !== 0,
    };
  });
}

export const DEMO_LATENCY_SERIES = Array.from({ length: 24 }).map((_, i) => ({
  hour: `${String(i).padStart(2, '0')}h`,
  latence: Math.round(110 + Math.sin(i / 3) * 45 + (i * 7) % 40),
  erreurs: Math.round((0.2 + Math.abs(Math.sin(i / 5)) * 0.9 + (i % 3) * 0.1) * 100) / 100,
  sessions: Math.round(180 + Math.sin((i - 4) / 3.4) * 120 + ((i * 13) % 60)),
  scans: Math.round(40 + Math.max(0, Math.sin((i - 6) / 3.2)) * 110 + ((i * 11) % 25)),
}));
