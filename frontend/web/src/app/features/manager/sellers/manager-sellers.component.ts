import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ManagerDataService } from '../../../core/services/manager-data.service';
import { SellerService } from '../../../core/services/seller.service';
import { ManagerStore } from '../../../core/data/demo-manager-stores';
import { Seller } from '../../../core/models';
import { formatDate, formatMoney, initials } from '../../../core/utils/format.util';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-manager-sellers',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    EmptyStateComponent,
  ],
  template: `
    <div class="page">
      <header>
        <h1>Vendeurs</h1>
        <p>Validation des inscriptions, rôles et suivi des performances individuelles.</p>
      </header>

      <div class="stat-grid">
        <div class="stat card">
          <mat-icon>groups</mat-icon>
          <span class="label">Vendeurs</span>
          <strong>{{ sellers().length }}</strong>
        </div>
        <div class="stat card">
          <span class="label">Actifs</span>
          <strong>{{ activeCount() }}</strong>
        </div>
        <div class="stat card">
          <mat-icon>how_to_reg</mat-icon>
          <span class="label">En attente</span>
          <strong>{{ pendingCount() }}</strong>
        </div>
        <div class="stat card">
          <span class="label">Suspendus</span>
          <strong>{{ suspendedCount() }}</strong>
        </div>
      </div>

      <div class="filters">
        <select [ngModel]="storeFilter()" (ngModelChange)="storeFilter.set($event)" aria-label="Filtrer par boutique" class="select filter-control">
          <option value="all">Toutes les boutiques</option>
          @for (store of stores(); track store.id) {
            <option [value]="store.id">{{ store.name }}</option>
          }
        </select>
        <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)" aria-label="Filtrer par statut" class="select filter-control">
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="pending">En attente</option>
          <option value="suspended">Suspendus</option>
        </select>
        <div class="search-wrap">
          <mat-icon>search</mat-icon>
          <input
            [ngModel]="query()"
            (ngModelChange)="query.set($event)"
            placeholder="Rechercher un vendeur…"
            aria-label="Rechercher un vendeur"
          />
        </div>
      </div>

      @if (rows().length) {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vendeur</th>
                <th>Boutique</th>
                <th>Poste</th>
                <th>Note</th>
                <th class="right">Ventes</th>
                <th>Statut</th>
                <th class="right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (seller of rows(); track seller.id) {
                <tr>
                  <td>
                    <div class="seller-cell">
                      <span class="avatar">{{ initials(seller.firstName + ' ' + seller.lastName) }}</span>
                      <div>
                        <p class="name">{{ seller.firstName }} {{ seller.lastName }}</p>
                        <p class="sub">{{ seller.email }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="muted">{{ storeName(seller.storeId) }}</td>
                  <td class="muted">
                    {{ seller.position }}
                    @if (seller.joinedAt) {
                      <span class="since">depuis {{ formatDate(seller.joinedAt) }}</span>
                    }
                  </td>
                  <td>
                    <div class="stars">
                      @for (s of [1, 2, 3, 4, 5]; track s) {
                        <mat-icon [class.filled]="s <= Math.round(seller.rating ?? 0)">star</mat-icon>
                      }
                      <span>{{ (seller.rating ?? 0).toFixed(1) }} ({{ seller.reviewCount ?? 0 }})</span>
                    </div>
                  </td>
                  <td class="right">
                    <span class="strong">{{ seller.salesCount ?? 0 }}</span>
                    <span class="sub block">{{ formatMoney(seller.revenue ?? 0) }}</span>
                  </td>
                  <td>
                    <span class="badge" [class]="sellerStatusTone(seller.status)">
                      {{ sellerStatusLabel(seller.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="actions">
                      @if (seller.status !== 'active') {
                        <button type="button" class="btn-outline sm" (click)="activateSeller(seller)">
                          <mat-icon>check</mat-icon>
                          Activer
                        </button>
                      }
                      @if (seller.status !== 'suspended') {
                        <button type="button" class="btn-ghost sm" (click)="suspendSeller(seller)">
                          <mat-icon>shield</mat-icon>
                          Suspendre
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <app-empty-state
          icon="badge"
          title="Aucun vendeur"
          message="Ajustez les filtres ou communiquez le mot de passe de la boutique à votre équipe."
        />
      }
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 20px; padding-bottom: 24px; }
    h1 { margin: 0; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em; }
    header p { margin: 4px 0 0; font-size: 14px; color: rgb(var(--muted)); }
    .stat { padding: 16px; display: flex; flex-direction: column; gap: 4px; }
    .stat mat-icon { color: rgb(var(--accent)); font-size: 20px; width: 20px; height: 20px; }
    .stat .label { font-size: 12px; color: rgb(var(--muted)); }
    .stat strong { font-size: 1.25rem; }
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
    .select {
      padding: 10px 14px; border-radius: 999px; border: 1px solid rgb(var(--line));
      background: rgb(var(--surface)); font-size: 14px; color: rgb(var(--ink));
    }
    .filter-control { flex-shrink: 0; cursor: pointer; }
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
    .seller-cell { display: flex; align-items: center; gap: 10px; }
    .avatar {
      width: 32px; height: 32px; border-radius: 999px; flex-shrink: 0;
      background: rgba(var(--accent), 0.1); color: rgb(var(--accent));
      font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .name { margin: 0; font-weight: 500; }
    .sub { margin: 2px 0 0; font-size: 12px; color: rgb(var(--muted)); }
    .sub.block { display: block; }
    .since { display: block; font-size: 11px; margin-top: 2px; }
    .muted { color: rgb(var(--muted)); }
    .strong { font-weight: 600; }
    .stars { display: flex; align-items: center; gap: 1px; }
    .stars mat-icon { font-size: 14px; width: 14px; height: 14px; color: #d1d5db; }
    .stars mat-icon.filled { color: #fbbf24; }
    .stars span { margin-left: 6px; font-size: 12px; color: rgb(var(--muted)); white-space: nowrap; }
    .badge {
      display: inline-block; padding: 2px 8px; border-radius: 999px;
      font-size: 11px; font-weight: 600;
    }
    .badge.success { background: rgba(5, 150, 105, 0.12); color: #047857; }
    .badge.warning { background: rgba(245, 158, 11, 0.15); color: #b45309; }
    .badge.danger { background: rgba(244, 63, 94, 0.15); color: #be123c; }
    .actions { display: flex; justify-content: flex-end; gap: 6px; flex-wrap: wrap; }
    .btn-outline, .btn-ghost {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .btn-outline {
      border: 1px solid rgb(var(--line)); background: rgb(var(--surface-2)); color: rgb(var(--ink));
    }
    .btn-ghost {
      border: 1px solid rgb(var(--line)); background: rgb(var(--surface-2)); color: rgb(var(--muted));
    }
    .btn-outline mat-icon, .btn-ghost mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .btn-outline:hover { background: rgb(var(--surface)); border-color: rgb(var(--accent)); color: rgb(var(--accent)); }
    .btn-ghost:hover { color: rgb(var(--ink)); background: rgb(var(--surface)); border-color: rgb(var(--line)); }
  `],
})
export class ManagerSellersComponent implements OnInit {
  private readonly managerData = inject(ManagerDataService);
  private readonly sellerService = inject(SellerService);
  private readonly snackBar = inject(MatSnackBar);

  readonly formatMoney = formatMoney;
  readonly formatDate = formatDate;
  readonly initials = initials;
  readonly Math = Math;

  stores = signal<ManagerStore[]>([]);
  sellers = signal<Seller[]>([]);
  query = signal('');
  storeFilter = signal('all');
  statusFilter = signal('all');

  activeCount = computed(() => this.sellers().filter((s) => s.status === 'active').length);
  pendingCount = computed(() => this.sellers().filter((s) => s.status === 'pending').length);
  suspendedCount = computed(() => this.sellers().filter((s) => s.status === 'suspended').length);

  rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    const store = this.storeFilter();
    const status = this.statusFilter();
    return this.sellers()
      .filter((s) => store === 'all' || s.storeId === store)
      .filter((s) => status === 'all' || s.status === status)
      .filter((s) => `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(q));
  });

  ngOnInit(): void {
    this.stores.set(this.managerData.getManagerStores());
    this.loadSellers();
  }

  storeName(storeId: string): string {
    return this.stores().find((s) => s.id === storeId)?.name ?? '—';
  }

  sellerStatusTone(status: Seller['status']): string {
    if (status === 'active') return 'success';
    if (status === 'pending') return 'warning';
    return 'danger';
  }

  sellerStatusLabel(status: Seller['status']): string {
    if (status === 'active') return 'Actif';
    if (status === 'pending') return 'En attente';
    return 'Suspendu';
  }

  activateSeller(seller: Seller): void {
    const req = seller.status === 'pending'
      ? this.sellerService.approve(seller.id)
      : this.sellerService.activate(seller.id);
    req.subscribe({
      next: () => {
        this.snackBar.open(`${seller.firstName} activé`, 'OK', { duration: 2000 });
        this.loadSellers();
      },
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 }),
    });
  }

  suspendSeller(seller: Seller): void {
    this.sellerService.suspend(seller.id).subscribe({
      next: () => {
        this.snackBar.open(`${seller.firstName} suspendu`, 'OK', { duration: 2000 });
        this.loadSellers();
      },
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 }),
    });
  }

  private loadSellers(): void {
    this.sellers.set(this.managerData.getSellers());
  }
}
