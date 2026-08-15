import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ManagerDataService } from '../../../core/services/manager-data.service';
import { ManagerMonitoringService, MonitoringTabFilter } from '../../../core/services/manager-monitoring.service';
import { OrderService } from '../../../core/services/order.service';
import { ThemeService } from '../../../core/services/theme.service';
import { EventLevel, MonitoringEvent, ServiceHealth } from '../../../core/data/demo-monitoring';
import { downloadFile } from '../../../core/utils/storage.util';
import { relativeTime } from '../../../core/utils/format.util';
import { SegmentedTabsComponent } from '../../../shared/components/segmented-tabs/segmented-tabs.component';

const FILTER_TABS = [
  { id: 'open', label: 'Non traitées' },
  { id: 'error', label: 'Erreurs' },
  { id: 'all', label: 'Tout' },
];

const LEVEL_LABEL: Record<EventLevel, string> = {
  error: 'Erreur',
  warning: 'Avertissement',
  info: 'Information',
  success: 'Succès',
};

const SERVICE_NAMES = [
  'API Catalogue',
  'Service Paiement',
  'Générateur QR',
  'Scanner vendeur',
  'Synchronisation Gmail',
  'Entrepôt analytique',
];

@Component({
  selector: 'app-manager-monitoring',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    BaseChartDirective,
    SegmentedTabsComponent,
  ],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>
            <mat-icon>monitor_heart</mat-icon>
            Monitoring applicatif
          </h1>
          <p>
            Santé des services, latence, erreurs et file des codes QR sur {{ filters.stores().length }} boutiques.
            @if (filters.activeFilterCount() > 0) {
              · {{ filters.activeFilterCount() }} filtre(s) actif(s)
            }
          </p>
        </div>
        <div class="head-actions">
          <button type="button" class="btn-outline" (click)="refresh()">
            <mat-icon>refresh</mat-icon> Actualiser
          </button>
          <button type="button" class="btn-outline" (click)="exportEvents()">
            <mat-icon>download</mat-icon> Exporter
          </button>
          <app-segmented-tabs
            size="sm"
            [items]="filterTabs"
            [value]="filters.tabFilter()"
            (valueChange)="setTab($event)"
          />
        </div>
      </header>

      <div class="filters card">
        <select
          [ngModel]="filters.storeFilter()"
          (ngModelChange)="filters.storeFilter.set($event)"
          class="filter-select"
          aria-label="Boutique"
        >
          <option value="all">Toutes les boutiques</option>
          @for (s of filters.stores(); track s.id) {
            <option [value]="s.id">{{ s.name }}</option>
          }
        </select>
        <select
          [ngModel]="filters.serviceFilter()"
          (ngModelChange)="filters.serviceFilter.set($event)"
          class="filter-select"
          aria-label="Service"
        >
          <option value="all">Tous les services</option>
          @for (name of serviceNames; track name) {
            <option [value]="name">{{ name }}</option>
          }
        </select>
        <select
          [ngModel]="filters.levelFilter()"
          (ngModelChange)="filters.levelFilter.set($event)"
          class="filter-select"
          aria-label="Niveau"
        >
          <option value="all">Tous les niveaux</option>
          <option value="error">Erreur</option>
          <option value="warning">Avertissement</option>
          <option value="info">Information</option>
          <option value="success">Succès</option>
        </select>
        <div class="search-wrap">
          <mat-icon>search</mat-icon>
          <input
            [ngModel]="filters.query()"
            (ngModelChange)="filters.query.set($event)"
            placeholder="Rechercher dans le journal…"
            aria-label="Rechercher dans le journal"
          />
        </div>
        @if (filters.activeFilterCount() > 0) {
          <button type="button" class="btn-outline" (click)="filters.resetFilters()">
            <mat-icon>filter_alt_off</mat-icon> Réinitialiser
          </button>
        }
        @if (filteredOpenCount() > 0) {
          <button type="button" class="btn-outline" (click)="acknowledgeAll()">
            <mat-icon>done_all</mat-icon>
            Tout accuser ({{ filteredOpenCount() }})
          </button>
        }
      </div>

      @if (filters.activeFilterCount() > 0) {
        <div class="active-filters">
          @if (filters.storeFilter() !== 'all') {
            <span class="chip">Boutique : {{ filters.storeName(filters.storeFilter()) }}</span>
          }
          @if (filters.serviceFilter() !== 'all') {
            <span class="chip">Service : {{ filters.serviceFilter() }}</span>
          }
          @if (filters.levelFilter() !== 'all') {
            <span class="chip">Niveau : {{ levelLabel(filters.levelFilter()) }}</span>
          }
          @if (filters.query().trim()) {
            <span class="chip">Recherche : « {{ filters.query().trim() }} »</span>
          }
        </div>
      }

      <div class="stat-grid">
        <div class="stat card" [class.alert]="uptime() < 99.5">
          <mat-icon>dns</mat-icon>
          <span class="label">Disponibilité moyenne</span>
          <strong>{{ uptime().toFixed(2) }} %</strong>
          @if (filters.serviceFilter() !== 'all') {
            <span class="hint">{{ filters.serviceFilter() }}</span>
          }
        </div>
        <div class="stat card" [class.alert]="avgLatency() > settings().alertLatencyMs">
          <mat-icon>bolt</mat-icon>
          <span class="label">Latence moyenne</span>
          <strong>{{ avgLatency() }} ms</strong>
          <span class="hint">seuil {{ settings().alertLatencyMs }} ms</span>
        </div>
        <div class="stat card" [class.alert]="avgError() > settings().alertErrorRate">
          <mat-icon>error_outline</mat-icon>
          <span class="label">Taux d'erreur</span>
          <strong>{{ avgError().toFixed(2) }} %</strong>
          <span class="hint">seuil {{ settings().alertErrorRate }} %</span>
        </div>
        <div class="stat card">
          <mat-icon>qr_code_2</mat-icon>
          <span class="label">Codes QR en file</span>
          <strong>{{ pendingQr() }}</strong>
          <span class="hint">{{ paymentFailures() }} échecs · {{ openAlerts() }} alertes · {{ scopedEvents().length }} événements</span>
        </div>
      </div>

      <section class="card">
        <div class="card-head">
          <h2>État des services ({{ filteredServices().length }})</h2>
          @if (degradedCount() > 0) {
            <span class="badge warn">{{ degradedCount() }} service(s) dégradé(s)</span>
          }
        </div>
        <ul class="services">
          @for (service of filteredServices(); track service.name) {
            <li>
              <span class="dot" [class]="service.status"></span>
              <span class="name">{{ service.name }}</span>
              <span class="meta">Uptime {{ service.uptime }} %</span>
              <span class="meta" [class.alert]="service.latencyMs > settings().alertLatencyMs">
                {{ service.latencyMs }} ms
              </span>
              <span class="meta" [class.alert]="service.errorRate > settings().alertErrorRate">
                {{ service.errorRate }} % erreurs
              </span>
              <span class="badge" [class]="service.status">{{ statusLabel(service.status) }}</span>
            </li>
          }
          @if (!filteredServices().length) {
            <li class="empty">Aucun service pour ce filtre.</li>
          }
        </ul>
      </section>

      <div class="grid-2">
        <section class="card chart-card">
          <h2>Latence et taux d'erreur (24 h)</h2>
          @if (filters.storeFilter() !== 'all' || filters.serviceFilter() !== 'all') {
            <p class="desc">Série ajustée selon les filtres actifs</p>
          }
          <div class="chart-wrap">
            <canvas baseChart [type]="'line'" [data]="latencyChartData()" [options]="latencyChartOptions"></canvas>
          </div>
        </section>

        <section class="card chart-card">
          <h2>Sessions actives et volume de scans (24 h)</h2>
          @if (filters.storeFilter() !== 'all') {
            <p class="desc">Activité estimée pour {{ filters.storeName(filters.storeFilter()) }}</p>
          }
          <div class="chart-wrap">
            <canvas baseChart [type]="'line'" [data]="activityChartData()" [options]="activityChartOptions"></canvas>
          </div>
        </section>
      </div>

      <section class="card">
        <div class="card-head">
          <h2>Journal d'événements ({{ filteredEvents().length }})</h2>
          <span class="fresh">Dernière actualisation {{ lastRefreshLabel() }}</span>
        </div>
        <ul class="events">
          @for (event of filteredEvents(); track event.id) {
            <li>
              <mat-icon class="level" [class]="event.level">{{ levelIcon(event.level) }}</mat-icon>
              <div class="body">
                <p>{{ event.message }}</p>
                <span class="meta">
                  {{ event.service }} · {{ relativeTime(event.timestamp) }}
                  @if (event.storeId) {
                    · {{ filters.storeName(event.storeId) }}
                  }
                </span>
              </div>
              <span class="badge level-badge" [class]="event.level">{{ LEVEL_LABEL[event.level] }}</span>
              @if (event.acknowledged) {
                <span class="done">Traité</span>
              } @else {
                <button type="button" class="btn-action" (click)="acknowledge(event.id)">
                  <mat-icon>check</mat-icon>
                  Accuser réception
                </button>
              }
            </li>
          }
          @if (!filteredEvents().length) {
            <li class="empty">Aucun événement pour ce filtre.</li>
          }
        </ul>
      </section>
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 20px; padding-bottom: 24px; }
    .page-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 12px; }
    h1 {
      margin: 0; display: flex; align-items: center; gap: 8px;
      font-size: 1.5rem; font-weight: 600;
    }
    h1 mat-icon { color: rgb(var(--accent)); }
    .page-head p, .desc { margin: 4px 0 0; font-size: 14px; color: rgb(var(--muted)); }
    h2 { margin: 0; font-size: 1rem; font-weight: 600; }
    .card { padding: 16px; border-radius: 12px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); }
    .card-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; }
    .head-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .btn-outline, .btn-action {
      display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px;
      border-radius: 8px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface-2));
      font-size: 12px; font-weight: 600; cursor: pointer; color: rgb(var(--ink));
    }
    .btn-outline mat-icon, .btn-action mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .btn-outline:hover, .btn-action:hover { border-color: rgb(var(--accent)); color: rgb(var(--accent)); }
    .filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .filter-select {
      padding: 8px 12px; border-radius: 8px; border: 1px solid rgb(var(--line));
      background: rgb(var(--surface-2)); font-size: 12px; cursor: pointer;
    }
    .search-wrap { position: relative; flex: 1; min-width: 160px; max-width: 260px; }
    .search-wrap mat-icon {
      position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
      font-size: 16px; width: 16px; height: 16px; color: rgb(var(--muted));
    }
    .search-wrap input {
      width: 100%; padding: 8px 12px 8px 34px; border-radius: 8px;
      border: 1px solid rgb(var(--line)); background: rgb(var(--surface-2)); font-size: 12px; box-sizing: border-box;
    }
    .active-filters { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip {
      padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600;
      background: rgba(5, 150, 105, 0.1); color: #047857;
    }
    .stat-grid {
      display: grid; gap: 16px;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    }
    .stat { display: flex; flex-direction: column; gap: 4px; }
    .stat.alert { border-color: rgba(244,63,94,0.35); background: rgba(244,63,94,0.04); }
    .stat mat-icon { color: rgb(var(--accent)); font-size: 20px; width: 20px; height: 20px; }
    .stat .label { font-size: 12px; color: rgb(var(--muted)); }
    .stat strong { font-size: 1.125rem; }
    .stat .hint { font-size: 12px; color: rgb(var(--muted)); }
    .grid-2 { display: grid; gap: 20px; }
    @media (min-width: 1024px) { .grid-2 { grid-template-columns: 1fr 1fr; } }
    .services, .events { list-style: none; margin: 0; padding: 0; }
    .services li, .events li {
      display: flex; flex-wrap: wrap; align-items: center; gap: 12px;
      padding: 12px 0; border-top: 1px solid rgb(var(--line));
    }
    .services li:first-child, .events li:first-child { border-top: none; }
    .dot { width: 10px; height: 10px; border-radius: 999px; flex-shrink: 0; }
    .dot.operational { background: #10b981; }
    .dot.degraded { background: #f59e0b; }
    .dot.down { background: #f43f5e; }
    .name { flex: 1; min-width: 140px; font-size: 14px; font-weight: 500; }
    .meta { font-size: 12px; color: rgb(var(--muted)); }
    .meta.alert { color: #f43f5e; font-weight: 600; }
    .badge {
      display: inline-block; padding: 2px 10px; border-radius: 999px;
      font-size: 11px; font-weight: 600;
    }
    .badge.operational { background: #d1fae5; color: #065f46; }
    .badge.degraded, .badge.warn { background: #fef3c7; color: #92400e; }
    .badge.down { background: #fee2e2; color: #991b1b; }
    .chart-wrap { height: 256px; position: relative; }
    .chart-card h2 { margin-bottom: 4px; }
    .events .body { flex: 1; min-width: 180px; }
    .events .body p { margin: 0; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .level { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    .level.error { color: #f43f5e; }
    .level.warning { color: #f59e0b; }
    .level.success { color: #10b981; }
    .level.info { color: #0ea5e9; }
    .level-badge.error { background: #fee2e2; color: #991b1b; }
    .level-badge.warning { background: #fef3c7; color: #92400e; }
    .level-badge.info { background: #e0f2fe; color: #0369a1; }
    .level-badge.success { background: #d1fae5; color: #065f46; }
    .done { font-size: 12px; color: rgb(var(--muted)); }
    .fresh { font-size: 11px; color: rgb(var(--muted)); }
    .empty { justify-content: center; color: rgb(var(--muted)); font-size: 14px; border-top: none !important; }
  `],
})
export class ManagerMonitoringComponent implements OnInit, OnDestroy {
  private readonly data = inject(ManagerDataService);
  readonly filters = inject(ManagerMonitoringService);
  private readonly orders = inject(OrderService);
  private readonly theme = inject(ThemeService);
  private readonly snackBar = inject(MatSnackBar);

  readonly relativeTime = relativeTime;
  readonly filterTabs = FILTER_TABS;
  readonly LEVEL_LABEL = LEVEL_LABEL;
  readonly serviceNames = SERVICE_NAMES;
  readonly settings = this.theme.settings;

  eventsVersion = signal(0);
  lastRefresh = signal(Date.now());

  allServices = signal<ServiceHealth[]>([]);
  pendingQr = signal(0);

  private refreshTimer?: ReturnType<typeof setInterval>;

  events = computed(() => {
    this.eventsVersion();
    return [...this.data.getEvents()].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  });

  scopedEvents = computed(() => this.filters.filterScopedEvents(this.events()));

  filteredEvents = computed(() => this.filters.filterEvents(this.events()));

  filteredOpenCount = computed(() =>
    this.filteredEvents().filter((e) => !e.acknowledged).length,
  );

  filteredServices = computed(() => {
    const service = this.filters.serviceFilter();
    const list = this.allServices();
    return service === 'all' ? list : list.filter((s) => s.name === service);
  });

  openAlerts = computed(() =>
    this.scopedEvents().filter((e) => !e.acknowledged && e.level !== 'info' && e.level !== 'success').length,
  );

  degradedCount = computed(() => this.filteredServices().filter((s) => s.status !== 'operational').length);

  uptime = computed(() => {
    const list = this.filteredServices();
    return list.length ? list.reduce((a, s) => a + s.uptime, 0) / list.length : 0;
  });

  avgLatency = computed(() => {
    const list = this.filteredServices();
    return list.length ? Math.round(list.reduce((a, s) => a + s.latencyMs, 0) / list.length) : 0;
  });

  avgError = computed(() => {
    const list = this.filteredServices();
    return list.length ? list.reduce((a, s) => a + s.errorRate, 0) / list.length : 0;
  });

  paymentFailures = computed(() =>
    this.scopedEvents().filter((e) => e.service === 'Service Paiement' && e.level === 'error').length,
  );

  lastRefreshLabel = computed(() => relativeTime(new Date(this.lastRefresh()).toISOString()));

  latencyChartData = signal<ChartConfiguration<'line'>['data']>({ labels: [], datasets: [] });
  activityChartData = signal<ChartConfiguration<'line'>['data']>({ labels: [], datasets: [] });

  latencyChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'bottom' } },
    scales: {
      y: { type: 'linear', position: 'left', title: { display: true, text: 'ms' } },
      y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: '%' } },
    },
  };

  activityChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } },
  };

  constructor() {
    effect(() => {
      this.filters.storeFilter();
      this.filters.serviceFilter();
      this.buildCharts();
      this.refreshOrders();
    });
  }

  ngOnInit(): void {
    this.allServices.set(this.data.getServices());
    this.buildCharts();
    this.refreshOrders();
    this.refreshTimer = setInterval(() => this.refreshOrders(), 15000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  setTab(id: string): void {
    this.filters.tabFilter.set(id as MonitoringTabFilter);
  }

  statusLabel(status: ServiceHealth['status']): string {
    if (status === 'operational') return 'Opérationnel';
    if (status === 'degraded') return 'Dégradé';
    return 'Hors service';
  }

  levelIcon(level: EventLevel): string {
    if (level === 'success') return 'check_circle';
    if (level === 'info') return 'info';
    return 'error_outline';
  }

  levelLabel(level: EventLevel | 'all'): string {
    return level === 'all' ? 'Tous' : LEVEL_LABEL[level];
  }

  refresh(): void {
    this.lastRefresh.set(Date.now());
    this.refreshOrders();
    this.buildCharts();
    this.snackBar.open('Monitoring actualisé', 'OK', { duration: 2000 });
  }

  refreshOrders(): void {
    const storeId = this.filters.storeFilter();
    const params = storeId !== 'all' ? { storeId } : undefined;
    this.orders.getOrders(params).subscribe({
      next: (res) => {
        this.pendingQr.set((res.data ?? []).filter((o) => o.status === 'pending').length);
      },
      error: () => this.pendingQr.set(0),
    });
  }

  acknowledge(id: string): void {
    this.data.acknowledgeEvent(id);
    this.eventsVersion.update((v) => v + 1);
    this.snackBar.open('Événement marqué comme traité', 'OK', { duration: 2500 });
  }

  acknowledgeAll(): void {
    const ids = this.filteredEvents().filter((e) => !e.acknowledged).map((e) => e.id);
    const count = this.data.acknowledgeEvents(ids);
    this.eventsVersion.update((v) => v + 1);
    this.snackBar.open(`${count} événement(s) traité(s)`, 'OK', { duration: 2500 });
  }

  exportEvents(): void {
    const rows = this.filteredEvents();
    if (!rows.length) {
      this.snackBar.open('Aucun événement à exporter', 'OK', { duration: 2500 });
      return;
    }
    const header = 'timestamp,niveau,service,message,boutique,traite\n';
    const body = rows.map((e: MonitoringEvent) =>
      [
        e.timestamp,
        e.level,
        e.service,
        `"${e.message.replace(/"/g, '""')}"`,
        e.storeId ? this.filters.storeName(e.storeId) : '',
        e.acknowledged ? 'oui' : 'non',
      ].join(','),
    ).join('\n');
    downloadFile('boutika-monitoring.csv', header + body, 'text/csv');
    this.snackBar.open('Export CSV téléchargé', 'OK', { duration: 2500 });
  }

  private chartScale(): number {
    const storeId = this.filters.storeFilter();
    if (storeId === 'all') return 1;
    const idx = this.filters.stores().findIndex((s) => s.id === storeId);
    return 0.55 + ((idx >= 0 ? idx : 0) % 7) * 0.07;
  }

  private serviceScale(): number {
    const service = this.filters.serviceFilter();
    if (service === 'all') return 1;
    const idx = SERVICE_NAMES.indexOf(service);
    return 0.7 + (idx >= 0 ? idx : 0) * 0.05;
  }

  private buildCharts(): void {
    const scale = this.chartScale() * this.serviceScale();
    const series = this.data.getLatencySeries();
    this.latencyChartData.set({
      labels: series.map((p) => p.hour),
      datasets: [
        {
          label: 'Latence (ms)',
          data: series.map((p) => Math.round(p.latence * scale)),
          borderColor: 'rgb(5, 150, 105)',
          backgroundColor: 'transparent',
          tension: 0.3,
          pointRadius: 0,
          yAxisID: 'y',
        },
        {
          label: 'Erreurs (%)',
          data: series.map((p) => Math.round(p.erreurs * scale * 100) / 100),
          borderColor: '#f43f5e',
          backgroundColor: 'transparent',
          tension: 0.3,
          pointRadius: 0,
          yAxisID: 'y1',
        },
      ],
    });

    this.activityChartData.set({
      labels: series.map((p) => p.hour),
      datasets: [
        {
          label: 'Sessions',
          data: series.map((p) => Math.round((p.sessions ?? 0) * scale)),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
        },
        {
          label: 'Scans QR',
          data: series.map((p) => Math.round((p.scans ?? 0) * scale)),
          borderColor: 'rgb(5, 150, 105)',
          backgroundColor: 'rgba(5, 150, 105, 0.15)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
        },
      ],
    });
  }
}
