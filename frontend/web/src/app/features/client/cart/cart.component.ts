import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { CartStateService } from '../../../core/services/cart-state.service';
import { CatalogImageService } from '../../../core/services/catalog-image.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Cart, CartItem } from '../../../core/models';
import {
  cartGrandTotal,
  cartTaxTotal,
  getPromoRate,
  promoDiscount,
  storeById,
} from '../../../core/utils/cart.util';

interface StoreGroup {
  storeId: string;
  storeName: string;
  address: string;
  city: string;
  items: CartItem[];
  subtotal: number;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CurrencyPipe, FormsModule, RouterLink, MatIconModule, MatSnackBarModule,
    EmptyStateComponent, LoadingSpinnerComponent,
  ],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (!cart()?.items?.length) {
      <app-empty-state
        icon="shopping_bag"
        title="Votre panier est vide"
        message="Parcourez le catalogue et ajoutez des articles : ils sont regroupés par boutique pour un retrait par point de vente."
      >
        <button type="button" class="btn-primary" routerLink="/client/feed">Découvrir le catalogue</button>
      </app-empty-state>
    } @else {
      <div class="cart-grid">
        <div class="cart-main">
          <div class="cart-head">
            <h1 class="page-title">Mon panier</h1>
            <button type="button" class="btn-ghost" (click)="clearAll()">
              <mat-icon>delete_outline</mat-icon> Vider
            </button>
          </div>
          <p class="subtitle">Un retrait par boutique : chaque groupe génère son propre code QR à présenter sur place.</p>

          @for (group of groups(); track group.storeId) {
            <div class="store-card card">
              <div class="store-card-head">
                <div>
                  <h2>{{ group.storeName }}</h2>
                  <span class="store-meta">{{ group.address }}, {{ group.city }}</span>
                </div>
                <button type="button" class="btn-ghost sm" (click)="clearStore(group.storeId)">Retirer ce groupe</button>
              </div>
              <ul class="items-list">
                @for (item of group.items; track item.productId) {
                  <li class="cart-line">
                    <img class="thumb" [src]="thumb(item)" [alt]="item.product?.name ?? ''" referrerpolicy="no-referrer" />
                    <div class="line-info">
                      <a [routerLink]="['/client/product', item.productId]" class="line-title">{{ item.product?.name ?? 'Produit' }}</a>
                      <p class="line-price">{{ lineUnit(item) | currency:'XOF':'symbol-narrow':'1.0-0' }}</p>
                      <div class="qty-row">
                        <div class="qty-stepper">
                          <button type="button" aria-label="Diminuer" (click)="updateQty(item, item.quantity - 1)"><mat-icon>remove</mat-icon></button>
                          <span>{{ item.quantity }}</span>
                          <button type="button" aria-label="Augmenter" (click)="updateQty(item, item.quantity + 1)"><mat-icon>add</mat-icon></button>
                        </div>
                        <button type="button" class="btn-remove" (click)="removeItem(item)">Supprimer</button>
                      </div>
                    </div>
                    <p class="line-total">{{ lineTotal(item) | currency:'XOF':'symbol-narrow':'1.0-0' }}</p>
                  </li>
                }
              </ul>
              <div class="group-subtotal">
                <span><mat-icon>storefront</mat-icon> Sous-total boutique</span>
                <span>{{ group.subtotal | currency:'XOF':'symbol-narrow':'1.0-0' }}</span>
              </div>
            </div>
          }
        </div>

        <aside class="summary-card card">
          <h2>Récapitulatif</h2>
          <dl class="summary-rows">
            <div><dt>Sous-total</dt><dd>{{ cart()!.subtotal | currency:'XOF':'symbol-narrow':'1.0-0' }}</dd></div>
            <div><dt>Taxes</dt><dd>{{ tax() | currency:'XOF':'symbol-narrow':'1.0-0' }}</dd></div>
            @if (promoRate() > 0) {
              <div class="discount">
                <dt>Remise {{ cart()!.promoCode }}</dt>
                <dd>−{{ discount() | currency:'XOF':'symbol-narrow':'1.0-0' }}</dd>
              </div>
            }
            <div class="total"><dt>Total</dt><dd>{{ grandTotal() | currency:'XOF':'symbol-narrow':'1.0-0' }}</dd></div>
          </dl>

          <div class="promo-block">
            <label for="promo">Code promo</label>
            <div class="promo-row">
              <input id="promo" class="input-field" [(ngModel)]="promoInput" placeholder="BIENVENUE10" />
              <button type="button" class="btn-outline" (click)="applyPromo()"><mat-icon>sell</mat-icon></button>
            </div>
            @if (promoRate() > 0) {
              <button type="button" class="btn-clear-promo" (click)="clearPromo()">Retirer le code</button>
            }
          </div>

          <button type="button" class="btn-primary full lg" routerLink="/client/checkout">Passer au paiement</button>
          <p class="qr-note">{{ groups().length }} code{{ groups().length > 1 ? 's' : '' }} QR sera généré après paiement</p>
        </aside>
      </div>
    }
  `,
  styles: [`
    .cart-grid { display: grid; gap: 24px; }
    @media (min-width: 1024px) { .cart-grid { grid-template-columns: 2fr 1fr; } }
    .page-title { margin: 0; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em; }
    .cart-head { display: flex; justify-content: space-between; align-items: center; }
    .subtitle { font-size: 14px; color: rgb(var(--muted)); margin: 8px 0 16px; }
    .store-card { padding: 16px; margin-bottom: 16px; }
    .store-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 12px; }
    .store-card h2 { margin: 0; font-size: 1rem; font-weight: 600; }
    .store-meta { font-size: 12px; color: rgb(var(--muted)); }
    .items-list { list-style: none; margin: 0; padding: 0; }
    .cart-line { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgb(var(--line)); align-items: flex-start; }
    .thumb { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; flex-shrink: 0; background: rgb(var(--surface-2)); }
    .line-info { flex: 1; min-width: 0; }
    .line-title { font-size: 14px; font-weight: 500; color: rgb(var(--ink)); text-decoration: none; }
    .line-title:hover { color: rgb(var(--accent)); }
    .line-price { margin: 4px 0; font-size: 14px; font-weight: 600; }
    .qty-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
    .qty-stepper { display: inline-flex; align-items: center; border: 1px solid rgb(var(--line)); border-radius: 8px; }
    .qty-stepper button { border: none; background: none; padding: 4px 8px; cursor: pointer; display: flex; color: rgb(var(--muted)); }
    .qty-stepper mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .qty-stepper span { padding: 0 8px; font-size: 14px; min-width: 32px; text-align: center; }
    .btn-remove { border: none; background: none; font-size: 12px; color: rgb(var(--muted)); cursor: pointer; }
    .btn-remove:hover { color: #f43f5e; }
    .line-total { flex-shrink: 0; font-size: 14px; font-weight: 600; margin: 0; }
    .group-subtotal {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 12px; padding-top: 12px; border-top: 1px solid rgb(var(--line));
      font-size: 14px; color: rgb(var(--muted));
    }
    .group-subtotal span:last-child { font-weight: 600; color: rgb(var(--ink)); }
    .group-subtotal mat-icon { font-size: 16px; width: 16px; height: 16px; vertical-align: middle; margin-right: 4px; }
    .summary-card { padding: 16px; height: fit-content; position: sticky; top: 96px; }
    .summary-card h2 { margin: 0 0 16px; font-size: 1rem; font-weight: 600; }
    .summary-rows div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .summary-rows dt { color: rgb(var(--muted)); }
    .summary-rows .discount { color: #059669; }
    .summary-rows .total { font-weight: 700; font-size: 16px; border-top: 1px solid rgb(var(--line)); margin-top: 8px; padding-top: 12px; }
    .promo-block label { font-size: 12px; font-weight: 600; }
    .promo-row { display: flex; gap: 8px; margin-top: 6px; }
    .promo-row .input-field { flex: 1; }
    .btn-clear-promo { margin-top: 4px; border: none; background: none; font-size: 12px; color: rgb(var(--muted)); cursor: pointer; }
    .btn-clear-promo:hover { color: #f43f5e; }
    .btn-primary.full { width: 100%; margin-top: 16px; }
    .btn-primary.lg { padding: 14px 20px; font-size: 15px; }
    .qr-note { margin: 8px 0 0; text-align: center; font-size: 12px; color: rgb(var(--muted)); }
    .btn-ghost { display: inline-flex; align-items: center; gap: 4px; border: none; background: none; color: rgb(var(--muted)); cursor: pointer; font-size: 14px; }
    .btn-ghost:hover { color: rgb(var(--ink)); }
    .btn-ghost.sm { font-size: 12px; }
    .btn-ghost mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .btn-outline { display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px; border: 1px solid rgb(var(--line)); border-radius: 8px; background: rgb(var(--surface)); cursor: pointer; }
  `],
})
export class CartComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly cartState = inject(CartStateService);
  private readonly images = inject(CatalogImageService);
  private readonly snackBar = inject(MatSnackBar);

  cart = signal<Cart | null>(null);
  loading = signal(true);
  promoInput = '';

  groups = computed((): StoreGroup[] => {
    const c = this.cart();
    if (!c) return [];
    const map = new Map<string, StoreGroup>();
    for (const item of c.items) {
      const storeId = item.product?.storeId ?? 'demo-store-1';
      const store = storeById(storeId);
      const g = map.get(storeId) ?? {
        storeId,
        storeName: store?.name ?? item.product?.storeName ?? 'Boutique',
        address: store?.address ?? 'Centre-ville',
        city: store?.city ?? 'Douala',
        items: [],
        subtotal: 0,
      };
      g.items.push(item);
      g.subtotal += this.lineTotal(item);
      map.set(storeId, g);
    }
    return [...map.values()];
  });

  promoRate = computed(() => getPromoRate(this.cart()?.promoCode));
  tax = computed(() => cartTaxTotal(this.groups()));
  discount = computed(() => {
    const c = this.cart();
    if (!c) return 0;
    return promoDiscount(c.subtotal, this.promoRate());
  });
  grandTotal = computed(() => {
    const c = this.cart();
    if (!c) return 0;
    return cartGrandTotal(c.subtotal, this.tax(), this.discount());
  });

  ngOnInit(): void {
    this.loadCart();
  }

  lineUnit(item: CartItem): number {
    return item.unitPrice ?? item.product?.price ?? 0;
  }

  lineTotal(item: CartItem): number {
    return this.lineUnit(item) * item.quantity;
  }

  thumb(item: CartItem): string {
    if (item.product) return this.images.productImageUrl(item.product);
    return this.images.productImageUrl({ id: item.productId, imageUrl: undefined, categoryId: undefined });
  }

  updateQty(item: CartItem, qty: number): void {
    this.orderService.updateCartItem(item.productId, qty).subscribe({
      next: (c) => { this.cart.set(c); this.cartState.refresh(); },
    });
  }

  removeItem(item: CartItem): void {
    this.orderService.removeFromCart(item.productId).subscribe({
      next: (c) => { this.cart.set(c); this.cartState.refresh(); },
    });
  }

  clearStore(storeId: string): void {
    this.orderService.clearStore(storeId).subscribe({
      next: (c) => { this.cart.set(c); this.cartState.refresh(); },
    });
  }

  clearAll(): void {
    this.orderService.clearCart().subscribe({
      next: () => {
        this.cart.set(null);
        this.cartState.refresh();
        this.snackBar.open('Panier vidé', 'OK', { duration: 2000 });
      },
    });
  }

  applyPromo(): void {
    if (!this.promoInput.trim()) return;
    this.orderService.applyPromo(this.promoInput.trim()).subscribe({
      next: (c) => {
        this.cart.set(c);
        this.snackBar.open('Code appliqué', 'OK', { duration: 2000 });
      },
      error: () => this.snackBar.open('Code invalide', 'Fermer', { duration: 3000 }),
    });
  }

  clearPromo(): void {
    this.orderService.clearPromo().subscribe({
      next: (c) => {
        this.cart.set(c);
        this.promoInput = '';
      },
    });
  }

  private loadCart(): void {
    this.orderService.getCart().subscribe({
      next: (c) => {
        this.cart.set(c);
        this.promoInput = c.promoCode ?? '';
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
