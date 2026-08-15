import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { SegmentedTabsComponent } from '../../../shared/components/segmented-tabs/segmented-tabs.component';
import { DEMO_PRODUCTS } from '../../../core/data/demo-catalog';
import {
  computeKpis,
  enrichDemoSales,
  enrichDemoStoreSales,
  formatGrowth,
  groupByDay,
  groupSum,
  growth,
  SaleRecord,
} from '../../../core/utils/analytics.util';
import { formatMoney } from '../../../core/utils/format.util';
import { getSellerByUserId } from '../../../core/data/demo-sellers';
import { storeById } from '../../../core/utils/cart.util';

@Component({
  selector: 'app-seller-profit',
  standalone: true,
  imports: [DecimalPipe, MatIconModule, BaseChartDirective, LoadingSpinnerComponent, SegmentedTabsComponent],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>Profit boutique</h1>
          <p>Périmètre limité à {{ storeName() }}.</p>
        </div>
        <app-segmented-tabs size="sm" [items]="periods" [value]="period()" (valueChange)="onPeriodChange($event)" />
      </header>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        <div class="stat-grid">
          <div class="stat card">
            <mat-icon>payments</mat-icon>
            <span class="label">Chiffre d'affaires</span>
            <strong>{{ formatMoney(kpis().revenue) }}</strong>
            <span class="hint delta" [class.up]="revGrowth() >= 0">{{ formatGrowth(revGrowth()) }}</span>
          </div>
          <div class="stat card">
            <mat-icon>percent</mat-icon>
            <span class="label">Marge estimée</span>
            <strong>{{ formatMoney(kpis().margin) }}</strong>
            <span class="hint">{{ kpis().marginRate | number:'1.1-1' }} % de marge</span>
          </div>
          <div class="stat card">
            <mat-icon>shopping_cart</mat-icon>
            <span class="label">Transactions</span>
            <strong>{{ kpis().transactions }}</strong>
            <span class="hint delta" [class.up]="txGrowth() >= 0">{{ formatGrowth(txGrowth()) }}</span>
          </div>
          <div class="stat card">
            <mat-icon>trending_up</mat-icon>
            <span class="label">Panier moyen</span>
            <strong>{{ formatMoney(kpis().averageBasket) }}</strong>
            <span class="hint delta" [class.up]="basketGrowth() >= 0">{{ formatGrowth(basketGrowth()) }}</span>
          </div>
        </div>

        <section class="card chart-card">
          <h2>Évolution du chiffre d'affaires et de la marge</h2>
          <div class="chart-wrap">
            <canvas baseChart [type]="'line'" [data]="lineChartData" [options]="lineChartOptions"></canvas>
          </div>
        </section>

        <div class="charts-grid">
          <section class="card chart-card">
            <h2>Meilleurs articles</h2>
            <div class="chart-wrap tall">
              <canvas baseChart [type]="'bar'" [data]="topProductsChart" [options]="barHOptions"></canvas>
            </div>
          </section>
          <section class="card chart-card">
            <h2>Heures de pointe</h2>
            <div class="chart-wrap tall">
              <canvas baseChart [type]="'bar'" [data]="hoursChart" [options]="barOptions"></canvas>
            </div>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 64rem; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; padding-bottom: 24px; }
    .page-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 12px; }
    h1 { margin: 0; font-size: 1.5rem; font-weight: 600; }
    .page-head p { margin: 4px 0 0; font-size: 14px; color: rgb(var(--muted)); }
    .stat { padding: 16px; display: flex; flex-direction: column; gap: 4px; }
    .stat mat-icon { color: rgb(var(--accent)); font-size: 20px; width: 20px; height: 20px; }
    .stat .label { font-size: 12px; color: rgb(var(--muted)); }
    .stat strong { font-size: 1.125rem; }
    .stat .hint { font-size: 12px; color: rgb(var(--muted)); }
    .stat .hint.delta.up { color: #059669; }
    .chart-card { padding: 16px; }
    .chart-card h2 { margin: 0 0 12px; font-size: 1rem; font-weight: 600; }
    .chart-wrap { height: 260px; }
    .chart-wrap.tall { height: 288px; }
    .charts-grid { display: grid; gap: 20px; }
    @media (min-width: 1024px) { .charts-grid { grid-template-columns: 1fr 1fr; } }
  `],
})
export class SellerProfitComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly orders = inject(OrderService);

  readonly formatMoney = formatMoney;
  readonly formatGrowth = formatGrowth;

  readonly periods = [
    { id: '7', label: '7 j' },
    { id: '30', label: '30 j' },
    { id: '90', label: '90 j' },
  ];

  loading = signal(true);
  period = signal('30');
  sales = signal<SaleRecord[]>([]);
  storeName = signal('Boutique');

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
  txGrowth = computed(() => growth(this.kpis().transactions, this.prevKpis().transactions));
  basketGrowth = computed(() => growth(this.kpis().averageBasket, this.prevKpis().averageBasket));

  lineChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { ticks: { callback: (v) => `${Math.round(Number(v) / 1000)}k` } } },
  };

  topProductsChart: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  hoursChart: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

  barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { ticks: { callback: (v) => `${Math.round(Number(v) / 1000)}k` } } },
  };

  barHOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { callback: (v) => `${Math.round(Number(v) / 1000)}k` } } },
  };

  constructor() {
    effect(() => {
      this.period();
      this.scope();
      if (!this.loading()) this.updateCharts();
    });
  }

  onPeriodChange(value: string): void {
    this.period.set(value);
  }

  ngOnInit(): void {
    const user = this.auth.user();
    const seller = user ? getSellerByUserId(user.id) : undefined;
    if (!seller) {
      this.loading.set(false);
      return;
    }
    this.storeName.set(storeById(seller.storeId)?.name ?? 'Boutique');

    this.orders.getOrders({ storeId: seller.storeId }).subscribe({
      next: (res) => {
        const sales = enrichDemoStoreSales(res.data ?? [], seller.storeId);
        this.sales.set(sales);
        this.updateCharts();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private updateCharts(): void {
    const scope = this.scope();
    const series = groupByDay(scope);

    this.lineChartData = {
      labels: series.map((p) => p.label),
      datasets: [
        { label: 'CA', data: series.map((p) => p.revenue), borderColor: 'rgb(5,150,105)', tension: 0.3, pointRadius: 0 },
        { label: 'Marge', data: series.map((p) => p.margin), borderColor: '#f59e0b', tension: 0.3, pointRadius: 0 },
      ],
    };

    const top = groupSum(scope, (s) => s.productId, (s) => s.revenue)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
      .map((row) => ({
        name: DEMO_PRODUCTS.find((p) => p.id === row.key)?.name?.slice(0, 26) ?? row.key,
        value: row.value,
      }));

    this.topProductsChart = {
      labels: top.map((t) => t.name),
      datasets: [{ data: top.map((t) => t.value), backgroundColor: 'rgb(5,150,105)', borderRadius: 4 }],
    };

    const hourMap = new Map<number, number>();
    scope.forEach((s) => hourMap.set(s.hour, (hourMap.get(s.hour) ?? 0) + s.revenue));
    const hours = Array.from({ length: 13 }, (_, i) => ({
      hour: `${i + 7}h`,
      value: hourMap.get(i + 7) ?? 0,
    }));

    this.hoursChart = {
      labels: hours.map((h) => h.hour),
      datasets: [{ data: hours.map((h) => h.value), backgroundColor: '#f59e0b', borderRadius: 4 }],
    };
  }
}
