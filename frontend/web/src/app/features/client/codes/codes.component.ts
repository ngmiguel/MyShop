import { Component, inject, OnInit, signal } from '@angular/core';
import { OrderService } from '../../../core/services/order.service';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { OrderCardComponent } from '../../../shared/components/order-card/order-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Order } from '../../../core/models';

@Component({
  selector: 'app-codes',
  standalone: true,
  imports: [PageHeaderComponent, OrderCardComponent, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <app-page-header title="Mes codes de retrait" subtitle="Presentez ces codes au vendeur" />

    @if (loading()) {
      <app-loading-spinner />
    } @else if (orders().length === 0) {
      <app-empty-state
        icon="qr_code_2"
        title="Aucun code actif"
        message="Vos codes de retrait apparaitront ici apres une commande."
      />
    } @else {
      <div class="codes-list">
        @for (order of orders(); track order.id) {
          <app-order-card [order]="order" />
        }
      </div>
    }
  `,
  styles: [`
    .codes-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
    }
  `],
})
export class CodesComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly session = inject(SessionService);
  private readonly auth = inject(AuthService);

  orders = signal<Order[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    const params: Record<string, string> = {};
    const user = this.auth.user();
    if (user) {
      params['userId'] = user.id;
    } else {
      params['sessionId'] = this.session.getSessionId();
    }

    this.orderService.getOrders(params).subscribe({
      next: (res) => {
        const active = (res.data ?? []).filter((o) => o.status === 'pending' || o.status === 'ready');
        this.orders.set(active);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
