import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Order } from '../../../core/models';

@Component({
  selector: 'app-seller-profit',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, MatIconModule, PageHeaderComponent, LoadingSpinnerComponent],
  template: `
    <app-page-header title="Revenus" />

    @if (loading()) {
      <app-loading-spinner />
    } @else {
      <div class="profit-page">
        <div class="total-card">
          <span class="label">Revenus totaux</span>
          <span class="amount">{{ totalRevenue() | currency:'XOF':'symbol-narrow':'1.0-0' }}</span>
          <span class="count">{{ redeemedOrders().length }} commandes validees</span>
        </div>

        <h3 class="section-title">Historique recent</h3>
        @for (order of redeemedOrders(); track order.id) {
          <div class="history-row">
            <div>
              <strong>#{{ order.orderNumber }}</strong>
              <span>{{ order.createdAt | date:'dd/MM/yyyy' }}</span>
            </div>
            <span class="amount-sm">{{ order.total | currency:'XOF':'symbol-narrow':'1.0-0' }}</span>
          </div>
        } @empty {
          <p class="empty">Aucune commande validee.</p>
        }
      </div>
    }
  `,
  styles: [`
    .profit-page { padding: 16px; }
    .total-card {
      background: linear-gradient(135deg, #059669, #047857);
      color: white;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .total-card .label { font-size: 0.8125rem; opacity: 0.85; }
    .total-card .amount { display: block; font-size: 2rem; font-weight: 700; margin: 4px 0; }
    .total-card .count { font-size: 0.8125rem; opacity: 0.75; }
    .section-title { font-size: 0.9375rem; margin-bottom: 12px; }
    .history-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--border);
    }
    .history-row strong { display: block; font-size: 0.875rem; }
    .history-row span { font-size: 0.75rem; color: var(--text-muted); }
    .amount-sm { font-weight: 600; color: #059669; }
    .empty { text-align: center; color: var(--text-muted); padding: 24px; }
  `],
})
export class SellerProfitComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly auth = inject(AuthService);

  redeemedOrders = signal<Order[]>([]);
  totalRevenue = signal(0);
  loading = signal(true);

  ngOnInit(): void {
    const user = this.auth.user();
    this.orderService.getOrders({
      status: 'redeemed',
      storeId: user?.storeId,
    }).subscribe({
      next: (res) => {
        const orders = res.data ?? [];
        this.redeemedOrders.set(orders);
        this.totalRevenue.set(orders.reduce((sum, o) => sum + o.total, 0));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
