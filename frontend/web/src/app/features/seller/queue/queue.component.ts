import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { OrderCardComponent } from '../../../shared/components/order-card/order-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Order } from '../../../core/models';

@Component({
  selector: 'app-queue',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatSnackBarModule,
    PageHeaderComponent, OrderCardComponent, LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    <app-page-header title="File d'attente" subtitle="Commandes en attente de retrait">
      <button mat-icon-button (click)="refresh()"><mat-icon>refresh</mat-icon></button>
    </app-page-header>

    @if (loading()) {
      <app-loading-spinner />
    } @else if (orders().length === 0) {
      <app-empty-state icon="list_alt" title="File vide" message="Aucune commande en attente pour le moment." />
    } @else {
      <div class="queue-list">
        @for (order of orders(); track order.id) {
          <div class="queue-item">
            <app-order-card [order]="order" />
            <button mat-flat-button class="redeem-btn" (click)="redeem(order)">
              <mat-icon>check</mat-icon> Valider
            </button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .queue-list { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .queue-item { display: flex; flex-direction: column; gap: 8px; }
    .redeem-btn { background: #059669 !important; }
  `],
})
export class QueueComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  orders = signal<Order[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    const user = this.auth.user();
    this.orderService.getOrders({
      status: 'pending',
      storeId: user?.storeId,
    }).subscribe({
      next: (res) => {
        this.orders.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  redeem(order: Order): void {
    this.orderService.redeemOrder(order.id).subscribe({
      next: () => {
        this.snackBar.open('Commande validee', 'OK', { duration: 2000 });
        this.refresh();
      },
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 }),
    });
  }
}
