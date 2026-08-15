import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ManagerDataService } from '../../../core/services/manager-data.service';
import { ThemeService } from '../../../core/services/theme.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { ManagerStore } from '../../../core/data/demo-manager-stores';
import { categoryLabel } from '../../../core/data/categories';
import { Order, OrderStatus, Product, Seller } from '../../../core/models';
import { computeKpis, groupByDay, SaleRecord } from '../../../core/utils/analytics.util';
import { formatDate, formatMoney, initials } from '../../../core/utils/format.util';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

const MAP_BOUNDS = { minLat: 2, maxLat: 13, minLng: 8, maxLng: 16 };

@Component({
  selector: 'app-manager-store-detail',
  standalone: true,
  imports: [
    DecimalPipe,
    RouterLink,
    BaseChartDirective,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    EmptyStateComponent,
  ],
  template: `
    @if (store(); as s) {
      <div class="page">
        <a routerLink="/manager/stores" class="back">
          <mat-icon>arrow_back</mat-icon>
          Toutes les boutiques
        </a>

        <header class="head">
          <div>
            <div class="title-row">
              <h1>{{ s.name }}</h1>
              <span class="badge" [class]="s.status === 'active' ? 'success' : 'warning'">
                {{ s.status === 'active' ? 'Active' : 'En pause' }}
              </span>
            </div>
            <p class="subtitle">
              {{ s.address }}, {{ s.city }} · {{ s.region }} · créée le {{ formatDate(s.createdAt) }}
            </p>
            <div class="badges">
              @for (c of s.categories; track c) {
                <span class="badge accent">{{ categoryLabel(c) }}</span>
              }
            </div>
          </div>
          <div class="head-actions">
            <button mat-stroked-button type="button" (click)="toggleStatus()">
              <mat-icon>{{ s.status === 'active' ? 'pause' : 'play_arrow' }}</mat-icon>
              {{ s.status === 'active' ? 'Mettre en pause' : 'Réactiver' }}
            </button>
            <a mat-button [routerLink]="['/store', s.id]">Voir la fiche publique</a>
          </div>
        </header>

        <div class="stat-grid">
          <div class="stat-card">
            <span class="label">CA cumulé</span>
            <strong>{{ formatMoney(kpis().revenue) }}</strong>
            <span class="hint">{{ kpis().transactions }} transactions</span>
          </div>
          <div class="stat-card">
            <span class="label">Marge</span>
            <strong>{{ formatMoney(kpis().margin) }}</strong>
            <span class="hint">{{ kpis().marginRate | number:'1.1-1' }} %</span>
          </div>
          <div class="stat-card">
            <span class="label">Panier moyen</span>
            <strong>{{ formatMoney(kpis().averageBasket) }}</strong>
          </div>
          <div class="stat-card">
            <span class="label">Codes en attente</span>
            <strong>{{ pendingOrders() }}</strong>
            <span class="hint">{{ redeemedOrders() }} retirés</span>
          </div>
        </div>

        <div class="grid-3">
          <section class="card span-2">
            <h2>Chiffre d'affaires (30 derniers jours)</h2>
            <div class="chart-wrap">
              <canvas baseChart [type]="'bar'" [data]="revenueChartData" [options]="revenueChartOptions"></canvas>
            </div>
          </section>

          <section class="card">
            <h2>Accès vendeurs</h2>
            <div class="code-box">
              <p class="code-label">Mot de passe de la boutique</p>
              <p class="code-value">{{ s.accessCode }}</p>
              <p class="code-expiry">Valide jusqu'au {{ formatDate(s.accessCodeExpiry) }}</p>
            </div>
            <button mat-stroked-button type="button" class="full-btn" (click)="regenerate()">
              <mat-icon>refresh</mat-icon>
              Régénérer le mot de passe
            </button>
            <dl class="meta-list">
              <div>
                <dt>Vendeurs autorisés</dt>
                <dd>{{ team().length }} / {{ s.maxSellers }}</dd>
              </div>
              <div>
                <dt>Validation</dt>
                <dd>{{ s.autoApproveSellers ? 'Automatique' : 'Manuelle' }}</dd>
              </div>
              <div>
                <dt>Taux de taxe</dt>
                <dd>{{ s.taxRate }} %</dd>
              </div>
            </dl>
            <mat-slide-toggle
              class="auto-toggle"
              [checked]="s.autoApproveSellers"
              (change)="toggleAutoApprove($event.checked)"
            >
              Validation automatique
            </mat-slide-toggle>
          </section>
        </div>

        <div class="grid-3">
          <section class="card span-2">
            <h2>Équipe ({{ team().length }})</h2>
            @if (team().length) {
              <ul class="team-list">
                @for (seller of team(); track seller.id) {
                  <li>
                    <span class="avatar">{{ initials(seller.firstName + ' ' + seller.lastName) }}</span>
                    <div class="seller-info">
                      <p class="seller-name">{{ seller.firstName }} {{ seller.lastName }}</p>
                      <p class="seller-meta">{{ seller.position }} · {{ seller.shift }}</p>
                    </div>
                    <div class="rating">
                      @for (star of [1, 2, 3, 4, 5]; track star) {
                        <mat-icon [class.filled]="star <= Math.round(seller.rating ?? 0)">star</mat-icon>
                      }
                      <span class="rating-text">{{ (seller.rating ?? 0).toFixed(1) }} ({{ seller.reviewCount ?? 0 }})</span>
                    </div>
                    <span class="badge" [class]="sellerStatusTone(seller.status)">
                      {{ sellerStatusLabel(seller.status) }}
                    </span>
                  </li>
                }
              </ul>
            } @else {
              <p class="empty-inline">Aucun vendeur rattaché pour le moment.</p>
            }
          </section>

          <section class="card map-card">
            <h2>Localisation</h2>
            <div class="map-placeholder">
              <div class="map-grid"></div>
              <button
                type="button"
                class="map-pin"
                [style.left.%]="mapPin().x"
                [style.top.%]="mapPin().y"
                [title]="s.name + ' — ' + (s.landmark ?? '')"
              ></button>
            </div>
            <div class="map-footer">
              <p>
                <mat-icon>vpn_key</mat-icon>
                {{ s.registrationNumber }} · {{ s.legalStatus }}
              </p>
              <p>
                Zone de service : {{ s.serviceRadiusKm }} km · {{ productCount() }} références au catalogue
              </p>
            </div>
          </section>
        </div>

        <section class="card">
          <h2>Catalogue</h2>
          @if (topProducts().length) {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th class="right">Prix</th>
                    <th class="right">Stock</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of topProducts(); track p.id) {
                    <tr>
                      <td>{{ p.name }}</td>
                      <td class="right">{{ formatMoney(p.price) }}</td>
                      <td class="right">{{ p.stock }}</td>
                      <td>
                        <span class="badge" [class]="productStatusTone(p)">
                          {{ productStatusLabel(p) }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="empty-inline">Aucun produit dans le catalogue.</p>
          }
        </section>

        <section class="card">
          <h2>Dernières commandes</h2>
          @if (recentOrders().length) {
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Réf.</th>
                    <th>Client</th>
                    <th>Statut</th>
                    <th class="right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (o of recentOrders(); track o.id) {
                    <tr>
                      <td class="mono">{{ o.reference ?? o.orderNumber }}</td>
                      <td>{{ o.customerName ?? o.customerPhone ?? '—' }}</td>
                      <td>
                        <span class="badge" [class]="orderStatusTone(o.status)">
                          {{ orderStatusLabel(o.status) }}
                        </span>
                      </td>
                      <td class="right strong">{{ formatMoney(o.total) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="empty-inline">Aucune commande pour cette boutique.</p>
          }
        </section>
      </div>
    } @else if (loaded()) {
      <app-empty-state
        icon="store"
        title="Boutique introuvable"
        message="Cette boutique n'existe pas ou a été supprimée."
      >
        <a routerLink="/manager/stores" mat-stroked-button>Toutes les boutiques</a>
      </app-empty-state>
    }
  `,
  styles: [`
    .page {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding-bottom: 24px;
      max-width: 80rem;
    }
    .back {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: rgb(var(--muted));
      text-decoration: none;
      font-size: 14px;
    }
    .back mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .back:hover { color: rgb(var(--ink)); }
    .head {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }
    .title-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    .subtitle {
      margin: 4px 0 0;
      font-size: 14px;
      color: rgb(var(--muted));
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge.success { background: rgb(5 150 105 / 0.12); color: #059669; }
    .badge.warning { background: rgb(217 119 6 / 0.12); color: #d97706; }
    .badge.danger { background: rgb(220 38 38 / 0.12); color: #dc2626; }
    .badge.neutral { background: rgb(var(--surface-2)); color: rgb(var(--muted)); }
    .badge.accent { background: rgb(var(--accent) / 0.12); color: rgb(var(--accent)); }
    .head-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .stat-grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    }
    @media (min-width: 1024px) {
      .stat-grid { grid-template-columns: repeat(4, 1fr); }
    }
    .stat-card {
      padding: 16px;
      border: 1px solid rgb(var(--line));
      border-radius: 12px;
      background: rgb(var(--surface));
    }
    .stat-card .label {
      display: block;
      font-size: 12px;
      color: rgb(var(--muted));
    }
    .stat-card strong {
      display: block;
      margin-top: 4px;
      font-size: 1.25rem;
      font-weight: 600;
    }
    .stat-card .hint {
      display: block;
      margin-top: 2px;
      font-size: 12px;
      color: rgb(var(--muted));
    }
    .grid-3 {
      display: grid;
      gap: 20px;
    }
    @media (min-width: 1024px) {
      .grid-3 { grid-template-columns: repeat(3, 1fr); }
      .span-2 { grid-column: span 2; }
    }
    .card {
      padding: 16px;
      border: 1px solid rgb(var(--line));
      border-radius: 12px;
      background: rgb(var(--surface));
    }
    .card h2 {
      margin: 0 0 12px;
      font-size: 1rem;
      font-weight: 600;
    }
    .chart-wrap {
      height: 256px;
      position: relative;
    }
    .code-box {
      padding: 12px;
      border-radius: 8px;
      background: rgb(var(--surface-2));
    }
    .code-label {
      margin: 0;
      font-size: 12px;
      color: rgb(var(--muted));
    }
    .code-value {
      margin: 4px 0 0;
      font-family: ui-monospace, monospace;
      font-size: 1.125rem;
      font-weight: 600;
      letter-spacing: 0.08em;
    }
    .code-expiry {
      margin: 4px 0 0;
      font-size: 12px;
      color: rgb(var(--muted));
    }
    .full-btn {
      width: 100%;
      margin-top: 12px;
    }
    .meta-list {
      margin: 16px 0 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 14px;
    }
    .meta-list div {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }
    .meta-list dt { margin: 0; color: rgb(var(--muted)); }
    .meta-list dd { margin: 0; font-weight: 500; }
    .auto-toggle { margin-top: 12px; display: block; }
    .team-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .team-list li {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid rgb(var(--line));
    }
    .team-list li:last-child { border-bottom: none; }
    .avatar {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      background: rgb(var(--accent) / 0.1);
      color: rgb(var(--accent));
    }
    .seller-info {
      flex: 1;
      min-width: 0;
    }
    .seller-name {
      margin: 0;
      font-size: 14px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .seller-meta {
      margin: 2px 0 0;
      font-size: 12px;
      color: rgb(var(--muted));
    }
    .rating {
      display: flex;
      align-items: center;
      gap: 2px;
      flex-shrink: 0;
    }
    .rating mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: rgb(var(--line));
    }
    .rating mat-icon.filled { color: #f59e0b; }
    .rating-text {
      margin-left: 4px;
      font-size: 11px;
      color: rgb(var(--muted));
      white-space: nowrap;
    }
    .map-card { padding: 16px 16px 0; overflow: hidden; }
    .map-placeholder {
      position: relative;
      height: 240px;
      margin: 0 -16px;
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
      width: 16px;
      height: 16px;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      border: 2px solid white;
      background: rgb(var(--accent));
      box-shadow: 0 2px 8px rgb(0 0 0 / 0.15);
      cursor: default;
      padding: 0;
    }
    .map-footer {
      padding: 16px 0;
      font-size: 12px;
      color: rgb(var(--muted));
    }
    .map-footer p {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .map-footer p + p { margin-top: 4px; }
    .map-footer mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
    .table-wrap { overflow-x: auto; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th, td {
      padding: 10px 8px;
      border-bottom: 1px solid rgb(var(--line));
      text-align: left;
    }
    th {
      font-size: 12px;
      font-weight: 500;
      color: rgb(var(--muted));
    }
    .right { text-align: right; }
    .strong { font-weight: 600; }
    .mono { font-family: ui-monospace, monospace; font-size: 13px; }
    .empty-inline {
      margin: 0;
      padding: 16px 0;
      font-size: 14px;
      color: rgb(var(--muted));
    }
  `],
})
export class ManagerStoreDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly data = inject(ManagerDataService);
  private readonly theme = inject(ThemeService);
  private readonly catalog = inject(CatalogService);
  private readonly snack = inject(MatSnackBar);

  readonly Math = Math;
  readonly formatMoney = formatMoney;
  readonly formatDate = formatDate;
  readonly initials = initials;
  readonly categoryLabel = categoryLabel;

  store = signal<ManagerStore | null>(null);
  loaded = signal(false);
  products = signal<Product[]>([]);

  storeSales = computed((): SaleRecord[] => {
    const id = this.store()?.id;
    if (!id) return [];
    return this.data.getSales().filter((s) => s.storeId === id);
  });

  kpis = computed(() => {
    const id = this.store()?.id;
    const empty = { revenue: 0, margin: 0, marginRate: 0, transactions: 0, averageBasket: 0, units: 0, customers: 0 };
    if (!id) return empty;
    const sales = this.storeSales();
    return sales.length ? computeKpis(sales) : this.data.storeKpis(id);
  });

  chartSeries = computed(() => groupByDay(this.storeSales()).slice(-30));

  team = computed((): Seller[] => {
    const id = this.store()?.id;
    return id ? this.data.getSellers({ storeId: id }) : [];
  });

  orders = computed((): Order[] => {
    const id = this.store()?.id;
    return id ? this.data.getStoreOrders(id) : [];
  });

  pendingOrders = computed(() => this.orders().filter((o) => o.status === 'pending').length);

  redeemedOrders = computed(() => this.orders().filter((o) => o.status === 'redeemed').length);

  recentOrders = computed(() =>
    [...this.orders()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
  );

  topProducts = computed(() => this.products().slice(0, 8));

  productCount = computed(() => {
    const id = this.store()?.id;
    return id ? this.data.storeProductStats(id).items : 0;
  });

  mapPin = computed(() => {
    const s = this.store();
    if (!s) return { x: 50, y: 50 };
    return {
      x: ((s.lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100,
      y: ((MAP_BOUNDS.maxLat - s.lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100,
    };
  });

  revenueChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  revenueChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => formatMoney(Number(ctx.raw)) } },
    },
    scales: {
      x: { ticks: { font: { size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
      y: { ticks: { font: { size: 11 }, callback: (v) => `${Math.round(Number(v) / 1000)}k` } },
    },
  };

  constructor() {
    effect(() => {
      const series = this.chartSeries();
      this.revenueChartData = {
        labels: series.map((p) => p.label),
        datasets: [
          {
            data: series.map((p) => p.revenue),
            backgroundColor: 'rgb(5, 150, 105)',
            borderRadius: 4,
          },
        ],
      };
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.set(this.data.getStore(id) ?? null);
      this.catalog.getProducts({ storeId: id, limit: 8 }).subscribe((res) => this.products.set(res.data));
    }
    this.loaded.set(true);
  }

  toggleStatus(): void {
    const s = this.store();
    if (!s) return;
    const updated = this.data.toggleStoreStatus(s.id);
    if (updated) {
      this.store.set(updated);
      this.snack.open(
        updated.status === 'active' ? 'Boutique réactivée' : 'Boutique mise en pause',
        undefined,
        { duration: 3000 },
      );
    }
  }

  regenerate(): void {
    const s = this.store();
    if (!s) return;
    const code = this.data.regenerateAccessCode(s.id, this.theme.settings().accessCodeLength);
    this.store.set(this.data.getStore(s.id) ?? null);
    this.snack.open('Nouveau mot de passe généré', code, { duration: 4000 });
  }

  toggleAutoApprove(value: boolean): void {
    const s = this.store();
    if (!s) return;
    this.data.updateStore(s.id, { autoApproveSellers: value });
    this.store.set(this.data.getStore(s.id) ?? null);
  }

  sellerStatusLabel(status: Seller['status']): string {
    return status === 'active' ? 'Actif' : status === 'pending' ? 'En attente' : 'Suspendu';
  }

  sellerStatusTone(status: Seller['status']): string {
    return status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'danger';
  }

  productStatusLabel(p: Product): string {
    if (!p.isActive) return 'Inactif';
    return p.stock > 0 ? 'En stock' : 'Rupture';
  }

  productStatusTone(p: Product): string {
    if (!p.isActive) return 'neutral';
    return p.stock > 0 ? 'success' : 'warning';
  }

  orderStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      pending: 'En attente',
      ready: 'Prêt',
      redeemed: 'Retiré',
      cancelled: 'Annulé',
      rated: 'Noté',
      expired: 'Expiré',
    };
    return labels[status];
  }

  orderStatusTone(status: OrderStatus): string {
    if (status === 'redeemed' || status === 'rated') return 'success';
    if (status === 'pending' || status === 'ready') return 'warning';
    if (status === 'cancelled' || status === 'expired') return 'danger';
    return 'neutral';
  }
}
