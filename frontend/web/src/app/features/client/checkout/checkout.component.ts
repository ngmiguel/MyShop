import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Cart } from '../../../core/models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CurrencyPipe, MatButtonModule, MatIconModule, MatSnackBarModule,
    PageHeaderComponent, LoadingSpinnerComponent,
  ],
  template: `
    <app-page-header title="Commande" [showBack]="true" backLink="/client/cart" />

    @if (loading()) {
      <app-loading-spinner />
    } @else if (cart()) {
      <div class="checkout">
        <div class="info-card">
          <mat-icon>store</mat-icon>
          <div>
            <h3>Retrait en boutique</h3>
            <p>Votre commande sera scindee par magasin. Un code de retrait vous sera attribue pour chaque commande.</p>
          </div>
        </div>

        <div class="summary">
          <h3>Recapitulatif</h3>
          <div class="row"><span>{{ cart()!.items.length }} article(s)</span></div>
          <div class="row"><span>Sous-total</span><span>{{ cart()!.subtotal | currency:'XOF':'symbol-narrow':'1.0-0' }}</span></div>
          @if (cart()!.discount > 0) {
            <div class="row discount"><span>Reduction</span><span>-{{ cart()!.discount | currency:'XOF':'symbol-narrow':'1.0-0' }}</span></div>
          }
          <div class="row total"><span>Total</span><span>{{ cart()!.total | currency:'XOF':'symbol-narrow':'1.0-0' }}</span></div>
        </div>

        <button mat-flat-button color="primary" class="confirm-btn" [disabled]="submitting()" (click)="confirm()">
          <mat-icon>check_circle</mat-icon>
          Confirmer la commande
        </button>
      </div>
    }
  `,
  styles: [`
    .checkout { padding: 16px; }
    .info-card {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 16px;
    }
    .info-card mat-icon { color: var(--primary); }
    .info-card h3 { margin: 0 0 4px; font-size: 0.9375rem; }
    .info-card p { margin: 0; font-size: 0.8125rem; color: var(--text-muted); }
    .summary {
      background: var(--surface-alt);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .summary h3 { margin: 0 0 12px; font-size: 1rem; }
    .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 0.875rem; }
    .row.total { font-weight: 700; font-size: 1.125rem; padding-top: 8px; border-top: 1px solid var(--border); margin-top: 4px; }
    .row.discount { color: var(--success); }
    .confirm-btn { width: 100%; height: 52px; font-size: 1rem; }
  `],
})
export class CheckoutComponent {
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  cart = signal<Cart | null>(null);
  loading = signal(true);
  submitting = signal(false);

  constructor() {
    this.orderService.getCart().subscribe({
      next: (c) => { this.cart.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  confirm(): void {
    this.submitting.set(true);
    this.orderService.checkout().subscribe({
      next: () => {
        this.snackBar.open('Commande passee avec succes', 'Voir codes', { duration: 4000 });
        this.router.navigate(['/client/codes']);
      },
      error: () => {
        this.snackBar.open('Erreur lors de la commande', 'Fermer', { duration: 3000 });
        this.submitting.set(false);
      },
    });
  }
}
