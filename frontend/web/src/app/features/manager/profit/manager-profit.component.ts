import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { OrderService } from '../../../core/services/order.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-manager-profit',
  standalone: true,
  imports: [CurrencyPipe, MatIconModule, PageHeaderComponent, LoadingSpinnerComponent],
  template: `
    <app-page-header title="Profits" subtitle="Revenus de la marketplace" />

    @if (loading()) {
      <app-loading-spinner />
    } @else {
      <div class="profit-page">
        <div class="total-card">
          <mat-icon>account_balance</mat-icon>
          <span class="label">Revenus totaux</span>
          <span class="amount">{{ totalRevenue() | currency:'XOF':'symbol-narrow':'1.0-0' }}</span>
        </div>

        <div class="breakdown">
          <h3>Repartition par statut</h3>
          @for (entry of breakdown(); track entry.status) {
            <div class="breakdown-row">
              <span>{{ entry.label }}</span>
              <span>{{ entry.count }} cmd</span>
              <span class="amount">{{ entry.total | currency:'XOF':'symbol-narrow':'1.0-0' }}</span>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .profit-page { padding: 16px 24px; }
    .total-card {
      background: linear-gradient(135deg, #7c3aed, #6d28d9);
      color: white;
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 24px;
    }
    .total-card mat-icon { font-size: 32px; width: 32px; height: 32px; opacity: 0.8; }
    .total-card .label { display: block; font-size: 0.8125rem; opacity: 0.85; margin-top: 8px; }
    .total-card .amount { display: block; font-size: 2rem; font-weight: 700; }
    .breakdown h3 { font-size: 0.9375rem; margin-bottom: 12px; }
    .breakdown-row {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
      font-size: 0.875rem;
    }
    .breakdown-row .amount { font-weight: 600; color: #7c3aed; }
  `],
})
export class ManagerProfitComponent implements OnInit {
  private readonly orderService = inject(OrderService);

  totalRevenue = signal(0);
  breakdown = signal<{ status: string; label: string; count: number; total: number }[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.orderService.getOrders().subscribe({
      next: (res) => {
        const orders = res.data ?? [];
        this.totalRevenue.set(orders.reduce((s, o) => s + o.total, 0));

        const statusLabels: Record<string, string> = {
          pending: 'En attente', ready: 'Pretes', redeemed: 'Validees',
          cancelled: 'Annulees', rated: 'Notees',
        };
        const groups = new Map<string, { count: number; total: number }>();
        for (const o of orders) {
          const g = groups.get(o.status) ?? { count: 0, total: 0 };
          g.count++;
          g.total += o.total;
          groups.set(o.status, g);
        }
        this.breakdown.set(
          Array.from(groups.entries()).map(([status, data]) => ({
            status,
            label: statusLabels[status] ?? status,
            ...data,
          })),
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
