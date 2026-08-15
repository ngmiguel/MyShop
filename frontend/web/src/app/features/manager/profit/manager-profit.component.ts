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
import {
  computeKpis,
  formatGrowth,
  groupByDay,
  groupSum,
  growth,
  SaleRecord,
} from '../../../core/utils/analytics.util';
import { downloadFile } from '../../../core/utils/storage.util';
import { formatMoney, relativeTime } from '../../../core/utils/format.util';
import { ManagerInsightsFiltersComponent } from '../../../shared/components/manager-insights-filters/manager-insights-filters.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StoreStatus } from '../../../core/data/demo-manager-stores';

const FIXED_COST_PER_STORE = 850000;

interface StoreProfitRow {
  id: string;
  name: string;
  revenue: number;
  cost: number;
  brute: number;
  fixed: number;
  nette: number;
  taux: number;
  status: StoreStatus;
}

@Component({
  selector: 'app-manager-profit',
  standalone: true,
  imports: [
    DecimalPipe,
    MatIconModule,
    MatButtonModule,
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
            <mat-icon>account_balance_wallet</mat-icon>
            Profit de l'enseigne
          </h1>
          <p>
            Revenus, coûts variables et charges fixes estimées ({{ formatMoney(FIXED_COST_PER_STORE) }} par boutique et par mois).
            @if (scope().length) {
              · {{ scope().length }} transactions sur {{ filters.period() }} j
            }
            @if (filters.activeFilterCount() > 0) {
              · {{ filters.activeFilterCount() }} filtre(s) actif(s)
            }
          </p>
        </div>
        <div class="head-actions">
          <button type="button" class="btn-outline" (click)="refresh()">
            <mat-icon>refresh</mat-icon> Actualiser
          </button>
          <button type="button" class="btn-outline" (click)="exportCsv()">
            <mat-icon>download</mat-icon> CSV boutiques
          </button>
          <button type="button" class="btn-outline" (click)="exportJson()">
            <mat-icon>data_object</mat-icon> JSON complet
          </button>
        </div>
      </header>

      <app-manager-insights-filters />

      @if (!scope().length) {
        <app-empty-state
          icon="account_balance_wallet"
          title="Aucune vente sur la période"
          message="Ajustez la période ou les filtres pour afficher le profit."
        >
          @if (filters.activeFilterCount() > 0) {
            <button type="button" class="btn-outline" (click)="filters.resetFilters()">
              <mat-icon>filter_alt_off</mat-icon> Réinitialiser les filtres
            </button>
          }
        </app-empty-state>
      } @else {
        <div class="stat-grid">
          <div class="stat card">
            <mat-icon>payments</mat-icon>
            <span class="label">Revenus</span>
            <strong>{{ formatMoney(kpis().revenue) }}</strong>
            <span class="hint delta" [class.up]="revGrowth() >= 0" [class.down]="revGrowth() < 0">
              {{ formatGrowth(revGrowth()) }} vs période précédente
            </span>
          </div>
          <div class="stat card">
            <mat-icon>percent</mat-icon>
            <span class="label">Marge brute</span>
            <strong>{{ formatMoney(kpis().margin) }}</strong>
            <span class="hint">{{ kpis().marginRate | number:'1.1-1' }} % · {{ formatGrowth(marginGrowth()) }}</span>
          </div>
          <div class="stat card">
            <mat-icon>inventory_2</mat-icon>
            <span class="label">Coûts variables</span>
            <strong>{{ formatMoney(variableCosts()) }}</strong>
            <span class="hint">{{ variableCostRate() | number:'1.1-1' }} % du CA</span>
          </div>
          <div class="stat card">
            <mat-icon>account_balance</mat-icon>
            <span class="label">Charges fixes estimées</span>
            <strong>{{ formatMoney(fixedCosts()) }}</strong>
            <span class="hint">{{ activeStoresForFixed() }} boutique(s) · {{ formatMoney(fixedCostPerDay()) }}/j</span>
          </div>
          <div class="stat card" [class.alert]="netMargin() < 0">
            <mat-icon>trending_up</mat-icon>
            <span class="label">Marge nette</span>
            <strong>{{ formatMoney(netMargin()) }}</strong>
            <span class="hint delta" [class.up]="netGrowth() >= 0" [class.down]="netGrowth() < 0">
              {{ netMarginRate() | number:'1.1-1' }} % · {{ formatGrowth(netGrowth()) }}
            </span>
          </div>
          <div class="stat card">
            <mat-icon>store</mat-icon>
            <span class="label">Profit / boutique active</span>
            <strong>{{ formatMoney(profitPerStore()) }}</strong>
            <span class="hint">{{ profitableStores() }}/{{ storeRows().length }} rentables</span>
          </div>
        </div>

        <section class="card chart-card">
          <h2>Évolution des revenus et de la marge</h2>
          <div class="chart-wrap lg">
            <canvas baseChart [type]="'bar'" [data]="trendChartData()" [options]="trendChartOptions"></canvas>
          </div>
        </section>

        <div class="grid-2">
          <section class="card chart-card">
            <h2>Marge par boutique</h2>
            <p class="desc">Brute et nette après charges fixes</p>
            <div class="chart-wrap xl">
              <canvas baseChart [type]="'bar'" [data]="storeChartData()" [options]="storeChartOptions"></canvas>
            </div>
          </section>

          <section class="card chart-card">
            <h2>Marge par catégorie</h2>
            <div class="chart-wrap xl">
              <canvas baseChart [type]="'bar'" [data]="categoryChartData()" [options]="categoryChartOptions"></canvas>
            </div>
          </section>
        </div>

        <div class="grid-2">
          <section class="card chart-card">
            <h2>Structure des coûts</h2>
            <p class="desc">Répartition marge brute, coûts variables et charges fixes</p>
            <div class="chart-wrap md">
              <canvas baseChart [type]="'doughnut'" [data]="costChartData()" [options]="costChartOptions"></canvas>
            </div>
          </section>

          <section class="card chart-card">
            <h2>Taux de marge quotidien</h2>
            <p class="desc">Évolution du taux de marge brute sur la période</p>
            <div class="chart-wrap md">
              <canvas baseChart [type]="'line'" [data]="marginRateChartData()" [options]="marginRateChartOptions"></canvas>
            </div>
          </section>
        </div>

        <div class="grid-2">
          <section class="card">
            <h2>Seuil de rentabilité</h2>
            <p class="desc">Chiffre d'affaires nécessaire pour couvrir les charges fixes</p>
            <div class="breakeven">
              <mat-icon>track_changes</mat-icon>
              <div>
                <p class="amount">{{ formatMoney(breakEven()) }}</p>
                <p class="desc">sur la période, au taux de marge actuel de {{ kpis().marginRate | number:'1.1-1' }} %</p>
              </div>
            </div>
            <div class="progress">
              <div class="fill" [style.width.%]="breakEvenProgress()"></div>
            </div>
            <p class="breakeven-meta">
              Réalisé : {{ formatMoney(kpis().revenue) }} ·
              <span class="badge" [class.ok]="kpis().revenue >= breakEven()">
                {{ kpis().revenue >= breakEven() ? 'Rentable' : 'En deçà du seuil' }}
              </span>
              @if (breakEvenGap() > 0) {
                · Manque {{ formatMoney(breakEvenGap()) }}
              }
            </p>
          </section>

          <section class="card">
            <h2>Contribution de chaque boutique</h2>
            <ul class="contrib">
              @for (row of contribution(); track row.name) {
                <li>
                  <div class="row">
                    <span class="muted">{{ row.name }}</span>
                    <span class="strong">{{ row.part | number:'1.1-1' }} %</span>
                  </div>
                  <div class="progress sm">
                    <div class="fill" [style.width.%]="row.part"></div>
                  </div>
                </li>
              }
            </ul>
          </section>
        </div>

        <div class="grid-2">
          <section class="card">
            <div class="card-head">
              <h2>Top performers</h2>
              <span class="muted-sm">Marge nette</span>
            </div>
            <ul class="rank">
              @for (row of topStores(); track row.id; let i = $index) {
                <li>
                  <span class="rank-num">{{ i + 1 }}</span>
                  <div class="rank-body">
                    <span class="name">{{ row.name }}</span>
                    <span class="meta">{{ formatMoney(row.nette) }} · {{ row.taux | number:'1.1-1' }} %</span>
                  </div>
                  <span class="badge ok">Rentable</span>
                </li>
              }
            </ul>
          </section>

          <section class="card">
            <div class="card-head">
              <h2>À surveiller</h2>
              <span class="muted-sm">Marge nette la plus faible</span>
            </div>
            <ul class="rank">
              @for (row of bottomStores(); track row.id) {
                <li>
                  <span class="rank-num warn">!</span>
                  <div class="rank-body">
                    <span class="name">{{ row.name }}</span>
                    <span class="meta">{{ formatMoney(row.nette) }} · charges {{ formatMoney(row.fixed) }}</span>
                  </div>
                  <span class="badge" [class.ok]="row.nette >= 0" [class.warn]="row.nette < 0">
                    {{ row.nette >= 0 ? 'OK' : 'Déficit' }}
                  </span>
                </li>
              }
            </ul>
          </section>
        </div>

        <section class="card">
          <div class="card-head">
            <h2>Détail par boutique</h2>
            <span class="muted-sm">Dernière actualisation {{ lastRefreshLabel() }}</span>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Boutique</th>
                  <th>CA</th>
                  <th>Coûts var.</th>
                  <th>Marge brute</th>
                  <th>Taux</th>
                  <th>Charges fixes</th>
                  <th>Marge nette</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                @for (row of storeRows(); track row.id) {
                  <tr [class.deficit]="row.nette < 0">
                    <td>{{ row.name }}</td>
                    <td>{{ formatMoney(row.revenue) }}</td>
                    <td>{{ formatMoney(row.cost) }}</td>
                    <td>{{ formatMoney(row.brute) }}</td>
                    <td>{{ row.taux | number:'1.1-1' }} %</td>
                    <td>{{ formatMoney(row.fixed) }}</td>
                    <td [class.negative]="row.nette < 0">{{ formatMoney(row.nette) }}</td>
                    <td>
                      <span class="badge" [class.ok]="row.nette >= 0" [class.warn]="row.nette < 0">
                        {{ row.nette >= 0 ? 'Rentable' : 'Déficit' }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <div class="grid-2">
          <section class="card">
            <h2>Marge par catégorie (détail)</h2>
            <ul class="cat-list">
              @for (cat of byCategory(); track cat.name) {
                <li>
                  <span class="dot" [style.background]="cat.color"></span>
                  <div class="cat-body">
                    <span class="name">{{ cat.name }}</span>
                    <span class="meta">{{ formatMoney(cat.marge) }}</span>
                  </div>
                  <span class="rate">{{ cat.taux | number:'1.1-1' }} %</span>
                </li>
              }
            </ul>
          </section>

          <section class="card">
            <h2>Top vendeurs (marge brute)</h2>
            <ul class="rank">
              @for (row of topSellers(); track row.id; let i = $index) {
                <li>
                  <span class="rank-num">{{ i + 1 }}</span>
                  <div class="rank-body">
                    <span class="name">{{ row.name }}</span>
                    <span class="meta">{{ filters.storeName(row.storeId) }}</span>
                  </div>
                  <span class="amount-sm">{{ formatMoney(row.margin) }}</span>
                </li>
              }
              @if (!topSellers().length) {
                <li class="empty-row">Aucun vendeur sur les filtres actifs.</li>
              }
            </ul>
          </section>
        </div>
      }
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
    .head-actions, .card-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .card-head { justify-content: space-between; margin-bottom: 12px; }
    .btn-outline {
      display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px;
      border-radius: 8px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface-2));
      font-size: 12px; font-weight: 600; cursor: pointer; color: rgb(var(--ink));
    }
    .btn-outline mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .btn-outline:hover { border-color: rgb(var(--accent)); color: rgb(var(--accent)); }
    .card { padding: 16px; border-radius: 12px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); }
    .stat-grid {
      display: grid; gap: 16px;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    }
    .stat { display: flex; flex-direction: column; gap: 4px; }
    .stat.alert { border-color: rgba(244,63,94,0.35); background: rgba(244,63,94,0.04); }
    .stat mat-icon { color: rgb(var(--accent)); font-size: 20px; width: 20px; height: 20px; }
    .stat .label { font-size: 12px; color: rgb(var(--muted)); }
    .stat strong { font-size: 1.125rem; }
    .stat .hint { font-size: 12px; color: rgb(var(--muted)); }
    .stat .hint.delta.up { color: #059669; }
    .stat .hint.delta.down { color: #dc2626; }
    .chart-wrap { position: relative; }
    .chart-wrap.lg { height: 288px; }
    .chart-wrap.xl { height: 320px; }
    .chart-wrap.md { height: 240px; }
    .grid-2 { display: grid; gap: 20px; }
    @media (min-width: 1024px) { .grid-2 { grid-template-columns: 1fr 1fr; } }
    .breakeven { display: flex; align-items: center; gap: 12px; margin-top: 12px; }
    .breakeven mat-icon { font-size: 32px; width: 32px; height: 32px; color: rgb(var(--accent)); }
    .amount { margin: 0; font-size: 1.5rem; font-weight: 600; }
    .progress { height: 12px; border-radius: 999px; background: rgb(var(--surface-2)); overflow: hidden; margin-top: 16px; }
    .progress.sm { height: 8px; margin-top: 4px; }
    .fill { height: 100%; border-radius: 999px; background: rgb(var(--accent)); }
    .breakeven-meta { margin: 8px 0 0; font-size: 14px; color: rgb(var(--muted)); }
    .badge {
      display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600;
      background: #fef3c7; color: #92400e;
    }
    .badge.ok { background: #d1fae5; color: #065f46; }
    .badge.warn { background: #fee2e2; color: #991b1b; }
    .contrib { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .contrib .row { display: flex; justify-content: space-between; font-size: 12px; }
    .muted { color: rgb(var(--muted)); }
    .muted-sm { font-size: 11px; color: rgb(var(--muted)); }
    .strong { font-weight: 600; }
    .rank { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .rank li { display: flex; align-items: center; gap: 10px; }
    .rank-num {
      width: 22px; height: 22px; border-radius: 999px; background: rgb(var(--surface-2));
      display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0;
    }
    .rank-num.warn { background: #fee2e2; color: #991b1b; }
    .rank-body { flex: 1; min-width: 0; }
    .rank-body .name { display: block; font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .rank-body .meta { display: block; font-size: 11px; color: rgb(var(--muted)); }
    .amount-sm { font-size: 12px; font-weight: 600; }
    .empty-row { font-size: 13px; color: rgb(var(--muted)); }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { padding: 10px 8px; text-align: left; border-bottom: 1px solid rgb(var(--line)); }
    th { font-weight: 600; color: rgb(var(--muted)); font-size: 11px; }
    tr.deficit { background: rgba(244,63,94,0.03); }
    td.negative { color: #dc2626; font-weight: 600; }
    .cat-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .cat-list li { display: flex; align-items: center; gap: 10px; }
    .cat-list .dot { width: 10px; height: 10px; border-radius: 999px; flex-shrink: 0; }
    .cat-list .cat-body { flex: 1; display: flex; justify-content: space-between; gap: 8px; }
    .cat-list .name { font-size: 13px; font-weight: 500; }
    .cat-list .meta { font-size: 12px; font-weight: 600; }
    .cat-list .rate { font-size: 11px; color: rgb(var(--muted)); min-width: 48px; text-align: right; }
    .btn-outline {
      display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; margin-top: 12px;
      border-radius: 8px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface-2));
      font-size: 12px; font-weight: 600; cursor: pointer; color: rgb(var(--ink));
    }
    .btn-outline mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `],
})
export class ManagerProfitComponent implements OnInit {
  private readonly data = inject(ManagerDataService);
  private readonly snackBar = inject(MatSnackBar);
  readonly filters = inject(ManagerInsightsService);

  readonly formatMoney = formatMoney;
  readonly formatGrowth = formatGrowth;
  readonly FIXED_COST_PER_STORE = FIXED_COST_PER_STORE;

  sales = signal<SaleRecord[]>([]);
  lastRefresh = signal(Date.now());

  scope = computed(() => this.filters.filterSales(this.sales()));

  previous = computed(() => {
    const days = Number(this.filters.period());
    const end = Date.now() - days * 86400000;
    const start = end - days * 86400000;
    return this.sales().filter((s) => {
      const t = new Date(s.date).getTime();
      return t >= start && t < end && this.filters.matchesFilters(s);
    });
  });

  kpis = computed(() => computeKpis(this.scope()));
  prevKpis = computed(() => computeKpis(this.previous()));
  revGrowth = computed(() => growth(this.kpis().revenue, this.prevKpis().revenue));
  marginGrowth = computed(() => growth(this.kpis().margin, this.prevKpis().margin));

  variableCosts = computed(() => this.scope().reduce((a, s) => a + s.cost, 0));
  variableCostRate = computed(() =>
    this.kpis().revenue ? (this.variableCosts() / this.kpis().revenue) * 100 : 0,
  );

  activeStoresForFixed = computed(() => {
    const storeId = this.filters.storeFilter();
    const stores = this.filters.stores();
    if (storeId !== 'all') {
      return stores.find((s) => s.id === storeId && s.status === 'active') ? 1 : 0;
    }
    return stores.filter((s) => s.status === 'active').length;
  });

  fixedCosts = computed(() => {
    const days = Number(this.filters.period());
    return FIXED_COST_PER_STORE * this.activeStoresForFixed() * days / 30;
  });

  fixedCostPerDay = computed(() => {
    const days = Number(this.filters.period());
    return days ? this.fixedCosts() / days : 0;
  });

  netMargin = computed(() => this.kpis().margin - this.fixedCosts());
  netMarginRate = computed(() =>
    this.kpis().revenue ? (this.netMargin() / this.kpis().revenue) * 100 : 0,
  );

  prevNetMargin = computed(() => {
    const days = Number(this.filters.period());
    const prevFixed = FIXED_COST_PER_STORE * this.activeStoresForFixed() * days / 30;
    return this.prevKpis().margin - prevFixed;
  });

  netGrowth = computed(() => growth(this.netMargin(), this.prevNetMargin()));

  breakEven = computed(() =>
    this.kpis().marginRate ? this.fixedCosts() / (this.kpis().marginRate / 100) : 0,
  );

  breakEvenProgress = computed(() => {
    const be = this.breakEven();
    return Math.min(100, be ? (this.kpis().revenue / be) * 100 : 0);
  });

  breakEvenGap = computed(() => Math.max(0, this.breakEven() - this.kpis().revenue));

  storeRows = computed((): StoreProfitRow[] => {
    const days = Number(this.filters.period());
    const storeFilter = this.filters.storeFilter();
    const stores = storeFilter === 'all'
      ? this.filters.stores()
      : this.filters.stores().filter((s) => s.id === storeFilter);

    return stores
      .map((store) => {
        const rows = this.scope().filter((s) => s.storeId === store.id);
        const revenue = rows.reduce((a, s) => a + s.revenue, 0);
        const cost = rows.reduce((a, s) => a + s.cost, 0);
        const fixed = store.status === 'active' ? FIXED_COST_PER_STORE * days / 30 : 0;
        const brute = revenue - cost;
        return {
          id: store.id,
          name: store.name.slice(0, 28),
          revenue,
          cost,
          brute,
          fixed,
          nette: brute - fixed,
          taux: revenue ? (brute / revenue) * 100 : 0,
          status: store.status,
        };
      })
      .sort((a, b) => b.nette - a.nette);
  });

  byStore = computed(() =>
    this.storeRows()
      .filter((s) => s.revenue > 0 || s.brute !== 0)
      .map((s) => ({
        name: s.name.slice(0, 22),
        revenue: s.revenue,
        brute: s.brute,
        nette: s.nette,
      })),
  );

  byCategory = computed(() => {
    const map = new Map<string, { revenue: number; cost: number }>();
    this.scope().forEach((s) => {
      const id = s.categoryId ?? 'unknown';
      const cur = map.get(id) ?? { revenue: 0, cost: 0 };
      cur.revenue += s.revenue;
      cur.cost += s.cost;
      map.set(id, cur);
    });
    return [...map.entries()]
      .map(([id, v]) => ({
        name: categoryLabel(id),
        marge: v.revenue - v.cost,
        taux: v.revenue ? ((v.revenue - v.cost) / v.revenue) * 100 : 0,
        color: CATEGORIES.find((c) => c.id === id)?.color ?? '#64748b',
      }))
      .sort((a, b) => b.marge - a.marge);
  });

  contribution = computed(() =>
    this.byStore()
      .map((s) => ({
        name: s.name,
        part: this.kpis().revenue ? (s.revenue / this.kpis().revenue) * 100 : 0,
      }))
      .sort((a, b) => b.part - a.part),
  );

  profitableStores = computed(() => this.storeRows().filter((s) => s.nette >= 0).length);

  profitPerStore = computed(() => {
    const active = this.storeRows().filter((s) => s.status === 'active').length;
    return active ? this.netMargin() / active : 0;
  });

  topStores = computed(() => this.storeRows().filter((s) => s.revenue > 0).slice(0, 3));

  bottomStores = computed(() =>
    [...this.storeRows()].filter((s) => s.revenue > 0).sort((a, b) => a.nette - b.nette).slice(0, 3),
  );

  topSellers = computed(() => {
    const marginBySeller = new Map<string, number>();
    const storeBySeller = new Map<string, string>();
    this.scope().forEach((s) => {
      marginBySeller.set(s.sellerId, (marginBySeller.get(s.sellerId) ?? 0) + (s.revenue - s.cost));
      storeBySeller.set(s.sellerId, s.storeId);
    });
    return [...marginBySeller.entries()]
      .map(([id, margin]) => ({
        id,
        name: this.filters.sellerName(id),
        storeId: storeBySeller.get(id) ?? '',
        margin,
      }))
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 5);
  });

  lastRefreshLabel = computed(() => relativeTime(new Date(this.lastRefresh()).toISOString()));

  trendChartData = signal<ChartConfiguration['data']>({ labels: [], datasets: [] });
  storeChartData = signal<ChartConfiguration<'bar'>['data']>({ labels: [], datasets: [] });
  categoryChartData = signal<ChartConfiguration<'bar'>['data']>({ labels: [], datasets: [] });
  costChartData = signal<ChartConfiguration<'doughnut'>['data']>({ labels: [], datasets: [] });
  marginRateChartData = signal<ChartConfiguration<'line'>['data']>({ labels: [], datasets: [] });

  trendChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (ctx) => formatMoney(Number(ctx.raw)) } } },
    scales: { y: { ticks: { callback: (v) => `${Math.round(Number(v) / 1000)}k` } } },
  };

  storeChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (ctx) => formatMoney(Number(ctx.raw)) } } },
    scales: { x: { ticks: { callback: (v) => `${Math.round(Number(v) / 1000)}k` } } },
  };

  categoryChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => formatMoney(Number(ctx.raw)) } } },
    scales: { x: { ticks: { callback: (v) => `${Math.round(Number(v) / 1000)}k` } } },
  };

  costChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatMoney(Number(ctx.raw))}` } },
    },
  };

  marginRateChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `${Number(ctx.raw).toFixed(1)} %` } },
    },
    scales: { y: { ticks: { callback: (v) => `${v} %` }, suggestedMin: 0, suggestedMax: 100 } },
  };

  constructor() {
    effect(() => {
      this.filters.period();
      this.filters.storeFilter();
      this.filters.categoryFilter();
      this.filters.sellerFilter();
      this.filters.channelFilter();
      this.scope();
      this.byStore();
      this.byCategory();
      this.fixedCosts();
      this.updateCharts();
    });
  }

  ngOnInit(): void {
    this.filters.loadSellers();
    this.filters.stores.set(this.data.getManagerStores());
    this.sales.set(this.data.getSales());
    this.updateCharts();
  }

  refresh(): void {
    this.lastRefresh.set(Date.now());
    this.filters.stores.set(this.data.getManagerStores());
    this.sales.set(this.data.getSales());
    this.updateCharts();
    this.snackBar.open('Profit actualisé', 'OK', { duration: 2000 });
  }

  exportCsv(): void {
    const rows = [
      ['Boutique', 'CA', 'Coûts variables', 'Marge brute', 'Taux %', 'Charges fixes', 'Marge nette'],
      ...this.storeRows().map((s) => [
        s.name,
        String(Math.round(s.revenue)),
        String(Math.round(s.cost)),
        String(Math.round(s.brute)),
        s.taux.toFixed(1),
        String(Math.round(s.fixed)),
        String(Math.round(s.nette)),
      ]),
    ];
    downloadFile('rapport-profit-boutika.csv', rows.map((r) => r.join(';')).join('\n'), 'text/csv');
    this.snackBar.open('Rapport CSV exporté', 'OK', { duration: 2500 });
  }

  exportJson(): void {
    const report = {
      exportedAt: new Date().toISOString(),
      periodDays: Number(this.filters.period()),
      filters: {
        store: this.filters.storeFilter(),
        category: this.filters.categoryFilter(),
        seller: this.filters.sellerFilter(),
        channel: this.filters.channelFilter(),
      },
      kpis: this.kpis(),
      fixedCosts: this.fixedCosts(),
      netMargin: this.netMargin(),
      netMarginRate: this.netMarginRate(),
      breakEven: this.breakEven(),
      stores: this.storeRows(),
      categories: this.byCategory(),
      topSellers: this.topSellers(),
    };
    downloadFile('rapport-profit-boutika.json', JSON.stringify(report, null, 2));
    this.snackBar.open('Rapport JSON exporté', 'OK', { duration: 2500 });
  }

  private updateCharts(): void {
    const trend = groupByDay(this.scope());

    this.trendChartData.set({
      labels: trend.map((p) => p.label),
      datasets: [
        {
          type: 'bar',
          label: 'Revenus',
          data: trend.map((p) => p.revenue),
          backgroundColor: 'rgb(5, 150, 105)',
          borderRadius: 3,
          order: 2,
        },
        {
          type: 'line',
          label: 'Marge brute',
          data: trend.map((p) => p.margin),
          borderColor: '#6366f1',
          backgroundColor: 'transparent',
          tension: 0.3,
          pointRadius: 0,
          order: 1,
        },
      ],
    });

    const stores = this.byStore();
    this.storeChartData.set({
      labels: stores.map((s) => s.name),
      datasets: [
        { label: 'Marge brute', data: stores.map((s) => s.brute), backgroundColor: 'rgb(5, 150, 105)', borderRadius: 3 },
        { label: 'Marge nette', data: stores.map((s) => s.nette), backgroundColor: '#6366f1', borderRadius: 3 },
      ],
    });

    const cats = this.byCategory();
    this.categoryChartData.set({
      labels: cats.map((c) => c.name),
      datasets: [{
        label: 'Marge',
        data: cats.map((c) => c.marge),
        backgroundColor: cats.map((c) => c.color),
        borderRadius: 3,
      }],
    });

    const margin = this.kpis().margin;
    const variable = this.variableCosts();
    const fixed = this.fixedCosts();
    this.costChartData.set({
      labels: ['Marge brute', 'Coûts variables', 'Charges fixes'],
      datasets: [{
        data: [margin, variable, fixed],
        backgroundColor: ['#6366f1', '#f59e0b', '#f43f5e'],
      }],
    });

    this.marginRateChartData.set({
      labels: trend.map((p) => p.label),
      datasets: [{
        label: 'Taux de marge',
        data: trend.map((p) => (p.revenue ? (p.margin / p.revenue) * 100 : 0)),
        borderColor: 'rgb(5, 150, 105)',
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      }],
    });
  }
}
