import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ManagerDataService } from '../../../core/services/manager-data.service';
import { ManagerInsightsService } from '../../../core/services/manager-insights.service';
import { CATEGORIES, categoryLabel } from '../../../core/data/categories';
import { DEMO_PRODUCTS } from '../../../core/data/demo-catalog';
import {
  abcAnalysis,
  computeKpis,
  detectAnomalies,
  forecast,
  formatGrowth,
  groupByDay,
  groupSum,
  growth,
  retentionCohorts,
  rfmSegments,
  SaleRecord,
} from '../../../core/utils/analytics.util';
import { downloadFile } from '../../../core/utils/storage.util';
import { formatMoney } from '../../../core/utils/format.util';
import { SegmentedTabsComponent } from '../../../shared/components/segmented-tabs/segmented-tabs.component';
import { ManagerInsightsFiltersComponent } from '../../../shared/components/manager-insights-filters/manager-insights-filters.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PaymentMethod } from '../../../core/models';

const METHOD_LABELS: Record<PaymentMethod | 'unknown', string> = {
  mobile_money: 'Mobile Money',
  card: 'Carte bancaire',
  cash: 'Espèces',
  transfer: 'Virement',
  unknown: 'Autre',
};

function channelLabel(key: string): string {
  if (key === 'feed') return 'Fil';
  if (key === 'search') return 'Recherche';
  if (key === 'store_page') return 'Page boutique';
  if (key === 'recommendation') return 'Recommandation';
  return key;
}

@Component({
  selector: 'app-manager-analytics',
  standalone: true,
  imports: [
    DecimalPipe,
    BaseChartDirective,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    ManagerInsightsFiltersComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>Analyses</h1>
          <p>{{ scope().length }} transactions analysées sur {{ filters.period() }} j · marge {{ kpis().marginRate | number:'1.1-1' }} %</p>
        </div>
        <button type="button" class="btn-outline" (click)="exportCsv()">
          <mat-icon>download</mat-icon> Exporter CSV
        </button>
      </header>

      <app-manager-insights-filters />

      @if (!scope().length) {
        <app-empty-state
          icon="analytics"
          title="Aucune transaction"
          message="Ajustez la période ou les filtres pour afficher les analyses."
        />
      } @else {
      <div class="kpi-grid">
        <div class="kpi card">
          <mat-icon>trending_up</mat-icon>
          <span class="label">Chiffre d'affaires</span>
          <strong>{{ formatMoney(kpis().revenue) }}</strong>
          <span class="hint" [class.up]="revenueGrowth() >= 0" [class.down]="revenueGrowth() < 0">
            {{ formatGrowth(revenueGrowth()) }} vs période précédente
          </span>
        </div>
        <div class="kpi card">
          <mat-icon>account_balance_wallet</mat-icon>
          <span class="label">Marge brute</span>
          <strong>{{ formatMoney(kpis().margin) }}</strong>
          <span class="hint">{{ kpis().marginRate | number:'1.1-1' }} % du CA</span>
        </div>
        <div class="kpi card">
          <mat-icon>receipt_long</mat-icon>
          <span class="label">Transactions</span>
          <strong>{{ kpis().transactions }}</strong>
          <span class="hint">{{ kpis().units }} unités vendues</span>
        </div>
        <div class="kpi card">
          <mat-icon>shopping_bag</mat-icon>
          <span class="label">Panier moyen</span>
          <strong>{{ formatMoney(kpis().averageBasket) }}</strong>
          <span class="hint">{{ kpis().customers }} clients uniques</span>
        </div>
      </div>

      <section class="card chart-card">
        <h2>Série temporelle des ventes</h2>
        <p class="desc">Chiffre d'affaires et marge quotidiens</p>
        <div class="chart-wrap lg">
          <canvas baseChart [type]="'bar'" [data]="dailyChartData()" [options]="dailyChartOptions"></canvas>
        </div>
      </section>

      <div class="grid-2">
        <section class="card chart-card">
          <h2>Répartition par catégorie</h2>
          <div class="chart-wrap lg">
            <canvas baseChart [type]="'bar'" [data]="categoryChartData()" [options]="categoryChartOptions"></canvas>
          </div>
        </section>

        <section class="card chart-card">
          <h2>Heures et jours de pointe</h2>
          <p class="desc">Volume horaire (7h–19h) et répartition hebdomadaire</p>
          <div class="chart-wrap sm">
            <canvas baseChart [type]="'bar'" [data]="hourChartData()" [options]="barOptions"></canvas>
          </div>
          <div class="chart-wrap sm mt">
            <canvas baseChart [type]="'bar'" [data]="weekdayChartData()" [options]="weekdayBarOptions"></canvas>
          </div>
        </section>
      </div>

      <div class="grid-2">
        <section class="card chart-card">
          <h2>Origine des ventes</h2>
          <div class="chart-wrap md">
            <canvas baseChart [type]="'bar'" [data]="channelChartData()" [options]="channelChartOptions"></canvas>
          </div>
          <ul class="channel-list">
            @for (c of channels(); track c.name) {
              <li>
                <span class="muted">{{ c.name }}</span>
                <span class="strong">{{ formatMoney(c.value) }}</span>
              </li>
            }
          </ul>
        </section>

        <section class="card chart-card">
          <h2>Modes de paiement</h2>
          <div class="chart-wrap md">
            <canvas baseChart [type]="'doughnut'" [data]="paymentChartData()" [options]="doughnutOptions"></canvas>
          </div>
        </section>
      </div>

      <div class="grid-2">
        <section class="card">
          <h2>Courbe ABC des articles</h2>
          <p class="desc">Classe A : 70 % du chiffre d'affaires</p>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Article</th>
                  <th class="right">CA</th>
                  <th class="right">Part</th>
                  <th class="right">Cumul</th>
                  <th class="right">Classe</th>
                </tr>
              </thead>
              <tbody>
                @for (row of abc(); track row.key) {
                  <tr>
                    <td>{{ row.name }}</td>
                    <td class="right muted">{{ formatMoney(row.revenue) }}</td>
                    <td class="right muted">{{ row.share | number:'1.1-1' }} %</td>
                    <td class="right muted">{{ row.cumulative | number:'1.1-1' }} %</td>
                    <td class="right">
                      <span class="badge" [class]="row.classe">{{ row.classe }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <section class="card">
          <h2>Rétention par cohorte</h2>
          <p class="desc">Part de clients revenus les mois suivants</p>
          <div class="table-x">
            <table class="cohort">
              <thead>
                <tr>
                  <th>Cohorte</th>
                  <th class="right">Taille</th>
                  @for (m of monthCols; track m) {
                    <th class="right">M{{ m }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (cohort of cohorts(); track cohort.cohort) {
                  <tr>
                    <td>{{ cohort.cohort }}</td>
                    <td class="right muted">{{ cohort.size }}</td>
                    @for (v of cohort.values; track $index) {
                      <td class="right">
                        <span class="heat" [style.background]="heatBg(v)" [style.color]="v > 45 ? 'white' : 'rgb(var(--ink))'">
                          {{ v }} %
                        </span>
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div class="grid-2">
        <section class="card">
          <h2>Top boutiques</h2>
          <ul class="rank-list">
            @for (row of topStores(); track row.id) {
              <li>
                <span class="rank">{{ $index + 1 }}</span>
                <div class="rank-body">
                  <strong>{{ row.name }}</strong>
                  <span class="muted">{{ row.transactions }} ventes</span>
                </div>
                <span class="amount">{{ formatMoney(row.revenue) }}</span>
              </li>
            }
          </ul>
        </section>

        <section class="card">
          <h2>Top vendeurs</h2>
          <ul class="rank-list">
            @for (row of topSellers(); track row.id) {
              <li>
                <span class="rank">{{ $index + 1 }}</span>
                <div class="rank-body">
                  <strong>{{ row.name }}</strong>
                  <span class="muted">{{ filters.storeName(row.storeId) }}</span>
                </div>
                <span class="amount">{{ formatMoney(row.revenue) }}</span>
              </li>
            }
          </ul>
        </section>
      </div>

      <div class="grid-2">
        <section class="card">
          <div class="card-head">
            <h2>Détection d'anomalies</h2>
            @if (anomalies().length) {
              <span class="badge warn">{{ anomalies().length }} alerte(s)</span>
            }
          </div>
          @if (anomalies().length) {
            <ul class="alert-list">
              @for (a of anomalies(); track a.date) {
                <li>
                  <strong>{{ a.label }}</strong>
                  <span>{{ formatMoney(a.revenue) }} · attendu {{ formatMoney(a.expected) }}</span>
                  <span class="z">z={{ a.zScore }} · {{ a.severity }}</span>
                </li>
              }
            </ul>
          } @else {
            <p class="empty">Aucune anomalie détectée sur la période filtrée.</p>
          }
        </section>

        <section class="card">
          <h2>Segmentation RFM</h2>
          <ul class="rfm-list">
            @for (seg of rfm(); track seg.segment) {
              <li>
                <div class="rfm-head">
                  <strong>{{ seg.segment }}</strong>
                  <span>{{ seg.customers }} clients · {{ formatMoney(seg.revenue) }}</span>
                </div>
                <p>{{ seg.description }}</p>
              </li>
            }
          </ul>
        </section>
      </div>

      <section class="card chart-card">
        <div class="card-head">
          <h2>Prévision de ventes (14 jours)</h2>
          <span class="badge ok">Confiance {{ forecastConfidence() }} %</span>
        </div>
        <div class="chart-wrap lg">
          <canvas baseChart [type]="'line'" [data]="forecastChartData()" [options]="forecastChartOptions"></canvas>
        </div>
      </section>
      }
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 20px; padding-bottom: 24px; }
    .page-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 12px; }
    h1 { margin: 0; font-size: 1.5rem; font-weight: 600; }
    .page-head p, .desc { margin: 4px 0 0; font-size: 14px; color: rgb(var(--muted)); }
    h2 { margin: 0; font-size: 1rem; font-weight: 600; }
    .card { padding: 16px; border-radius: 12px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); }
    .card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .card-head h2 { margin: 0; }
    .head-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .btn-outline {
      display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px;
      border-radius: 8px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface-2));
      font-size: 13px; font-weight: 600; color: rgb(var(--ink)); cursor: pointer;
    }
    .btn-outline mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn-outline:hover { border-color: rgb(var(--accent)); color: rgb(var(--accent)); }
    .filters { display: flex; flex-wrap: wrap; gap: 8px; }
    .filter-select {
      padding: 8px 12px; border-radius: 8px; border: 1px solid rgb(var(--line));
      background: rgb(var(--surface-2)); font-size: 12px; color: rgb(var(--ink)); cursor: pointer;
    }
    .active-filters { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip {
      padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600;
      background: rgba(var(--accent), 0.1); color: rgb(var(--accent));
    }
    .kpi-grid { display: grid; gap: 12px; grid-template-columns: repeat(2, 1fr); }
    @media (min-width: 900px) { .kpi-grid { grid-template-columns: repeat(4, 1fr); } }
    .kpi { display: flex; flex-direction: column; gap: 4px; }
    .kpi mat-icon { font-size: 20px; width: 20px; height: 20px; color: rgb(var(--muted)); }
    .kpi .label { font-size: 12px; color: rgb(var(--muted)); }
    .kpi strong { font-size: 1.125rem; }
    .kpi .hint { font-size: 11px; color: rgb(var(--muted)); }
    .kpi .hint.up { color: #059669; }
    .kpi .hint.down { color: #be123c; }
    .chart-card .desc { margin-bottom: 12px; }
    .chart-wrap { height: 288px; position: relative; }
    .chart-wrap.lg { height: 288px; }
    .chart-wrap.md { height: 200px; }
    .chart-wrap.sm { height: 128px; }
    .chart-wrap.mt { margin-top: 16px; }
    .grid-2 { display: grid; gap: 20px; }
    @media (min-width: 1024px) { .grid-2 { grid-template-columns: 1fr 1fr; } }
    .table-scroll { max-height: 320px; overflow-y: auto; margin-top: 12px; }
    table { width: 100%; font-size: 14px; border-collapse: collapse; }
    thead { position: sticky; top: 0; background: rgb(var(--surface)); z-index: 1; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: rgb(var(--muted)); padding: 8px 0; }
    th.right, td.right { text-align: right; }
    tbody tr { border-top: 1px solid rgb(var(--line)); }
    td { padding: 8px 0; }
    .muted { color: rgb(var(--muted)); }
    .strong { font-weight: 600; }
    .badge {
      display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600;
    }
    .badge.A { background: #d1fae5; color: #065f46; }
    .badge.B { background: #fef3c7; color: #92400e; }
    .badge.C { background: rgb(var(--surface-2)); color: rgb(var(--muted)); }
    .badge.warn { background: rgba(217,119,6,0.12); color: #b45309; }
    .badge.ok { background: rgba(5,150,105,0.12); color: #047857; }
    .table-x { overflow-x: auto; margin-top: 12px; }
    .cohort { font-size: 12px; }
    .heat {
      display: inline-block; min-width: 3rem; padding: 2px 4px; border-radius: 4px;
      text-align: center; font-weight: 500;
    }
    .channel-list { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
    .channel-list li { display: flex; justify-content: space-between; font-size: 14px; }
    .rank-list { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .rank-list li { display: flex; align-items: center; gap: 12px; }
    .rank {
      width: 24px; height: 24px; border-radius: 999px; flex-shrink: 0;
      background: rgb(var(--surface-2)); font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .rank-body { flex: 1; min-width: 0; }
    .rank-body strong { display: block; font-size: 14px; }
    .rank-body .muted { font-size: 12px; }
    .amount { font-weight: 600; font-size: 14px; flex-shrink: 0; }
    .alert-list, .rfm-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .alert-list li, .rfm-list li { padding: 10px 12px; border-radius: 8px; background: rgb(var(--surface-2)); font-size: 13px; }
    .alert-list strong, .rfm-head strong { display: block; margin-bottom: 2px; }
    .alert-list span { display: block; color: rgb(var(--muted)); font-size: 12px; }
    .alert-list .z { font-size: 11px; margin-top: 4px; }
    .rfm-head { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
    .rfm-head span { font-size: 12px; color: rgb(var(--muted)); }
    .rfm-list p { margin: 0; font-size: 12px; color: rgb(var(--muted)); }
    .empty { margin: 12px 0 0; font-size: 14px; color: rgb(var(--muted)); }
  `],
})
export class ManagerAnalyticsComponent implements OnInit {
  private readonly data = inject(ManagerDataService);
  readonly filters = inject(ManagerInsightsService);
  private readonly snack = inject(MatSnackBar);

  readonly formatMoney = formatMoney;
  readonly formatGrowth = formatGrowth;
  readonly monthCols = [0, 1, 2, 3, 4, 5];

  sales = signal<SaleRecord[]>([]);

  scope = computed(() => this.filters.filterSales(this.sales()));

  prevScope = computed(() => {
    const days = Number(this.filters.period());
    const since = Date.now() - days * 2 * 86400000;
    const until = Date.now() - days * 86400000;
    return this.sales().filter((s) => {
      const t = new Date(s.date).getTime();
      return t >= since && t < until && this.filters.matchesFilters(s);
    });
  });

  kpis = computed(() => computeKpis(this.scope()));
  revenueGrowth = computed(() => growth(this.kpis().revenue, computeKpis(this.prevScope()).revenue));

  activeFilterCount = computed(() => this.filters.activeFilterCount());

  abc = computed(() =>
    abcAnalysis(groupSum(this.scope(), (s) => s.productId, (s) => s.revenue))
      .slice(0, 14)
      .map((row) => ({
        ...row,
        name: DEMO_PRODUCTS.find((p) => p.id === row.key)?.name?.slice(0, 24) ?? row.key,
      })),
  );

  cohorts = computed(() => retentionCohorts(this.scope()).slice(-6));

  channels = computed(() =>
    groupSum(this.scope(), (s) => s.channel ?? 'unknown', (s) => s.revenue)
      .map((r) => ({ name: channelLabel(r.key), value: r.value }))
      .sort((a, b) => b.value - a.value),
  );

  anomalies = computed(() => detectAnomalies(groupByDay(this.scope())).slice(0, 6));

  rfm = computed(() => rfmSegments(this.scope()));

  forecastConfidence = computed(() => forecast(groupByDay(this.scope()), 14).confidence);

  topStores = computed(() => {
    const map = groupSum(this.scope(), (s) => s.storeId, (s) => s.revenue);
    const tx = groupSum(this.scope(), (s) => s.storeId, () => 1);
    return map
      .map((r) => ({
        id: r.key,
        name: this.filters.storeName(r.key),
        revenue: r.value,
        transactions: tx.find((t) => t.key === r.key)?.value ?? 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  });

  topSellers = computed(() =>
    groupSum(this.scope(), (s) => s.sellerId, (s) => s.revenue)
      .map((r) => ({
        id: r.key,
        name: this.filters.sellerName(r.key),
        storeId: this.scope().find((s) => s.sellerId === r.key)?.storeId ?? '',
        revenue: r.value,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5),
  );

  dailyChartData = signal<ChartConfiguration['data']>({ labels: [], datasets: [] });
  categoryChartData = signal<ChartConfiguration<'bar'>['data']>({ labels: [], datasets: [] });
  hourChartData = signal<ChartConfiguration<'bar'>['data']>({ labels: [], datasets: [] });
  weekdayChartData = signal<ChartConfiguration<'bar'>['data']>({ labels: [], datasets: [] });
  channelChartData = signal<ChartConfiguration<'bar'>['data']>({ labels: [], datasets: [] });
  paymentChartData = signal<ChartConfiguration<'doughnut'>['data']>({ labels: [], datasets: [] });
  forecastChartData = signal<ChartConfiguration<'line'>['data']>({ labels: [], datasets: [] });

  dailyChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (ctx) => formatMoney(Number(ctx.raw)) } } },
    scales: { y: { ticks: { callback: (v) => `${Math.round(Number(v) / 1000)}k` } } },
  };

  categoryChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => formatMoney(Number(ctx.raw)) } } },
    scales: { x: { ticks: { callback: (v) => `${Math.round(Number(v) / 1000)}k` } } },
  };

  barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => formatMoney(Number(ctx.raw)) } } },
  };

  weekdayBarOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => formatMoney(Number(ctx.raw)) } } },
  };

  channelChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => formatMoney(Number(ctx.raw)) } } },
  };

  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  forecastChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (ctx) => formatMoney(Number(ctx.raw)) } } },
    scales: { y: { ticks: { callback: (v) => `${Math.round(Number(v) / 1000)}k` } } },
  };

  constructor() {
    effect(() => {
      this.filters.period();
      this.filters.storeFilter();
      this.filters.categoryFilter();
      this.filters.sellerFilter();
      this.filters.channelFilter();
      this.sales();
      this.scope();
      this.updateCharts();
    });
  }

  ngOnInit(): void {
    this.sales.set(this.data.getSales());
    this.filters.loadSellers();
    this.updateCharts();
  }

  exportCsv(): void {
    const rows = this.scope();
    if (!rows.length) {
      this.snack.open('Aucune donnée à exporter', 'OK', { duration: 2500 });
      return;
    }
    const header = 'date,boutique,vendeur,produit,categorie,canal,paiement,quantite,ca,cout\n';
    const body = rows.map((s) =>
      [
        s.date.slice(0, 10),
        s.storeId,
        s.sellerId,
        s.productId,
        s.categoryId ?? '',
        s.channel ?? '',
        s.paymentMethod ?? '',
        s.quantity,
        s.revenue,
        s.cost,
      ].join(','),
    ).join('\n');
    downloadFile(`boutika-analyses-${this.filters.period()}j.csv`, header + body, 'text/csv');
    this.snack.open('Export CSV téléchargé', 'OK', { duration: 2500 });
  }

  heatBg(v: number): string {
    const opacity = Math.min(0.85, v / 100 + 0.05);
    return `rgba(5, 150, 105, ${opacity})`;
  }

  private updateCharts(): void {
    const scope = this.scope();
    if (!scope.length) {
      this.dailyChartData.set({ labels: [], datasets: [] });
      this.categoryChartData.set({ labels: [], datasets: [] });
      this.hourChartData.set({ labels: [], datasets: [] });
      this.weekdayChartData.set({ labels: [], datasets: [] });
      this.channelChartData.set({ labels: [], datasets: [] });
      this.paymentChartData.set({ labels: [], datasets: [] });
      this.forecastChartData.set({ labels: [], datasets: [] });
      return;
    }
    const daily = groupByDay(scope);

    this.dailyChartData.set({
      labels: daily.map((p) => p.label),
      datasets: [
        {
          type: 'bar',
          label: 'CA',
          data: daily.map((p) => p.revenue),
          backgroundColor: 'rgb(5, 150, 105)',
          borderRadius: 3,
          order: 2,
        },
        {
          type: 'line',
          label: 'Marge',
          data: daily.map((p) => p.margin),
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          tension: 0.3,
          pointRadius: 0,
          order: 1,
        },
      ],
    });

    const byCategory = groupSum(scope, (s) => s.categoryId ?? 'unknown', (s) => s.revenue)
      .map((r) => ({
        name: categoryLabel(r.key),
        value: r.value,
        color: CATEGORIES.find((c) => c.id === r.key)?.color ?? '#64748b',
      }))
      .sort((a, b) => b.value - a.value);

    this.categoryChartData.set({
      labels: byCategory.map((c) => c.name),
      datasets: [{ data: byCategory.map((c) => c.value), backgroundColor: byCategory.map((c) => c.color), borderRadius: 4 }],
    });

    const hourMap = new Map<number, number>();
    scope.forEach((s) => hourMap.set(s.hour, (hourMap.get(s.hour) ?? 0) + s.revenue));
    const hours = Array.from({ length: 13 }, (_, i) => ({ hour: `${i + 7}h`, value: hourMap.get(i + 7) ?? 0 }));
    this.hourChartData.set({
      labels: hours.map((h) => h.hour),
      datasets: [{ data: hours.map((h) => h.value), backgroundColor: 'rgb(5, 150, 105)', borderRadius: 3 }],
    });

    const weekdayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const dayMap = new Map<number, number>();
    scope.forEach((s) => {
      const d = new Date(s.date).getDay();
      dayMap.set(d, (dayMap.get(d) ?? 0) + s.revenue);
    });
    this.weekdayChartData.set({
      labels: weekdayLabels,
      datasets: [{ data: weekdayLabels.map((_, i) => dayMap.get(i) ?? 0), backgroundColor: '#6366f1', borderRadius: 3 }],
    });

    const channelRows = this.channels();
    this.channelChartData.set({
      labels: channelRows.map((c) => c.name),
      datasets: [{ data: channelRows.map((c) => c.value), backgroundColor: '#6366f1', borderRadius: 4 }],
    });

    const payments = groupSum(scope, (s) => s.paymentMethod ?? 'unknown', (s) => s.revenue)
      .sort((a, b) => b.value - a.value);
    const payColors = ['#059669', '#6366f1', '#f59e0b', '#f43f5e', '#64748b'];
    this.paymentChartData.set({
      labels: payments.map((p) => METHOD_LABELS[p.key as PaymentMethod] ?? p.key),
      datasets: [{
        data: payments.map((p) => p.value),
        backgroundColor: payments.map((_, i) => payColors[i % payColors.length]),
      }],
    });

    const hist = groupByDay(scope);
    const proj = forecast(hist, 14);
    const histTail = hist.slice(-14);
    this.forecastChartData.set({
      labels: [...histTail.map((p) => p.label), ...proj.points.map((p) => p.label)],
      datasets: [
        {
          label: 'Historique',
          data: [...histTail.map((p) => p.revenue), ...Array(proj.points.length).fill(null)],
          borderColor: 'rgb(5, 150, 105)',
          tension: 0.3,
          pointRadius: 0,
        },
        {
          label: 'Prévision',
          data: [...Array(histTail.length).fill(null), ...proj.points.map((p) => p.prevision)],
          borderColor: '#6366f1',
          borderDash: [6, 4],
          tension: 0.3,
          pointRadius: 0,
        },
      ],
    });
  }
}
