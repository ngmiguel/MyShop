import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MatIconModule } from '@angular/material/icon';
import { Order } from '../../../core/models';
import { CATEGORIES, categoryLabel } from '../../../core/data/categories';
import { ManagerDataService } from '../../../core/services/manager-data.service';
import { OrderService } from '../../../core/services/order.service';
import { MonitoringEvent } from '../../../core/data/demo-monitoring';
import { ManagerStore } from '../../../core/data/demo-manager-stores';
import {
  computeKpis,
  formatGrowth,
  groupByDay,
  groupSum,
  growth,
  movingAverage,
  SaleRecord,
} from '../../../core/utils/analytics.util';
import { formatMoney, relativeTime } from '../../../core/utils/format.util';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { SegmentedTabsComponent } from '../../../shared/components/segmented-tabs/segmented-tabs.component';

const MAP_BOUNDS = { minLat: 2, maxLat: 13, minLng: 8, maxLng: 16 };

const FUNNEL = [
  { step: 'Vues du fil', value: 100 },
  { step: 'Fiches article', value: 46 },
  { step: 'Ajouts au panier', value: 21 },
  { step: 'Paiements', value: 11 },
  { step: 'Retraits validés', value: 9 },
];

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    DecimalPipe,
    RouterLink,
    MatIconModule,
    BaseChartDirective,
    LoadingSpinnerComponent,
    SegmentedTabsComponent,
  ],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>Tableau de bord de l'enseigne</h1>
          <p class="subtitle">
            {{ stores().length }} boutiques · {{ activeSellers() }} vendeurs actifs ·
            {{ kpis().customers }} clients sur la période
          </p>
        </div>
        <div class="head-actions">
          <app-segmented-tabs
            size="sm"
            [items]="periods"
            [value]="period()"
            (valueChange)="period.set($event)"
          />
          <a routerLink="/manager/stores/new" class="btn-primary">
            <mat-icon>store</mat-icon>
            Nouvelle boutique
          </a>
        </div>
      </header>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-head">
              <span class="label">Chiffre d'affaires</span>
              <mat-icon>payments</mat-icon>
            </div>
            <strong>{{ formatMoney(kpis().revenue) }}</strong>
            <span class="delta" [class.up]="revGrowth() >= 0">{{ formatGrowth(revGrowth()) }}</span>
          </div>
          <div class="stat-card">
            <div class="stat-head">
              <span class="label">Marge brute</span>
              <mat-icon>percent</mat-icon>
            </div>
            <strong>{{ formatMoney(kpis().margin) }}</strong>
            <span class="hint">{{ kpis().marginRate | number:'1.1-1' }} %</span>
            <span class="delta" [class.up]="marginGrowth() >= 0">{{ formatGrowth(marginGrowth()) }}</span>
          </div>
          <div class="stat-card">
            <div class="stat-head">
              <span class="label">Transactions</span>
              <mat-icon>receipt_long</mat-icon>
            </div>
            <strong>{{ kpis().transactions }}</strong>
            <span class="delta" [class.up]="txGrowth() >= 0">{{ formatGrowth(txGrowth()) }}</span>
          </div>
          <div class="stat-card">
            <div class="stat-head">
              <span class="label">Panier moyen</span>
              <mat-icon>groups</mat-icon>
            </div>
            <strong>{{ formatMoney(kpis().averageBasket) }}</strong>
            <span class="delta" [class.up]="basketGrowth() >= 0">{{ formatGrowth(basketGrowth()) }}</span>
          </div>
        </div>

        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-head">
              <span class="label">Codes QR en attente</span>
              <mat-icon>qr_code_2</mat-icon>
            </div>
            <strong>{{ pendingQr() }}</strong>
          </div>
          <div class="stat-card">
            <div class="stat-head">
              <span class="label">Retraits validés</span>
              <mat-icon>check_circle</mat-icon>
            </div>
            <strong>{{ redeemed() }}</strong>
          </div>
          <div class="stat-card">
            <div class="stat-head">
              <span class="label">Taux d'expiration QR</span>
              <mat-icon>timer_off</mat-icon>
            </div>
            <strong>{{ expiryRate() | number:'1.1-1' }} %</strong>
            <span class="hint">objectif &lt; 8 %</span>
          </div>
          <div class="stat-card">
            <div class="stat-head">
              <span class="label">Alertes ouvertes</span>
              <mat-icon>monitor_heart</mat-icon>
            </div>
            <strong>{{ openAlertsCount() }}</strong>
          </div>
        </div>

        <section class="card chart-card">
          <div class="card-head">
            <h2>Tendance des ventes</h2>
            <p>Chiffre d'affaires quotidien et moyenne mobile 7 jours</p>
          </div>
          <div class="chart-wrap">
            <canvas baseChart [type]="'line'" [data]="areaChartData" [options]="areaChartOptions"></canvas>
          </div>
        </section>

        <div class="charts-grid">
          <section class="card chart-card">
            <h2>Répartition par catégorie</h2>
            <div class="chart-wrap">
              <canvas baseChart [type]="'doughnut'" [data]="pieChartData" [options]="pieChartOptions"></canvas>
            </div>
            <ul class="legend">
              @for (c of byCategory(); track c.name) {
                <li>
                  <span class="dot" [style.background-color]="c.color"></span>
                  {{ c.name }}
                </li>
              }
            </ul>
          </section>

          <section class="card chart-card">
            <h2>Comparaison entre boutiques</h2>
            <div class="chart-wrap">
              <canvas baseChart [type]="'bar'" [data]="barChartData" [options]="barChartOptions"></canvas>
            </div>
          </section>
        </div>

        <div class="bottom-grid">
          <section class="card map-card">
            <h2>Implantation &amp; poids des boutiques</h2>
            <div class="map-placeholder">
              <div class="map-grid"></div>
              @for (point of mapPoints(); track point.id) {
                <button
                  type="button"
                  class="map-pin"
                  [style.left.%]="point.x"
                  [style.top.%]="point.y"
                  [style.width.px]="point.size"
                  [style.height.px]="point.size"
                  [style.background-color]="point.color"
                  [title]="point.name + ' — ' + point.detail"
                ></button>
              }
            </div>
          </section>

          <div class="side-col">
            <section class="card">
              <div class="card-head">
                <h2>Entonnoir de conversion</h2>
                <p>Base 100 : vues du fil</p>
              </div>
              <ul class="funnel">
                @for (row of funnel; track row.step) {
                  <li>
                    <div class="funnel-row">
                      <span class="muted">{{ row.step }}</span>
                      <span class="funnel-value">{{ row.value }} %</span>
                    </div>
                    <div class="funnel-track">
                      <div class="funnel-fill" [style.width.%]="row.value"></div>
                    </div>
                  </li>
                }
              </ul>
            </section>

            <section class="card">
              <div class="card-head row">
                <h2>Alertes récentes</h2>
                <a routerLink="/manager/monitoring" class="link">Tout voir</a>
              </div>
              @if (openAlerts().length) {
                <ul class="alerts">
                  @for (event of openAlerts(); track event.id) {
                    <li class="alert-item">
                      <mat-icon [class.error]="event.level === 'error'">warning</mat-icon>
                      <div>
                        <p class="alert-msg">{{ event.message }}</p>
                        <p class="alert-meta">{{ event.service }} · {{ relativeTime(event.timestamp) }}</p>
                      </div>
                    </li>
                  }
                </ul>
              } @else {
                <div class="no-alerts">
                  <span class="badge-success">Aucune alerte ouverte</span>
                </div>
              }
            </section>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 0 24px 24px;
      max-width: 80rem;
    }
    .page-head {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 12px;
    }
    h1 { margin: 0; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em; }
    .subtitle { margin: 4px 0 0; font-size: 14px; color: rgb(var(--muted)); }
    .head-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 8px;
      background: rgb(var(--accent));
      color: white;
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
    }
    .btn-primary mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .stat-grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }
    @media (min-width: 1024px) {
      .stat-grid { grid-template-columns: repeat(4, 1fr); }
    }
    .stat-card {
      background: rgb(var(--surface));
      border: 1px solid rgb(var(--line));
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .stat-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .stat-head mat-icon { font-size: 18px; width: 18px; height: 18px; color: rgb(var(--accent)); }
    .label { font-size: 12px; color: rgb(var(--muted)); }
    .stat-card strong { font-size: 1.125rem; font-weight: 600; }
    .hint { font-size: 11px; color: rgb(var(--muted)); }
    .delta { font-size: 12px; color: rgb(var(--muted)); }
    .delta.up { color: #059669; }
    .card {
      background: rgb(var(--surface));
      border: 1px solid rgb(var(--line));
      border-radius: 12px;
      padding: 16px;
    }
    .card-head h2, .card > h2 { margin: 0; font-size: 1rem; font-weight: 600; }
    .card-head p { margin: 4px 0 0; font-size: 12px; color: rgb(var(--muted)); }
    .card-head.row { display: flex; justify-content: space-between; align-items: center; }
    .link { font-size: 12px; font-weight: 500; color: rgb(var(--accent)); text-decoration: none; }
    .link:hover { text-decoration: underline; }
    .chart-wrap { height: 288px; margin-top: 12px; }
    .charts-grid { display: grid; gap: 20px; }
    @media (min-width: 1024px) { .charts-grid { grid-template-columns: 1fr 1fr; } }
    .legend {
      margin: 8px 0 0;
      padding: 0;
      list-style: none;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      font-size: 11px;
      color: rgb(var(--muted));
    }
    .legend li { display: flex; align-items: center; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .bottom-grid { display: grid; gap: 20px; }
    @media (min-width: 1024px) { .bottom-grid { grid-template-columns: 2fr 1fr; } }
    .map-card { padding: 16px 16px 0; overflow: hidden; }
    .map-placeholder {
      position: relative;
      height: 340px;
      margin-top: 12px;
      background: linear-gradient(180deg, rgb(var(--surface-2)) 0%, rgb(var(--surface)) 100%);
      border-top: 1px solid rgb(var(--line));
    }
    .map-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgb(var(--line) / 0.35) 1px, transparent 1px),
        linear-gradient(90deg, rgb(var(--line) / 0.35) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    .map-pin {
      position: absolute;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgb(0 0 0 / 0.15);
      cursor: pointer;
      padding: 0;
      opacity: 0.75;
      transition: transform 0.15s, opacity 0.15s;
    }
    .map-pin:hover { transform: translate(-50%, -50%) scale(1.15); opacity: 1; z-index: 1; }
    .side-col { display: flex; flex-direction: column; gap: 20px; }
    .funnel { margin: 12px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .funnel-row { display: flex; justify-content: space-between; font-size: 12px; }
    .muted { color: rgb(var(--muted)); }
    .funnel-value { font-weight: 500; }
    .funnel-track { margin-top: 4px; height: 8px; border-radius: 999px; background: rgb(var(--surface-2)); overflow: hidden; }
    .funnel-fill { height: 100%; border-radius: 999px; background: rgb(var(--accent)); }
    .alerts { margin: 12px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .alert-item {
      display: flex;
      gap: 8px;
      padding: 10px;
      border: 1px solid rgb(var(--line));
      border-radius: 8px;
    }
    .alert-item mat-icon { font-size: 16px; width: 16px; height: 16px; color: #f59e0b; flex-shrink: 0; margin-top: 2px; }
    .alert-item mat-icon.error { color: #f43f5e; }
    .alert-msg { margin: 0; font-size: 12px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .alert-meta { margin: 2px 0 0; font-size: 11px; color: rgb(var(--muted)); }
    .no-alerts { padding: 16px 0; text-align: center; }
    .badge-success {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      background: rgb(5 150 105 / 0.12);
      color: #059669;
    }
  `],
})
export class ManagerDashboardComponent implements OnInit {
  private readonly managerData = inject(ManagerDataService);
  private readonly orderService = inject(OrderService);

  readonly formatMoney = formatMoney;
  readonly formatGrowth = formatGrowth;
  readonly relativeTime = relativeTime;
  readonly funnel = FUNNEL;

  readonly periods = [
    { id: '7', label: '7 j' },
    { id: '30', label: '30 j' },
    { id: '90', label: '90 j' },
    { id: '180', label: '180 j' },
  ];

  loading = signal(true);
  period = signal('30');
  sales = signal<SaleRecord[]>([]);
  orders = signal<Order[]>([]);
  stores = signal<ManagerStore[]>([]);
  events = signal<MonitoringEvent[]>([]);

  scope = computed(() => {
    const days = Number(this.period());
    const since = Date.now() - days * 86400000;
    return this.sales().filter((s) => new Date(s.date).getTime() >= since);
  });

  previous = computed(() => {
    const days = Number(this.period());
    const end = Date.now() - days * 86400000;
    const start = end - days * 86400000;
    return this.sales().filter((s) => {
      const t = new Date(s.date).getTime();
      return t >= start && t < end;
    });
  });

  kpis = computed(() => computeKpis(this.scope()));
  prevKpis = computed(() => computeKpis(this.previous()));
  revGrowth = computed(() => growth(this.kpis().revenue, this.prevKpis().revenue));
  marginGrowth = computed(() => growth(this.kpis().margin, this.prevKpis().margin));
  txGrowth = computed(() => growth(this.kpis().transactions, this.prevKpis().transactions));
  basketGrowth = computed(() => growth(this.kpis().averageBasket, this.prevKpis().averageBasket));

  activeSellers = computed(
    () => this.managerData.getSellers().filter((s) => s.status === 'active').length,
  );

  byCategory = computed(() =>
    groupSum(this.scope(), (s) => s.categoryId ?? 'unknown', (s) => s.revenue)
      .map((row) => ({
        name: categoryLabel(row.key),
        value: row.value,
        color: CATEGORIES.find((c) => c.id === row.key)?.color ?? '#64748b',
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
  );

  byStore = computed(() =>
    groupSum(this.scope(), (s) => s.storeId, (s) => s.revenue)
      .map((row) => ({
        name: this.stores().find((s) => s.id === row.key)?.name.slice(0, 22) ?? row.key,
        value: row.value,
      }))
      .sort((a, b) => b.value - a.value),
  );

  mapPoints = computed(() => {
    const scope = this.scope();
    const weights = this.stores().map((store) =>
      scope.filter((s) => s.storeId === store.id).reduce((a, s) => a + s.revenue, 0),
    );
    const maxWeight = Math.max(1, ...weights);

    return this.stores().map((store) => {
      const weight = scope.filter((s) => s.storeId === store.id).reduce((a, s) => a + s.revenue, 0);
      const ratio = weight / maxWeight;
      return {
        id: store.id,
        name: store.name,
        detail: `${formatMoney(weight)} sur la période`,
        x: ((store.lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100,
        y: ((MAP_BOUNDS.maxLat - store.lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100,
        size: Math.round(8 + ratio * 22),
        color: store.status === 'active' ? '#4338ca' : '#94a3b8',
      };
    });
  });

  pendingQr = computed(() => this.orders().filter((o) => o.status === 'pending').length);
  redeemed = computed(() => this.orders().filter((o) => o.status === 'redeemed').length);
  expiryRate = computed(() => {
    const list = this.orders();
    if (!list.length) return 0;
    const expired = list.filter((o) => o.status === 'expired').length;
    return (expired / list.length) * 100;
  });

  openAlertsCount = computed(
    () => this.events().filter((e) => !e.acknowledged && e.level !== 'info' && e.level !== 'success').length,
  );

  openAlerts = computed(() =>
    this.events()
      .filter((e) => !e.acknowledged && (e.level === 'error' || e.level === 'warning'))
      .slice(0, 5),
  );

  areaChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  areaChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatMoney(Number(ctx.raw))}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, maxRotation: 0 } },
      y: { ticks: { callback: (v) => `${Math.round(Number(v) / 1000)}k`, font: { size: 11 } } },
    },
  };

  pieChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }],
  };
  pieChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${formatMoney(Number(ctx.raw))}`,
        },
      },
    },
  };

  barChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => formatMoney(Number(ctx.raw)),
        },
      },
    },
    scales: {
      x: { ticks: { callback: (v) => `${Math.round(Number(v) / 1000)}k`, font: { size: 11 } } },
      y: { ticks: { font: { size: 10 } } },
    },
  };

  constructor() {
    effect(() => {
      this.period();
      this.scope();
      if (!this.loading()) this.updateCharts();
    });
  }

  ngOnInit(): void {
    this.sales.set(this.managerData.getSales());
    this.stores.set(this.managerData.getManagerStores());
    this.events.set(this.managerData.getEvents());

    this.orderService.getOrders().subscribe({
      next: (res) => {
        this.orders.set(res.data ?? []);
        this.updateCharts();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private updateCharts(): void {
    const series = movingAverage(groupByDay(this.scope()));

    this.areaChartData = {
      labels: series.map((p) => p.label),
      datasets: [
        {
          label: 'CA',
          data: series.map((p) => p.revenue),
          borderColor: '#4338ca',
          backgroundColor: 'rgba(67, 56, 202, 0.25)',
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'Moyenne 7 j',
          data: series.map((p) => p.moyenne ?? 0),
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    };

    const categories = this.byCategory();
    this.pieChartData = {
      labels: categories.map((c) => c.name),
      datasets: [{
        data: categories.map((c) => c.value),
        backgroundColor: categories.map((c) => c.color),
        borderWidth: 0,
      }],
    };

    const stores = this.byStore();
    this.barChartData = {
      labels: stores.map((s) => s.name),
      datasets: [{
        data: stores.map((s) => s.value),
        backgroundColor: '#4338ca',
        borderRadius: 4,
      }],
    };
  }
}
