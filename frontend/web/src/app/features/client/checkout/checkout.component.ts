import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService, CheckoutOptions } from '../../../core/services/order.service';
import { CartStateService } from '../../../core/services/cart-state.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Cart, CartItem, Order, PaymentMethod } from '../../../core/models';
import {
  cartGrandTotal,
  cartTaxTotal,
  getPromoRate,
  promoDiscount,
  QR_EXPIRY_HOURS,
  storeById,
} from '../../../core/utils/cart.util';
import { loadClientAccount } from '../../../core/utils/format.util';

const STEPS = ['Récapitulatif', 'Coordonnées', 'Règlement', 'Confirmation'];

const METHODS: Array<{ id: PaymentMethod; label: string; description: string; icon: string }> = [
  { id: 'mobile_money', label: 'Mobile Money', description: 'MTN MoMo, Orange Money', icon: 'smartphone' },
  { id: 'card', label: 'Carte bancaire', description: 'Visa, Mastercard', icon: 'credit_card' },
  { id: 'transfer', label: 'Virement', description: 'Depuis votre banque', icon: 'account_balance_wallet' },
  { id: 'cash', label: 'Espèces au retrait', description: 'Réglé en boutique lors du scan', icon: 'payments' },
];

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CurrencyPipe, FormsModule, RouterLink, MatIconModule, MatSnackBarModule,
    LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (!(cart()?.items?.length) && !created().length) {
      <app-empty-state
        icon="qr_code_2"
        title="Rien à payer"
        message="Ajoutez des articles au panier pour lancer le paiement et générer vos codes QR de retrait."
      >
        <button type="button" class="btn-primary" routerLink="/client/feed">Retour au catalogue</button>
      </app-empty-state>
    } @else {
      <div class="checkout-page">
        <header>
          <h1>Paiement</h1>
          <div class="progress">
            @for (label of steps; track label; let i = $index) {
              <div class="progress-step">
                <div class="bar" [class.active]="i <= step()"></div>
                <p [class.active]="i <= step()">{{ label }}</p>
              </div>
            }
          </div>
        </header>

        @if (step() === 0) {
          <section class="card panel">
            <h2>Votre commande</h2>
            <p class="panel-desc">Un code QR sera généré par boutique</p>
            <ul class="order-groups">
              @for (group of storeGroups(); track group.storeId) {
                <li>
                  <p class="store-name">{{ group.storeName }}</p>
                  <p class="store-addr">{{ group.address }}, {{ group.city }}</p>
                  <ul class="lines">
                    @for (item of group.items; track item.productId) {
                      <li>
                        <span>{{ item.quantity }} × {{ item.product?.name }}</span>
                        <span>{{ lineTotal(item) | currency:'XOF':'symbol-narrow':'1.0-0' }}</span>
                      </li>
                    }
                  </ul>
                </li>
              }
            </ul>
            <dl class="totals">
              <div><dt>Sous-total</dt><dd>{{ cart()!.subtotal | currency:'XOF':'symbol-narrow':'1.0-0' }}</dd></div>
              <div><dt>Taxes</dt><dd>{{ taxTotal() | currency:'XOF':'symbol-narrow':'1.0-0' }}</dd></div>
              @if (discountTotal() > 0) {
                <div class="discount"><dt>Remise {{ cart()!.promoCode }}</dt><dd>−{{ discountTotal() | currency:'XOF':'symbol-narrow':'1.0-0' }}</dd></div>
              }
              <div class="grand"><dt>Total</dt><dd>{{ grandTotal() | currency:'XOF':'symbol-narrow':'1.0-0' }}</dd></div>
            </dl>
          </section>
        }

        @if (step() === 1) {
          <section class="card panel">
            <h2>Vos coordonnées</h2>
            <p class="panel-desc">Elles figureront sur le ticket et le code QR</p>
            <div class="form-grid">
              <div class="field">
                <label for="c-name">Nom complet <span>*</span></label>
                <input id="c-name" class="input-field" [(ngModel)]="name" />
                @if (errors.name) { <span class="error">{{ errors.name }}</span> }
              </div>
              <div class="field">
                <label for="c-phone">Téléphone <span>*</span></label>
                <input id="c-phone" class="input-field" [(ngModel)]="phone" placeholder="+237 6XX XXX XXX" />
                @if (errors.phone) { <span class="error">{{ errors.phone }}</span> }
              </div>
              <div class="field full">
                <label for="c-email">E-mail <span>*</span></label>
                <input id="c-email" type="email" class="input-field" [(ngModel)]="email" />
                @if (errors.email) { <span class="error">{{ errors.email }}</span> }
              </div>
            </div>
          </section>
        }

        @if (step() === 2) {
          <section class="card panel">
            <h2>Mode de règlement</h2>
            <div class="methods">
              @for (m of methods; track m.id) {
                <button type="button" class="method" [class.selected]="method() === m.id" (click)="method.set(m.id)">
                  <mat-icon>{{ m.icon }}</mat-icon>
                  <span>
                    <strong>{{ m.label }}</strong>
                    <small>{{ m.description }}</small>
                  </span>
                </button>
              }
            </div>
            <p class="pay-note">
              Montant à régler : <strong>{{ grandTotal() | currency:'XOF':'symbol-narrow':'1.0-0' }}</strong>
              · Le code QR reste valable {{ qrExpiryHours }} h après le paiement.
            </p>
          </section>
        }

        @if (step() === 3) {
          <section class="card panel confirm">
            <h2>Paiement confirmé</h2>
            <div class="success">
              <mat-icon>check_circle</mat-icon>
              <h3>{{ created().length }} code{{ created().length > 1 ? 's' : '' }} QR généré{{ created().length > 1 ? 's' : '' }}</h3>
              <p>
                Retrouvez-les dans « Mes codes ». Présentez chaque code au vendeur de la boutique concernée :
                il le scanne pour confirmer la remise, puis le code disparaît de sa file.
              </p>
              <ul class="created-list">
                @for (order of created(); track order.id) {
                  <li>
                    <a [routerLink]="['/client/codes', order.id]" class="ref">{{ order.reference }}</a>
                    <span class="store">{{ order.storeName }}</span>
                    <span class="amount">{{ order.total | currency:'XOF':'symbol-narrow':'1.0-0' }}</span>
                  </li>
                }
              </ul>
              <div class="confirm-actions">
                @if (created().length === 1) {
                  <a class="btn-primary" [routerLink]="['/client/codes', created()[0].id]">
                    <mat-icon>qr_code_2</mat-icon> Ouvrir mon code
                  </a>
                }
                <a class="btn-primary" routerLink="/client/codes" [class.btn-outline]="created().length === 1">
                  <mat-icon>qr_code_2</mat-icon> Voir mes codes QR
                </a>
              </div>
            </div>
          </section>
        }

        @if (step() < 3) {
          <div class="nav-footer">
            <button type="button" class="btn-ghost" (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
              {{ step() === 0 ? 'Retour au panier' : 'Étape précédente' }}
            </button>
            @if (step() < 2) {
              <button type="button" class="btn-primary" [disabled]="step() === 1 && !contactValid()" (click)="step.set(step() + 1)">
                Continuer <mat-icon>arrow_forward</mat-icon>
              </button>
            } @else {
              <button type="button" class="btn-primary" [disabled]="processing()" (click)="confirmPayment()">
                @if (processing()) { Traitement du paiement… } @else { Payer {{ grandTotal() | currency:'XOF':'symbol-narrow':'1.0-0' }} }
              </button>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .checkout-page { max-width: 48rem; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; padding-bottom: 24px; }
    h1 { margin: 0; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em; }
    .progress { display: flex; gap: 8px; margin-top: 16px; }
    .progress-step { flex: 1; }
    .bar { height: 6px; border-radius: 999px; background: rgb(var(--line)); }
    .bar.active { background: rgb(var(--accent)); }
    .progress-step p { margin: 6px 0 0; font-size: 12px; color: rgb(var(--muted)); }
    .progress-step p.active { color: rgb(var(--ink)); }
    .panel { padding: 16px; }
    .panel h2 { margin: 0; font-size: 1rem; font-weight: 600; }
    .panel-desc { margin: 4px 0 16px; font-size: 13px; color: rgb(var(--muted)); }
    .order-groups { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
    .order-groups > li { border: 1px solid rgb(var(--line)); border-radius: 8px; padding: 12px; }
    .store-name { margin: 0; font-size: 14px; font-weight: 600; }
    .store-addr { margin: 2px 0 8px; font-size: 12px; color: rgb(var(--muted)); }
    .lines { list-style: none; margin: 0; padding: 0; }
    .lines li { display: flex; justify-content: space-between; gap: 12px; font-size: 14px; padding: 2px 0; }
    .lines li span:first-child { color: rgb(var(--muted)); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .totals { margin: 16px 0 0; padding-top: 12px; border-top: 1px solid rgb(var(--line)); }
    .totals div { display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; }
    .totals dt { color: rgb(var(--muted)); }
    .totals .discount { color: #059669; }
    .totals .grand { font-size: 16px; font-weight: 600; margin-top: 4px; }
    .form-grid { display: grid; gap: 16px; }
    @media (min-width: 640px) { .form-grid { grid-template-columns: 1fr 1fr; } }
    .field.full { grid-column: 1 / -1; }
    .field label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; }
    .field label span { color: #dc2626; }
    .error { display: block; font-size: 12px; color: #dc2626; margin-top: 4px; }
    .methods { display: grid; gap: 12px; }
    @media (min-width: 640px) { .methods { grid-template-columns: 1fr 1fr; } }
    .method {
      display: flex; align-items: flex-start; gap: 12px; padding: 12px;
      border: 1px solid rgb(var(--line)); border-radius: 8px; background: rgb(var(--surface));
      cursor: pointer; text-align: left; transition: border-color 0.15s;
    }
    .method.selected { border-color: rgb(var(--accent)); background: rgba(var(--accent), 0.05); }
    .method mat-icon { color: rgb(var(--muted)); }
    .method.selected mat-icon { color: rgb(var(--accent)); }
    .method strong { display: block; font-size: 14px; }
    .method small { display: block; font-size: 12px; color: rgb(var(--muted)); margin-top: 2px; }
    .pay-note { margin: 16px 0 0; padding: 10px 12px; border-radius: 8px; background: rgb(var(--surface-2)); font-size: 12px; color: rgb(var(--muted)); }
    .confirm .success { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 16px 0; }
    .confirm mat-icon { font-size: 48px; width: 48px; height: 48px; color: rgb(var(--accent)); }
    .confirm h3 { margin: 12px 0 4px; font-size: 1.125rem; }
    .confirm p { margin: 0; max-width: 28rem; font-size: 14px; color: rgb(var(--muted)); line-height: 1.5; }
    .created-list { list-style: none; margin: 16px 0; padding: 0; width: 100%; }
    .created-list li {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 10px 12px; border: 1px solid rgb(var(--line)); border-radius: 8px; margin-bottom: 8px; font-size: 14px;
    }
    .ref { font-family: ui-monospace, monospace; font-weight: 600; text-decoration: none; color: rgb(var(--ink)); }
    .store { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: rgb(var(--muted)); }
    .amount { font-weight: 600; flex-shrink: 0; }
    .confirm-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
    .confirm-actions .btn-outline {
      background: transparent; border: 1px solid rgb(var(--line)); color: rgb(var(--ink));
    }
    .nav-footer { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .btn-ghost { display: inline-flex; align-items: center; gap: 6px; border: none; background: none; color: rgb(var(--muted)); cursor: pointer; font-size: 14px; }
    .btn-ghost:hover { color: rgb(var(--ink)); }
    .btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border: none; border-radius: 8px; background: rgb(var(--accent)); color: white; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class CheckoutComponent {
  private readonly orderService = inject(OrderService);
  private readonly cartState = inject(CartStateService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly steps = STEPS;
  readonly methods = METHODS;
  readonly qrExpiryHours = QR_EXPIRY_HOURS;

  cart = signal<Cart | null>(null);
  loading = signal(true);
  processing = signal(false);
  step = signal(0);
  created = signal<Order[]>([]);

  name = '';
  phone = '';
  email = '';
  method = signal<PaymentMethod>('mobile_money');

  constructor() {
    const account = loadClientAccount();
    this.name = account.name;
    this.phone = account.phone;
    this.email = account.email;

    this.orderService.getCart().subscribe({
      next: (c) => { this.cart.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  storeGroups = computed(() => {
    const c = this.cart();
    if (!c) return [];
    const map = new Map<string, { storeId: string; storeName: string; address: string; city: string; items: CartItem[]; subtotal: number }>();
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
  taxTotal = computed(() => cartTaxTotal(this.storeGroups()));
  discountTotal = computed(() => {
    const c = this.cart();
    if (!c) return 0;
    return promoDiscount(c.subtotal, this.promoRate());
  });
  grandTotal = computed(() => {
    const c = this.cart();
    if (!c) return 0;
    return cartGrandTotal(c.subtotal, this.taxTotal(), this.discountTotal());
  });

  get errors() {
    return {
      name: !this.name.trim() ? 'Nom requis' : undefined,
      phone: this.phone.trim().length < 8 ? 'Téléphone requis' : undefined,
      email: !this.email.includes('@') ? 'E-mail invalide' : undefined,
    };
  }

  lineTotal(item: CartItem): number {
    return (item.unitPrice ?? item.product?.price ?? 0) * item.quantity;
  }

  contactValid(): boolean {
    return !this.errors.name && !this.errors.phone && !this.errors.email;
  }

  goBack(): void {
    if (this.step() === 0) {
      this.router.navigate(['/client/cart']);
    } else {
      this.step.set(this.step() - 1);
    }
  }

  confirmPayment(): void {
    this.processing.set(true);
    const opts: CheckoutOptions = {
      customerName: this.name.trim(),
      customerPhone: this.phone.trim(),
      customerEmail: this.email.trim(),
      paymentMethod: this.method(),
    };
    setTimeout(() => {
      this.orderService.checkout(opts).subscribe({
        next: (orders) => {
          this.created.set(orders);
          this.cart.set(null);
          this.cartState.refresh();
          this.step.set(3);
          this.processing.set(false);
          this.snackBar.open(
            `${orders.length} code(s) QR généré(s)`,
            'OK',
            { duration: 3500 },
          );
        },
        error: () => {
          this.snackBar.open('Erreur lors du paiement', 'Fermer', { duration: 3000 });
          this.processing.set(false);
        },
      });
    }, 900);
  }
}
