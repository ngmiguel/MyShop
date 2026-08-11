import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Cart, CartItem } from '../../../core/models';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CurrencyPipe, FormsModule, RouterLink, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule,
    PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    <app-page-header title="Mon panier" />

    @if (loading()) {
      <app-loading-spinner />
    } @else if (!cart() || cart()!.items.length === 0) {
      <app-empty-state icon="shopping_cart" title="Panier vide" message="Parcourez le catalogue et ajoutez des produits.">
        <a mat-flat-button color="primary" routerLink="/client/feed">Decouvrir</a>
      </app-empty-state>
    } @else {
      <div class="cart">
        @for (item of cart()!.items; track item.productId) {
          <div class="cart-item">
            <div class="item-info">
              <h3>{{ item.product?.name ?? 'Produit' }}</h3>
              <span class="price">{{ (item.unitPrice ?? item.product?.price ?? 0) | currency:'XOF':'symbol-narrow':'1.0-0' }}</span>
            </div>
            <div class="qty-controls">
              <button mat-icon-button (click)="updateQty(item, item.quantity - 1)" [disabled]="item.quantity <= 1">
                <mat-icon>remove</mat-icon>
              </button>
              <span>{{ item.quantity }}</span>
              <button mat-icon-button (click)="updateQty(item, item.quantity + 1)">
                <mat-icon>add</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="removeItem(item)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        }

        <div class="promo-section">
          <mat-form-field appearance="outline" class="promo-field">
            <mat-label>Code promo</mat-label>
            <input matInput [(ngModel)]="promoCode" />
          </mat-form-field>
          <button mat-stroked-button (click)="applyPromo()">Appliquer</button>
        </div>

        <div class="summary">
          <div class="row"><span>Sous-total</span><span>{{ cart()!.subtotal | currency:'XOF':'symbol-narrow':'1.0-0' }}</span></div>
          @if (cart()!.discount > 0) {
            <div class="row discount"><span>Reduction</span><span>-{{ cart()!.discount | currency:'XOF':'symbol-narrow':'1.0-0' }}</span></div>
          }
          <div class="row total"><span>Total</span><span>{{ cart()!.total | currency:'XOF':'symbol-narrow':'1.0-0' }}</span></div>
        </div>

        <button mat-flat-button color="primary" class="checkout-btn" routerLink="/client/checkout">
          Passer commande
        </button>
      </div>
    }
  `,
  styles: [`
    .cart { padding: 16px; }
    .cart-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-bottom: 10px;
    }
    .item-info h3 { margin: 0 0 4px; font-size: 0.875rem; }
    .price { font-weight: 600; color: var(--primary); font-size: 0.875rem; }
    .qty-controls { display: flex; align-items: center; gap: 2px; }
    .promo-section { display: flex; gap: 8px; margin: 16px 0; align-items: flex-start; }
    .promo-field { flex: 1; }
    .summary {
      background: var(--surface-alt);
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 16px;
    }
    .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 0.875rem; }
    .row.total { font-weight: 700; font-size: 1rem; padding-top: 8px; border-top: 1px solid var(--border); margin-top: 4px; }
    .row.discount { color: var(--success); }
    .checkout-btn { width: 100%; height: 48px; }
  `],
})
export class CartComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly snackBar = inject(MatSnackBar);

  cart = signal<Cart | null>(null);
  loading = signal(true);
  promoCode = '';

  ngOnInit(): void {
    this.loadCart();
  }

  updateQty(item: CartItem, qty: number): void {
    this.orderService.updateCartItem(item.productId, qty).subscribe({
      next: (c) => this.cart.set(c),
    });
  }

  removeItem(item: CartItem): void {
    this.orderService.removeFromCart(item.productId).subscribe({
      next: (c) => this.cart.set(c),
    });
  }

  applyPromo(): void {
    if (!this.promoCode.trim()) return;
    this.orderService.applyPromo(this.promoCode.trim()).subscribe({
      next: (c) => {
        this.cart.set(c);
        this.snackBar.open('Code promo applique', 'OK', { duration: 2000 });
      },
      error: () => this.snackBar.open('Code promo invalide', 'Fermer', { duration: 3000 }),
    });
  }

  private loadCart(): void {
    this.orderService.getCart().subscribe({
      next: (c) => { this.cart.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
