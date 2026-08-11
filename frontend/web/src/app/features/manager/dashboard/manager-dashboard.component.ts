import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { StoreService } from '../../../core/services/store.service';
import { SellerService } from '../../../core/services/seller.service';
import { OrderService } from '../../../core/services/order.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CurrencyPipe, MatIconModule, PageHeaderComponent, LoadingSpinnerComponent],
  template: `
    <app-page-header title="Tableau de bord" subtitle="Vue d'ensemble MyShop" />

    @if (loading()) {
      <app-loading-spinner />
    } @else {
      <div class="dashboard">
        <div class="kpi-grid">
          <div class="kpi-card">
            <mat-icon>store</mat-icon>
            <span class="value">{{ storeCount() }}</span>
            <span class="label">Boutiques</span>
          </div>
          <div class="kpi-card">
            <mat-icon>badge</mat-icon>
            <span class="value">{{ sellerCount() }}</span>
            <span class="label">Vendeurs</span>
          </div>
          <div class="kpi-card">
            <mat-icon>receipt_long</mat-icon>
            <span class="value">{{ orderCount() }}</span>
            <span class="label">Commandes</span>
          </div>
          <div class="kpi-card highlight">
            <mat-icon>account_balance</mat-icon>
            <span class="value">{{ totalRevenue() | currency:'XOF':'symbol-narrow':'1.0-0' }}</span>
            <span class="label">CA total</span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .dashboard { padding: 16px 24px; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
    }
    .kpi-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .kpi-card mat-icon { color: #7c3aed; }
    .kpi-card.highlight { background: rgba(124, 58, 237, 0.06); border-color: rgba(124, 58, 237, 0.2); }
    .value { font-size: 1.5rem; font-weight: 700; }
    .label { font-size: 0.8125rem; color: var(--text-muted); }
  `],
})
export class ManagerDashboardComponent implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly sellerService = inject(SellerService);
  private readonly orderService = inject(OrderService);

  storeCount = signal(0);
  sellerCount = signal(0);
  orderCount = signal(0);
  totalRevenue = signal(0);
  loading = signal(true);

  ngOnInit(): void {
    this.storeService.getStores({ limit: 1 }).subscribe({
      next: (res) => this.storeCount.set(res.total ?? 0),
    });
    this.sellerService.getSellers().subscribe({
      next: (res) => this.sellerCount.set(res.total ?? (res.data?.length ?? 0)),
    });
    this.orderService.getOrders().subscribe({
      next: (res) => {
        const orders = res.data ?? [];
        this.orderCount.set(res.total ?? orders.length);
        this.totalRevenue.set(orders.reduce((s, o) => s + o.total, 0));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
