import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../core/services/user.service';
import { OrderService } from '../../../core/services/order.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-manager-analytics',
  standalone: true,
  imports: [CurrencyPipe, MatIconModule, PageHeaderComponent, LoadingSpinnerComponent],
  template: `
    <app-page-header title="Analytique" subtitle="Indicateurs de performance" />

    @if (loading()) {
      <app-loading-spinner />
    } @else {
      <div class="analytics">
        <div class="chart-placeholder">
          <mat-icon>bar_chart</mat-icon>
          <p>Graphiques de ventes et tendances</p>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="label">Commandes ce mois</span>
            <span class="value">{{ stats()['ordersThisMonth'] ?? 0 }}</span>
          </div>
          <div class="stat-card">
            <span class="label">CA ce mois</span>
            <span class="value">{{ (stats()['revenueThisMonth'] ?? 0) | currency:'XOF':'symbol-narrow':'1.0-0' }}</span>
          </div>
          <div class="stat-card">
            <span class="label">Panier moyen</span>
            <span class="value">{{ (stats()['averageBasket'] ?? 0) | currency:'XOF':'symbol-narrow':'1.0-0' }}</span>
          </div>
          <div class="stat-card">
            <span class="label">Taux conversion</span>
            <span class="value">{{ stats()['conversionRate'] ?? 0 }}%</span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .analytics { padding: 16px 24px; }
    .chart-placeholder {
      background: var(--surface-alt);
      border-radius: 12px;
      padding: 48px;
      text-align: center;
      margin-bottom: 24px;
      color: var(--text-muted);
    }
    .chart-placeholder mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }
    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px;
    }
    .stat-card .label { font-size: 0.75rem; color: var(--text-muted); display: block; }
    .stat-card .value { font-size: 1.25rem; font-weight: 700; }
  `],
})
export class ManagerAnalyticsComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly orderService = inject(OrderService);

  stats = signal<Record<string, number>>({});
  loading = signal(true);

  ngOnInit(): void {
    this.userService.getAnalyticsOverview().subscribe({
      next: (data) => { this.stats.set(data); this.loading.set(false); },
      error: () => {
        this.orderService.getOrders().subscribe({
          next: (res) => {
            const orders = res.data ?? [];
            const total = orders.reduce((s, o) => s + o.total, 0);
            this.stats.set({
              ordersThisMonth: orders.length,
              revenueThisMonth: total,
              averageBasket: orders.length ? Math.round(total / orders.length) : 0,
              conversionRate: 0,
            });
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
    });
  }
}
