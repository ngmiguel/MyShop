import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MatIconModule } from '@angular/material/icon';
import { OrderService } from '../../../core/services/order.service';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { Order } from '../../../core/models';
import { CATEGORIES, categoryLabel } from '../../../core/data/categories';
import { SegmentedTabsComponent } from '../../../shared/components/segmented-tabs/segmented-tabs.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-client-profit',
  standalone: true,
  imports: [DecimalPipe, MatIconModule, BaseChartDirective, SegmentedTabsComponent, EmptyStateComponent],
  template: `
    <div class="page">
      <header>
        <div>
          <h1>Mes dépenses</h1>
          <p>Ce que vous dépensez, où, et ce que vous économisez.</p>
        </div>
        <app-segmented-tabs size="sm" [items]="periods" [value]="period()" (valueChange)="period.set($event)" />
      </header>

      @if (orders().length === 0) {
        <app-empty-state icon="receipt_long" title="Aucune dépense sur la période" message="Vos achats validés alimenteront automatiquement cette analyse." />
      } @else {
        <div class="stat-grid">
          <div class="stat card">
            <mat-icon>payments</mat-icon>
            <span class="label">Total dépensé</span>
            <strong>{{ totalSpent() | number:'1.0-0' }} FCFA</strong>
            <span class="hint">{{ orders().length }} commandes</span>
          </div>
          <div class="stat card">
            <mat-icon>savings</mat-icon>
            <span class="label">Économies (remises)</span>
            <strong>{{ totalSaved() | number:'1.0-0' }} FCFA</strong>
            <span class="hint">Codes promo appliqués</span>
          </div>
          <div class="stat card">
            <mat-icon>receipt_long</mat-icon>
            <span class="label">Panier moyen</span>
            <strong>{{ avgBasket() | number:'1.0-0' }} FCFA</strong>
          </div>
          <div class="stat card">
            <mat-icon>store</mat-icon>
            <span class="label">Boutiques fréquentées</span>
            <strong>{{ storeCount() }}</strong>
            @if (topStore()) {
              <span class="hint">{{ topStore() }}</span>
            }
          </div>
        </div>

        <div class="charts-grid">
          @if (pieData.labels?.length) {
            <section class="card chart-card">
              <h2>Répartition par catégorie</h2>
              <div class="chart-wrap">
                <canvas baseChart [type]="'doughnut'" [data]="pieData" [options]="pieOptions"></canvas>
              </div>
            </section>
          }
          @if (barData.labels?.length) {
            <section class="card chart-card">
              <h2>Boutiques les plus fréquentées</h2>
              <div class="chart-wrap bar">
                <canvas baseChart [type]="'bar'" [data]="barData" [options]="barOptions"></canvas>
              </div>
            </section>
          }
        </div>

        <section class="card budget-card">
          <h2>Comparaison au budget déclaré</h2>
          <p class="budget-desc">
            Budget indicatif : {{ onboarding.state().budgetMin | number:'1.0-0' }} —
            {{ onboarding.state().budgetMax | number:'1.0-0' }} FCFA par article
          </p>
          <div class="budget-track">
            <div class="budget-fill" [style.width.%]="budgetUsage()"></div>
          </div>
          <p class="budget-note">
            Vous avez dépensé {{ totalSpent() | number:'1.0-0' }} FCFA sur la période,
            soit {{ budgetUsage() | number:'1.0-0' }} % d'une enveloppe de trois achats au plafond déclaré.
          </p>
        </section>
      }
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 20px; }
    header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 12px; }
    h1 { margin: 0; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em; }
    header p { margin: 4px 0 0; font-size: 14px; color: rgb(var(--muted)); }
    .stat { padding: 16px; display: flex; flex-direction: column; gap: 4px; }
    .stat mat-icon { color: rgb(var(--accent)); font-size: 20px; width: 20px; height: 20px; }
    .stat .label { font-size: 12px; color: rgb(var(--muted)); }
    .stat strong { font-size: 1.25rem; color: rgb(var(--ink)); }
    .stat .hint { font-size: 11px; color: rgb(var(--muted)); margin-top: 2px; }
    .charts-grid { display: grid; gap: 16px; }
    @media (min-width: 1024px) { .charts-grid { grid-template-columns: 1fr 1fr; } }
    .chart-card { padding: 16px; }
    .chart-card h2 { margin: 0 0 16px; font-size: 1rem; font-weight: 600; }
    .chart-wrap { height: 288px; }
    .chart-wrap.bar { height: 288px; }
    .budget-card { padding: 16px; }
    .budget-card h2 { margin: 0 0 8px; font-size: 1rem; font-weight: 600; }
    .budget-desc { margin: 0 0 12px; font-size: 13px; color: rgb(var(--muted)); }
    .budget-track {
      height: 12px; border-radius: 999px; background: rgb(var(--surface-2)); overflow: hidden;
    }
    .budget-fill {
      height: 100%; border-radius: 999px; background: rgb(var(--accent));
      transition: width 0.4s ease;
    }
    .budget-note { margin: 8px 0 0; font-size: 14px; color: rgb(var(--muted)); }
  `],
})
export class ClientProfitComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  readonly onboarding = inject(OnboardingService);

  readonly periods = [
    { id: '30', label: '30 jours' },
    { id: '90', label: '90 jours' },
    { id: '365', label: '12 mois' },
  ];

  period = signal('90');
  allOrders = signal<Order[]>([]);

  orders = computed(() => {
    const since = Date.now() - Number(this.period()) * 86400000;
    return this.allOrders().filter(
      (o) => o.status !== 'cancelled' && new Date(o.createdAt).getTime() >= since,
    );
  });

  totalSpent = computed(() => this.orders().reduce((a, o) => a + (o.total ?? 0), 0));
  totalSaved = computed(() => this.orders().reduce((a, o) => a + (o.discount ?? 0), 0));
  avgBasket = computed(() => {
    const n = this.orders().length;
    return n ? this.totalSpent() / n : 0;
  });
  storeCount = computed(() => new Set(this.orders().map((o) => o.storeId)).size);
  topStore = computed(() => {
    const map = new Map<string, number>();
    this.orders().forEach((o) => map.set(o.storeName ?? o.storeId, (map.get(o.storeName ?? o.storeId) ?? 0) + 1));
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0];
  });
  budgetUsage = computed(() => {
    const max = this.onboarding.state().budgetMax;
    if (!max) return 0;
    return Math.min(100, Math.min(200, (this.totalSpent() / (max * 3)) * 100));
  });

  pieData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
  barData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [{ data: [], backgroundColor: 'rgb(5, 150, 105)' }] };
  pieOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };
  barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { callback: (v) => `${Math.round(Number(v) / 1000)}k` } },
    },
  };

  constructor() {
    effect(() => {
      this.period();
      this.allOrders();
      this.rebuildCharts();
    });
  }

  ngOnInit(): void {
    this.orderService.getOrders().subscribe({
      next: (res) => this.allOrders.set(res.data ?? []),
      error: () => this.allOrders.set([]),
    });
  }

  private rebuildCharts(): void {
    const scope = this.orders();
    const catMap = new Map<string, number>();
    scope.forEach((o) => {
      (o.items ?? []).forEach((i) => {
        const cat = i.product?.categoryId ?? 'other';
        catMap.set(cat, (catMap.get(cat) ?? 0) + (i.unitPrice ?? 0) * (i.quantity ?? 1));
      });
    });
    const catEntries = [...catMap.entries()].sort((a, b) => b[1] - a[1]);
    this.pieData = {
      labels: catEntries.map(([id]) => categoryLabel(id)),
      datasets: [{
        data: catEntries.map(([, v]) => v),
        backgroundColor: catEntries.map(([id]) => CATEGORIES.find((c) => c.id === id)?.color ?? '#64748b'),
      }],
    };

    const storeMap = new Map<string, { name: string; value: number }>();
    scope.forEach((o) => {
      const cur = storeMap.get(o.storeId) ?? { name: o.storeName ?? o.storeId, value: 0 };
      cur.value += o.total ?? 0;
      storeMap.set(o.storeId, cur);
    });
    const storeEntries = [...storeMap.values()].sort((a, b) => b.value - a.value).slice(0, 6);
    this.barData = {
      labels: storeEntries.map((s) => s.name),
      datasets: [{ data: storeEntries.map((s) => s.value), backgroundColor: 'rgb(5, 150, 105)' }],
    };
  }
}
