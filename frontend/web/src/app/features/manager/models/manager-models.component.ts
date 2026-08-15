import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CatalogService } from '../../../core/services/catalog.service';
import { LocalOrderService } from '../../../core/services/local-order.service';
import { ManagerDataService } from '../../../core/services/manager-data.service';
import { ManagerInsightsService } from '../../../core/services/manager-insights.service';
import { ThemeService } from '../../../core/services/theme.service';
import { getSellerById } from '../../../core/data/demo-sellers';
import {
  detectAnomalies,
  forecast,
  groupByDay,
  groupSum,
  rfmSegments,
  SaleRecord,
} from '../../../core/utils/analytics.util';
import { downloadFile } from '../../../core/utils/storage.util';
import { categoryLabel } from '../../../core/data/categories';
import { formatMoney, relativeTime } from '../../../core/utils/format.util';
import { Order, Product, Seller } from '../../../core/models';
import { ManagerInsightsFiltersComponent } from '../../../shared/components/manager-insights-filters/manager-insights-filters.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

interface StockRiskRow {
  product: Product;
  perDay: number;
  days: number;
  score: number;
}

interface AttritionRow {
  seller: Seller;
  recent: number;
  handled: number;
  risk: number;
}

interface ModelMeta {
  id: string;
  title: string;
  confidence: number;
  icon: string;
}

@Component({
  selector: 'app-manager-models',
  standalone: true,
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    BaseChartDirective,
    ManagerInsightsFiltersComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>
            <mat-icon>psychology</mat-icon>
            Modèles prédictifs
          </h1>
          <p>
            Calculés côté application sur l'historique des {{ filters.stores().length }} boutiques.
            Recalcul automatique toutes les {{ theme.settings().modelRefreshHours }} h.
          </p>
        </div>
        <div class="head-actions">
          <button type="button" class="btn-outline" (click)="recalculate()">
            <mat-icon>refresh</mat-icon> Recalculer
          </button>
          <button type="button" class="btn-outline" (click)="exportReport()">
            <mat-icon>download</mat-icon> Exporter
          </button>
        </div>
      </header>

      <app-manager-insights-filters />

      @if (!scopedSales().length) {
        <app-empty-state
          icon="psychology"
          title="Données insuffisantes"
          message="Élargissez la période ou réinitialisez les filtres pour alimenter les modèles."
        />
      } @else {
      <div class="model-overview">
        @for (m of modelCards(); track m.id) {
          <div class="overview-card card">
            <mat-icon>{{ m.icon }}</mat-icon>
            <span class="label">{{ m.title }}</span>
            <span class="badge" [class]="confidenceTone(m.confidence)">{{ m.confidence }} %</span>
          </div>
        }
      </div>

      <p class="freshness-line">
        <mat-icon>schedule</mat-icon>
        Dernier recalcul {{ lastRefreshLabel() }} · fraîcheur modèles : {{ freshness() }}
      </p>

      <section class="card chart-section">
        <div class="card-head">
          <div>
            <h2>Prévision de ventes à 30 jours</h2>
            <p class="desc">Régression linéaire + saisonnalité hebdomadaire, intervalle à 80 %</p>
          </div>
          <div class="model-meta">
            <span class="badge" [class]="confidenceTone(projection().confidence)">
              Confiance {{ projection().confidence }} %
            </span>
            <span class="fresh">{{ freshness() }}</span>
          </div>
        </div>
        <div class="chart-wrap xl">
          <canvas baseChart [type]="'line'" [data]="forecastChartData()" [options]="forecastChartOptions"></canvas>
        </div>
      </section>

      <div class="grid-2">
        <section class="card">
          <div class="card-head">
            <div>
              <h2>Détection d'anomalies</h2>
              <p class="desc">Écart-type sur le CA quotidien (|z| &gt; 2,2)</p>
            </div>
            <div class="model-meta">
              <span class="badge" [class]="confidenceTone(82)">Confiance 82 %</span>
              <span class="fresh">{{ freshness() }}</span>
            </div>
          </div>
          @if (anomalies().length) {
            <ul class="item-list">
              @for (a of anomalies(); track a.date) {
                <li>
                  <mat-icon [class.danger]="a.severity === 'haute'" [class.warn]="a.severity !== 'haute'">
                    {{ a.severity === 'haute' ? 'error' : 'warning' }}
                  </mat-icon>
                  <div class="body">
                    <strong>{{ a.label }}</strong>
                    <span>{{ formatMoney(a.revenue) }} contre {{ formatMoney(a.expected) }} attendus</span>
                  </div>
                  <span class="badge sm" [class]="a.severity === 'haute' ? 'danger' : 'warning'">z = {{ a.zScore }}</span>
                </li>
              }
            </ul>
          } @else {
            <p class="empty">Aucune anomalie détectée sur la période.</p>
          }
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <h2>Risque de rupture de stock</h2>
              <p class="desc">Vitesse d'écoulement sur 30 jours rapportée au stock restant</p>
            </div>
            <div class="model-meta">
              <span class="badge" [class]="confidenceTone(74)">Confiance 74 %</span>
              <span class="fresh">{{ freshness() }}</span>
            </div>
          </div>
          <ul class="item-list">
            @for (row of stockRisk(); track row.product.id) {
              <li class="stacked">
                <div class="row-top">
                  <strong>{{ row.product.name }}</strong>
                  <span class="badge sm" [class]="scoreTone(row.score)">{{ row.score }} / 100</span>
                </div>
                <span class="sub">
                  <mat-icon>inventory_2</mat-icon>
                  {{ row.product.stock }} en stock · {{ row.perDay | number:'1.1-1' }} vendus/jour ·
                  {{ row.days > 60 ? '60+' : (row.days | number:'1.0-0') }} jours de couverture
                </span>
              </li>
            }
          </ul>
        </section>
      </div>

      <div class="grid-2">
        <section class="card">
          <div class="card-head">
            <div>
              <h2>Segmentation client RFM</h2>
              <p class="desc">Récence, fréquence, montant</p>
            </div>
            <div class="model-meta">
              <span class="badge" [class]="confidenceTone(88)">Confiance 88 %</span>
              <span class="fresh">{{ freshness() }}</span>
            </div>
          </div>
          <ul class="item-list">
            @for (seg of rfm(); track seg.segment) {
              <li>
                <mat-icon>groups</mat-icon>
                <div class="body">
                  <strong>{{ seg.segment }}</strong>
                  <span>{{ seg.description }}</span>
                </div>
                <div class="right">
                  <strong>{{ seg.customers }}</strong>
                  <span>{{ formatMoney(seg.revenue) }}</span>
                </div>
              </li>
            }
          </ul>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <h2>Impact des recommandations</h2>
              <p class="desc">CA attribué au moteur de recommandation</p>
            </div>
            <div class="model-meta">
              <span class="badge" [class]="confidenceTone(69)">Confiance 69 %</span>
              <span class="fresh">{{ freshness() }}</span>
            </div>
          </div>
          <div class="chart-wrap md">
            <canvas baseChart [type]="'bar'" [data]="recommendChartData()" [options]="recommendChartOptions"></canvas>
          </div>
          <p class="hint">
            <mat-icon>auto_awesome</mat-icon>
            Les préférences déclarées à l'onboarding pondèrent le fil « Pour vous ».
          </p>
        </section>
      </div>

      <section class="card">
        <div class="card-head">
          <div>
            <h2>Risque d'attrition vendeur</h2>
            <p class="desc">Activité récente, note et temps de remise</p>
          </div>
          <div class="model-meta">
            <span class="badge" [class]="confidenceTone(61)">Confiance 61 %</span>
            <span class="fresh">{{ freshness() }}</span>
          </div>
        </div>
        <ul class="attrition-grid">
          @for (row of attrition(); track row.seller.id) {
            <li>
              <div class="row-top">
                <strong>{{ row.seller.firstName }} {{ row.seller.lastName }}</strong>
                <span class="badge sm" [class]="scoreTone(row.risk)">{{ row.risk }} %</span>
              </div>
              <span class="sub">
                <mat-icon>person_off</mat-icon>
                {{ row.recent }} ventes sur 30 j · {{ row.handled }} retraits · note {{ (row.seller.rating ?? 0) | number:'1.1-1' }}
              </span>
            </li>
          }
        </ul>
      </section>

      <section class="card extras">
        <h2>Signaux complémentaires</h2>
        <div class="extras-grid">
          <div class="extra">
            <mat-icon>shield</mat-icon>
            <strong>{{ fraudAlerts() }}</strong>
            <span>alertes fraude potentielle</span>
          </div>
          <div class="extra">
            <mat-icon>trending_up</mat-icon>
            <strong>{{ formatMoney(recommendTotal()) }}</strong>
            <span>CA recommandations (90 j)</span>
          </div>
          <div class="extra">
            <mat-icon>inventory</mat-icon>
            <strong>{{ criticalStock() }}</strong>
            <span>articles à risque élevé</span>
          </div>
          <div class="extra">
            <mat-icon>groups</mat-icon>
            <strong>{{ atRiskSellers() }}</strong>
            <span>vendeurs à surveiller</span>
          </div>
        </div>
      </section>
      }
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 20px; padding-bottom: 24px; }
    .page-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 12px; }
    h1 {
      display: flex; align-items: center; gap: 8px; margin: 0;
      font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em;
    }
    h1 mat-icon { color: rgb(var(--accent)); }
    .page-head p, .desc { margin: 4px 0 0; font-size: 14px; color: rgb(var(--muted)); }
    h2 { margin: 0; font-size: 1rem; font-weight: 600; }
    .card { padding: 16px; border-radius: 12px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); }
    .card-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .head-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .filter-select {
      padding: 8px 12px; border-radius: 8px; border: 1px solid rgb(var(--line));
      background: rgb(var(--surface-2)); font-size: 12px; cursor: pointer;
    }
    .btn-outline {
      display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px;
      border-radius: 8px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface-2));
      font-size: 13px; font-weight: 600; cursor: pointer; color: rgb(var(--ink));
    }
    .btn-outline mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn-outline:hover { border-color: rgb(var(--accent)); color: rgb(var(--accent)); }
    .model-overview {
      display: grid; gap: 10px; grid-template-columns: repeat(2, 1fr);
    }
    @media (min-width: 768px) { .model-overview { grid-template-columns: repeat(3, 1fr); } }
    @media (min-width: 1100px) { .model-overview { grid-template-columns: repeat(6, 1fr); } }
    .overview-card {
      display: flex; flex-direction: column; gap: 6px; align-items: flex-start; padding: 12px;
    }
    .overview-card mat-icon { font-size: 20px; width: 20px; height: 20px; color: rgb(var(--accent)); }
    .overview-card .label { font-size: 11px; color: rgb(var(--muted)); line-height: 1.3; }
    .freshness-line {
      display: flex; align-items: center; gap: 6px; margin: 0;
      font-size: 12px; color: rgb(var(--muted));
    }
    .freshness-line mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .model-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .fresh { font-size: 11px; color: rgb(var(--muted)); }
    .badge {
      display: inline-block; padding: 4px 10px; border-radius: 999px;
      font-size: 11px; font-weight: 600;
    }
    .badge.sm { padding: 2px 8px; font-size: 10px; }
    .badge.success { background: rgba(5,150,105,0.12); color: #047857; }
    .badge.warning { background: rgba(245,158,11,0.15); color: #b45309; }
    .badge.danger { background: rgba(244,63,94,0.15); color: #be123c; }
    .chart-wrap { position: relative; }
    .chart-wrap.xl { height: 320px; }
    .chart-wrap.md { height: 224px; }
    .grid-2 { display: grid; gap: 20px; }
    @media (min-width: 1024px) { .grid-2 { grid-template-columns: 1fr 1fr; } }
    .item-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .item-list li {
      display: flex; align-items: center; gap: 12px; padding: 12px;
      border: 1px solid rgb(var(--line)); border-radius: 8px; font-size: 13px;
    }
    .item-list li.stacked { flex-direction: column; align-items: stretch; gap: 6px; }
    .item-list mat-icon { flex-shrink: 0; font-size: 18px; width: 18px; height: 18px; color: rgb(var(--accent)); }
    .item-list mat-icon.danger { color: #be123c; }
    .item-list mat-icon.warn { color: #b45309; }
    .item-list .body { flex: 1; min-width: 0; }
    .item-list .body strong, .row-top strong { display: block; margin-bottom: 2px; }
    .item-list .body span, .sub { font-size: 12px; color: rgb(var(--muted)); }
    .item-list .right { text-align: right; flex-shrink: 0; }
    .item-list .right strong { display: block; font-size: 14px; }
    .item-list .right span { font-size: 11px; color: rgb(var(--muted)); }
    .row-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; width: 100%; }
    .sub { display: flex; align-items: center; gap: 4px; }
    .sub mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .empty { margin: 0; font-size: 14px; color: rgb(var(--muted)); padding: 8px 0; }
    .hint {
      display: flex; align-items: center; gap: 6px; margin: 12px 0 0;
      font-size: 12px; color: rgb(var(--muted));
    }
    .hint mat-icon { font-size: 14px; width: 14px; height: 14px; color: rgb(var(--accent)); }
    .attrition-grid {
      list-style: none; margin: 0; padding: 0;
      display: grid; gap: 8px; grid-template-columns: 1fr;
    }
    @media (min-width: 640px) { .attrition-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1024px) { .attrition-grid { grid-template-columns: repeat(3, 1fr); } }
    .attrition-grid li { padding: 12px; border: 1px solid rgb(var(--line)); border-radius: 8px; }
    .extras-grid {
      display: grid; gap: 12px; grid-template-columns: repeat(2, 1fr); margin-top: 12px;
    }
    @media (min-width: 768px) { .extras-grid { grid-template-columns: repeat(4, 1fr); } }
    .extra {
      padding: 14px; border-radius: 8px; background: rgb(var(--surface-2));
      display: flex; flex-direction: column; gap: 4px;
    }
    .extra mat-icon { font-size: 20px; width: 20px; height: 20px; color: rgb(var(--muted)); }
    .extra strong { font-size: 1.125rem; }
    .extra span { font-size: 12px; color: rgb(var(--muted)); }
  `],
})
export class ManagerModelsComponent implements OnInit {
  readonly theme = inject(ThemeService);
  readonly filters = inject(ManagerInsightsService);
  private readonly data = inject(ManagerDataService);
  private readonly catalog = inject(CatalogService);
  private readonly localOrders = inject(LocalOrderService);
  private readonly snack = inject(MatSnackBar);

  readonly formatMoney = formatMoney;

  lastRefresh = signal(Date.now());
  sales = signal<SaleRecord[]>([]);
  products = signal<Product[]>([]);
  sellers = signal<Seller[]>([]);
  orders = signal<Order[]>([]);

  scopedSales = computed(() => this.filters.filterSales(this.sales()));

  daily = computed(() => groupByDay(this.scopedSales()));
  projection = computed(() => forecast(this.daily(), 30));

  freshness = computed(() =>
    relativeTime(new Date(Date.now() - this.theme.settings().modelRefreshHours * 1800000).toISOString()),
  );

  lastRefreshLabel = computed(() => relativeTime(new Date(this.lastRefresh()).toISOString()));

  anomalies = computed(() => detectAnomalies(this.daily()).slice(0, 6));
  rfm = computed(() => rfmSegments(this.scopedSales()));

  stockRisk = computed((): StockRiskRow[] => {
    const velocity = new Map<string, number>();
    this.scopedSales()
      .filter((s) => Date.now() - new Date(s.date).getTime() < 30 * 86400000)
      .forEach((s) => velocity.set(s.productId, (velocity.get(s.productId) ?? 0) + s.quantity));

    const store = this.filters.storeFilter();
    const products = store === 'all'
      ? this.products()
      : this.products().filter((p) => p.storeId === store);

    return products
      .map((p) => {
        const perDay = (velocity.get(p.id) ?? 0) / 30;
        const days = perDay > 0 ? p.stock / perDay : p.stock > 0 ? 99 : 0;
        return {
          product: p,
          perDay,
          days,
          score: Math.max(0, Math.min(100, Math.round(100 - days * 6))),
        };
      })
      .filter((r) => r.perDay > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  });

  recommendations = computed(() =>
    groupSum(
      this.scopedSales().filter((s) => s.channel === 'recommendation'),
      (s) => s.categoryId ?? 'unknown',
      (s) => s.revenue,
    )
      .map((r) => ({ name: categoryLabel(r.key), value: r.value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6),
  );

  attrition = computed((): AttritionRow[] => {
    const sales = this.scopedSales();
    const orders = this.orders();
    const store = this.filters.storeFilter();
    const sellers = this.sellers().filter((s) => {
      if (s.status !== 'active') return false;
      return store === 'all' || s.storeId === store;
    });

    return sellers
      .map((seller) => {
        const recent = sales.filter(
          (s) => s.sellerId === seller.id && Date.now() - new Date(s.date).getTime() < 30 * 86400000,
        ).length;
        const handled = orders.filter(
          (o) => o.sellerId === seller.id && (o.status === 'redeemed' || o.status === 'rated'),
        ).length;
        const profile = getSellerById(seller.id);
        const handover = profile?.avgHandoverMinutes ?? 5;
        const risk = Math.max(
          0,
          Math.min(
            100,
            Math.round(60 - recent * 1.6 - (seller.rating ?? 4) * 6 + (handover > 6 ? 15 : 0) - handled * 0.5),
          ),
        );
        return { seller, recent, handled, risk };
      })
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 6);
  });

  modelCards = computed((): ModelMeta[] => [
    { id: 'forecast', title: 'Prévision ventes', confidence: this.projection().confidence, icon: 'show_chart' },
    { id: 'anomaly', title: 'Anomalies', confidence: 82, icon: 'warning_amber' },
    { id: 'stock', title: 'Rupture stock', confidence: 74, icon: 'inventory_2' },
    { id: 'rfm', title: 'Segmentation RFM', confidence: 88, icon: 'groups' },
    { id: 'reco', title: 'Recommandations', confidence: 69, icon: 'auto_awesome' },
    { id: 'attrition', title: 'Attrition vendeur', confidence: 61, icon: 'person_off' },
  ]);

  fraudAlerts = computed(() => this.anomalies().filter((a) => a.severity === 'haute').length);
  recommendTotal = computed(() =>
    this.scopedSales()
      .filter((s) => s.channel === 'recommendation' && Date.now() - new Date(s.date).getTime() < 90 * 86400000)
      .reduce((a, s) => a + s.revenue, 0),
  );
  criticalStock = computed(() => this.stockRisk().filter((r) => r.score > 70).length);
  atRiskSellers = computed(() => this.attrition().filter((r) => r.risk > 50).length);

  forecastChartData = signal<ChartConfiguration<'line'>['data']>({ labels: [], datasets: [] });
  recommendChartData = signal<ChartConfiguration<'bar'>['data']>({ labels: [], datasets: [] });

  forecastChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatMoney(Number(ctx.raw))}` } },
    },
    scales: { y: { ticks: { callback: (v) => `${Math.round(Number(v) / 1000)}k` } } },
  };

  recommendChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => formatMoney(Number(ctx.raw)) } },
    },
    scales: { x: { ticks: { callback: (v) => `${Math.round(Number(v) / 1000)}k` } } },
  };

  constructor() {
    effect(() => {
      this.filters.period();
      this.filters.storeFilter();
      this.filters.categoryFilter();
      this.filters.sellerFilter();
      this.filters.channelFilter();
      this.sales();
      this.scopedSales();
      this.updateCharts();
    });
  }

  ngOnInit(): void {
    this.sales.set(this.data.getSales());
    this.sellers.set(this.data.getSellers());
    this.filters.loadSellers();
    this.orders.set(this.localOrders.getOrders());
    this.catalog.getProducts({ limit: 500 }).subscribe({
      next: (res) => this.products.set(res.data ?? []),
    });
    this.updateCharts();
  }

  confidenceTone(c: number): string {
    if (c > 70) return 'success';
    if (c > 45) return 'warning';
    return 'danger';
  }

  scoreTone(score: number): string {
    if (score > 70) return 'danger';
    if (score > 40) return 'warning';
    return 'success';
  }

  recalculate(): void {
    this.lastRefresh.set(Date.now());
    this.sales.set(this.data.getSales());
    this.orders.set(this.localOrders.getOrders());
    this.snack.open('Modèles recalculés', this.freshness(), { duration: 2500 });
  }

  exportReport(): void {
    const report = {
      generatedAt: new Date().toISOString(),
      storeFilter: this.filters.storeFilter(),
      period: this.filters.period(),
      projection: { confidence: this.projection().confidence, horizon: 30 },
      anomalies: this.anomalies(),
      stockRisk: this.stockRisk().map((r) => ({
        productId: r.product.id,
        name: r.product.name,
        score: r.score,
        days: r.days,
      })),
      rfm: this.rfm(),
      recommendations: this.recommendations(),
      attrition: this.attrition().map((r) => ({
        sellerId: r.seller.id,
        name: `${r.seller.firstName} ${r.seller.lastName}`,
        risk: r.risk,
      })),
    };
    downloadFile('boutika-modeles.json', JSON.stringify(report, null, 2));
    this.snack.open('Rapport exporté', 'OK', { duration: 2500 });
  }

  private updateCharts(): void {
    const daily = this.daily();
    const proj = this.projection();
    const hist = daily.slice(-45);
    const labels = [...hist.map((d) => d.label), ...proj.points.map((p) => p.label)];

    this.forecastChartData.set({
      labels,
      datasets: [
        {
          label: 'Borne basse',
          data: [...hist.map(() => null as number | null), ...proj.points.map((p) => p.bas)],
          borderWidth: 0,
          pointRadius: 0,
          fill: false,
          backgroundColor: 'transparent',
        },
        {
          label: 'Borne haute',
          data: [...hist.map(() => null as number | null), ...proj.points.map((p) => p.haut)],
          borderWidth: 0,
          pointRadius: 0,
          fill: '-1',
          backgroundColor: 'rgba(5, 150, 105, 0.15)',
        },
        {
          label: 'Réalisé',
          data: [...hist.map((d) => d.revenue), ...proj.points.map(() => null as number | null)],
          borderColor: 'rgb(5, 150, 105)',
          backgroundColor: 'transparent',
          tension: 0.3,
          pointRadius: 0,
        },
        {
          label: 'Prévision',
          data: [...hist.map(() => null as number | null), ...proj.points.map((p) => p.prevision)],
          borderColor: '#6366f1',
          backgroundColor: 'transparent',
          borderDash: [5, 4],
          tension: 0.3,
          pointRadius: 0,
        },
      ],
    });

    const recos = this.recommendations();
    this.recommendChartData.set({
      labels: recos.map((r) => r.name),
      datasets: [{
        data: recos.map((r) => r.value),
        backgroundColor: '#6366f1',
        borderRadius: 4,
      }],
    });
  }
}
