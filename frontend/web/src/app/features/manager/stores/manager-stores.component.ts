import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CatalogService } from '../../../core/services/catalog.service';
import { ManagerDataService } from '../../../core/services/manager-data.service';
import { ManagerStore } from '../../../core/data/demo-manager-stores';
import { categoryLabel } from '../../../core/data/categories';
import { Product } from '../../../core/models';
import { formatMoney } from '../../../core/utils/format.util';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { SegmentedTabsComponent } from '../../../shared/components/segmented-tabs/segmented-tabs.component';

const STATUS_TONE: Record<ManagerStore['status'], string> = {
  active: 'success',
  draft: 'neutral',
  paused: 'warning',
  suspended: 'danger',
};

const STATUS_LABEL: Record<ManagerStore['status'], string> = {
  active: 'Active',
  draft: 'Brouillon',
  paused: 'En pause',
  suspended: 'Suspendue',
};

interface StoreRow {
  store: ManagerStore;
  revenue: number;
  sellers: number;
  items: number;
  outOfStock: number;
}

@Component({
  selector: 'app-manager-stores',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    SegmentedTabsComponent,
  ],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>Boutiques</h1>
          <p>{{ stores().length }} points de vente physiques dans l'enseigne.</p>
        </div>
        <a routerLink="/manager/stores/new" class="btn-primary">
          <mat-icon>add</mat-icon>
          Créer une boutique
        </a>
      </header>

      <div class="summary-grid">
        <div class="summary card">
          <span>Actives</span>
          <strong>{{ activeCount() }}</strong>
        </div>
        <div class="summary card">
          <span>CA cumulé enseigne</span>
          <strong>{{ formatMoney(totalRevenue()) }}</strong>
        </div>
        <div class="summary card">
          <span>Vendeurs rattachés</span>
          <strong>{{ sellers().length }}</strong>
        </div>
        <div class="summary card">
          <span>En pause / brouillon</span>
          <strong>{{ pausedCount() }}</strong>
        </div>
      </div>

      <div class="filters">
        <app-segmented-tabs
          [items]="statusTabs"
          [value]="status()"
          size="sm"
          (valueChange)="status.set($event)"
        />
        <div class="search-wrap">
          <mat-icon>search</mat-icon>
          <input
            [ngModel]="query()"
            (ngModelChange)="query.set($event)"
            placeholder="Rechercher une boutique, une ville…"
            aria-label="Rechercher une boutique"
          />
        </div>
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (rows().length) {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Boutique</th>
                <th>Catégories</th>
                <th>Statut</th>
                <th class="right">CA cumulé</th>
                <th class="right">Vendeurs</th>
                <th class="right">Stock</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.store.id) {
                <tr>
                  <td>
                    <p class="name">{{ row.store.name }}</p>
                    <p class="sub">{{ row.store.city }} · {{ row.store.region }}</p>
                  </td>
                  <td>
                    <div class="badges">
                      @for (cat of row.store.categories.slice(0, 3); track cat) {
                        <span class="badge neutral">{{ categoryLabel(cat) }}</span>
                      }
                      @if (row.store.categories.length > 3) {
                        <span class="badge neutral">+{{ row.store.categories.length - 3 }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <span class="badge" [class]="statusTone(row.store.status)">
                      {{ statusLabel(row.store.status) }}
                    </span>
                  </td>
                  <td class="right strong">{{ formatMoney(row.revenue) }}</td>
                  <td class="right muted">{{ row.sellers }}/{{ row.store.maxSellers }}</td>
                  <td class="right muted">
                    {{ row.items }} réf.
                    @if (row.outOfStock > 0) {
                      <span class="rupture">({{ row.outOfStock }} rupt.)</span>
                    }
                  </td>
                  <td>
                    <div class="stars">
                      @for (s of [1, 2, 3, 4, 5]; track s) {
                        <mat-icon [class.filled]="s <= Math.round(row.store.rating)">star</mat-icon>
                      }
                      <span>{{ row.store.rating.toFixed(1) }} ({{ row.store.reviewCount }})</span>
                    </div>
                  </td>
                  <td class="right">
                    <a [routerLink]="['/manager/stores', row.store.id]" class="link">Détails</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <app-empty-state
          icon="store"
          title="Aucune boutique"
          message="Ajustez la recherche ou créez une nouvelle boutique."
        />
      }
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 20px; padding-bottom: 24px; }
    .page-head {
      display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 12px;
    }
    h1 { margin: 0; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em; }
    .page-head p { margin: 4px 0 0; font-size: 14px; color: rgb(var(--muted)); }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 16px; border-radius: 999px; border: none;
      background: rgb(var(--accent)); color: white;
      font-size: 14px; font-weight: 600; text-decoration: none; cursor: pointer;
    }
    .btn-primary mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .summary-grid { display: grid; gap: 12px; grid-template-columns: repeat(2, 1fr); }
    @media (min-width: 768px) { .summary-grid { grid-template-columns: repeat(4, 1fr); } }
    .summary { padding: 14px 16px; }
    .summary span { font-size: 12px; color: rgb(var(--muted)); }
    .summary strong { display: block; margin-top: 4px; font-size: 1.125rem; }
    .filters { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
    .search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 24rem; }
    .search-wrap mat-icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      font-size: 18px; width: 18px; height: 18px; color: rgb(var(--muted));
    }
    .search-wrap input {
      width: 100%; padding: 10px 14px 10px 40px; border-radius: 999px;
      border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); font-size: 14px;
    }
    .table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    thead { border-bottom: 1px solid rgb(var(--line)); text-align: left; }
    th {
      padding: 12px 16px; font-size: 11px; text-transform: uppercase;
      letter-spacing: 0.04em; color: rgb(var(--muted)); font-weight: 600;
    }
    td { padding: 12px 16px; border-top: 1px solid rgb(var(--line)); vertical-align: middle; }
    tr:hover td { background: rgb(var(--surface-2)); }
    td.right, th.right { text-align: right; }
    .name { margin: 0; font-weight: 500; }
    .sub { margin: 2px 0 0; font-size: 12px; color: rgb(var(--muted)); }
    .badges { display: flex; flex-wrap: wrap; gap: 4px; }
    .badge {
      display: inline-block; padding: 2px 8px; border-radius: 999px;
      font-size: 11px; font-weight: 600;
    }
    .badge.success { background: rgba(5, 150, 105, 0.12); color: #047857; }
    .badge.warning { background: rgba(245, 158, 11, 0.15); color: #b45309; }
    .badge.danger { background: rgba(244, 63, 94, 0.15); color: #be123c; }
    .badge.neutral { background: rgb(var(--surface-2)); color: rgb(var(--muted)); }
    .strong { font-weight: 600; }
    .muted { color: rgb(var(--muted)); }
    .rupture { color: #f43f5e; margin-left: 4px; }
    .stars { display: flex; align-items: center; gap: 1px; }
    .stars mat-icon { font-size: 14px; width: 14px; height: 14px; color: #d1d5db; }
    .stars mat-icon.filled { color: #fbbf24; }
    .stars span { margin-left: 6px; font-size: 12px; color: rgb(var(--muted)); white-space: nowrap; }
    .link {
      display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 8px;
      font-size: 12px; font-weight: 600; color: rgb(var(--accent));
      background: rgb(var(--surface-2)); border: 1px solid rgb(var(--line));
      text-decoration: none; transition: background 0.15s, border-color 0.15s;
    }
    .link:hover { background: rgb(var(--surface)); border-color: rgb(var(--accent)); }
  `],
})
export class ManagerStoresComponent implements OnInit {
  private readonly managerData = inject(ManagerDataService);
  private readonly catalog = inject(CatalogService);

  readonly formatMoney = formatMoney;
  readonly categoryLabel = categoryLabel;
  readonly statusTone = (s: ManagerStore['status']) => STATUS_TONE[s];
  readonly statusLabel = (s: ManagerStore['status']) => STATUS_LABEL[s];
  readonly Math = Math;

  readonly statusTabs = [
    { id: 'all', label: 'Tous' },
    { id: 'active', label: 'Actives' },
    { id: 'paused', label: 'En pause' },
    { id: 'draft', label: 'Brouillons' },
    { id: 'suspended', label: 'Suspendues' },
  ];

  stores = signal<ManagerStore[]>([]);
  sellers = signal(this.managerData.getSellers());
  sales = signal(this.managerData.getSales());
  products = signal<Product[]>([]);
  loading = signal(true);
  status = signal('all');
  query = signal('');

  activeCount = computed(() => this.stores().filter((s) => s.status === 'active').length);
  pausedCount = computed(() => this.stores().filter((s) => s.status === 'paused' || s.status === 'draft').length);
  totalRevenue = computed(() => this.sales().reduce((a, s) => a + s.revenue, 0));

  rows = computed((): StoreRow[] => {
    const q = this.query().trim().toLowerCase();
    const st = this.status();
    const sales = this.sales();
    const sellers = this.sellers();
    const products = this.products();

    return this.stores()
      .filter((s) => st === 'all' || s.status === st)
      .filter((s) => `${s.name} ${s.city} ${s.region}`.toLowerCase().includes(q))
      .map((store) => ({
        store,
        revenue: sales.filter((s) => s.storeId === store.id).reduce((a, s) => a + s.revenue, 0),
        sellers: sellers.filter((s) => s.storeId === store.id).length,
        items: products.filter((p) => p.storeId === store.id).length,
        outOfStock: products.filter((p) => p.storeId === store.id && p.stock === 0).length,
      }));
  });

  ngOnInit(): void {
    this.stores.set(this.managerData.getManagerStores());
    this.catalog.getProducts({ limit: 500 }).subscribe({
      next: (res) => {
        this.products.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
