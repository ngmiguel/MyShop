import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { SellerDataService } from '../../../core/services/seller-data.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Order } from '../../../core/models';
import { formatMoney, relativeTime } from '../../../core/utils/format.util';

@Component({
  selector: 'app-seller-home',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    MatSnackBarModule,
    EmptyStateComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="page">
      <section class="hero card">
        <div class="hero-text">
          <p class="eyebrow">Accueil vendeur</p>
          <h1>Bonjour {{ greetingName() }}</h1>
          <p class="lead">
            <mat-icon>waving_hand</mat-icon>
            Prêt à encaisser vos clients · {{ sellerData.storeName() }}
          </p>
          <p class="pending-line">
            <strong>{{ sellerData.pendingCount() }}</strong>
            commande(s) en attente d'encaissement
            · {{ formatMoney(sellerData.pendingTotal()) }}
          </p>
        </div>
        <div class="hero-stats">
          <div class="mini">
            <span>Retraits aujourd'hui</span>
            <strong>{{ sellerData.redeemedToday() }}</strong>
          </div>
        </div>
      </section>

      <div class="shortcuts">
        <a routerLink="/seller/scanner" class="shortcut card">
          <span class="icon-wrap"><mat-icon>qr_code_scanner</mat-icon></span>
          <div>
            <h2>Scanner un code</h2>
            <p>Valider un paiement client</p>
          </div>
          <mat-icon class="chevron">chevron_right</mat-icon>
        </a>
        <a routerLink="/seller/queue" class="shortcut card">
          <span class="icon-wrap amber"><mat-icon>pending_actions</mat-icon></span>
          <div>
            <h2>File d'attente</h2>
            <p>{{ sellerData.pendingCount() }} code(s) à encaisser</p>
          </div>
          <mat-icon class="chevron">chevron_right</mat-icon>
        </a>
        <a routerLink="/seller/performance" class="shortcut card">
          <span class="icon-wrap"><mat-icon>bar_chart</mat-icon></span>
          <div>
            <h2>Ma performance</h2>
            <p>KPIs et activité du jour</p>
          </div>
          <mat-icon class="chevron">chevron_right</mat-icon>
        </a>
        <a routerLink="/seller/stock" class="shortcut card">
          <span class="icon-wrap"><mat-icon>inventory_2</mat-icon></span>
          <div>
            <h2>Stock &amp; caisse</h2>
            <p>Ruptures et encaissement</p>
          </div>
          <mat-icon class="chevron">chevron_right</mat-icon>
        </a>
      </div>

      <header class="section-head">
        <div>
          <h2>Derniers codes en attente</h2>
          <p>Les plus anciens en tête · confirmation en un clic</p>
        </div>
        <a routerLink="/seller/queue" class="btn-outline">Voir la file</a>
      </header>

      @if (sellerData.loading() && !recentPending().length) {
        <app-loading-spinner />
      } @else if (!recentPending().length) {
        <app-empty-state
          icon="qr_code_2"
          title="Aucun code à encaisser"
          message="Les codes générés par les clients de votre boutique apparaîtront ici."
        />
      } @else {
        <ul class="pending-list">
          @for (order of recentPending(); track order.id) {
            <li class="card row">
              <div class="row-main">
                <mat-icon>qr_code_2</mat-icon>
                <div>
                  <p class="ref">{{ order.reference ?? order.pickupCode }}</p>
                  <p class="meta">
                    {{ order.customerName || 'Client' }}
                    · {{ formatMoney(order.total) }}
                    · {{ relativeTime(order.createdAt) }}
                  </p>
                </div>
              </div>
              <button type="button" class="btn-primary sm" (click)="redeem(order)">
                <mat-icon>check_circle</mat-icon>
                Confirmer
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 20px; }

    .hero {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      padding: 24px;
      background:
        linear-gradient(135deg, rgb(30 41 59) 0%, rgb(15 23 42) 60%, rgb(217 119 6 / 0.28) 100%);
      border: none;
      color: #f8fafc;
    }
    .eyebrow {
      margin: 0 0 6px;
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #fcd34d;
      font-weight: 700;
    }
    h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .lead {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0 0;
      color: #fde68a;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .lead mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .pending-line {
      margin: 12px 0 0;
      color: rgb(226 232 240);
      font-size: 0.875rem;
    }
    .pending-line strong { color: #fff; font-size: 1rem; }
    .hero-stats { align-self: flex-end; }
    .mini {
      padding: 12px 16px;
      border-radius: 12px;
      background: rgb(255 255 255 / 0.08);
      border: 1px solid rgb(255 255 255 / 0.12);
      min-width: 140px;
    }
    .mini span {
      display: block;
      font-size: 11px;
      color: #cbd5e1;
      margin-bottom: 4px;
    }
    .mini strong { font-size: 1.25rem; color: #fff; }

    .shortcuts {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .shortcut {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px;
      text-decoration: none;
      color: inherit;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .shortcut:hover {
      border-color: rgb(var(--seller-accent) / 0.45);
      box-shadow: 0 4px 14px rgb(15 23 42 / 0.06);
    }
    .shortcut h2 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
    }
    .shortcut p {
      margin: 2px 0 0;
      font-size: 0.8rem;
      color: rgb(var(--muted));
    }
    .icon-wrap {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      background: rgb(var(--surface-2));
      color: rgb(var(--ink));
      flex-shrink: 0;
    }
    .icon-wrap.amber {
      background: rgb(var(--seller-accent) / 0.12);
      color: rgb(var(--seller-accent));
    }
    .chevron { margin-left: auto; color: rgb(var(--muted)); }

    .section-head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 12px;
    }
    .section-head h2 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 800;
    }
    .section-head p {
      margin: 4px 0 0;
      font-size: 0.8rem;
      color: rgb(var(--muted));
    }

    .pending-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 16px;
    }
    .row-main {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }
    .row-main > mat-icon { color: rgb(var(--muted)); }
    .ref {
      margin: 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-weight: 700;
      font-size: 0.9rem;
    }
    .meta {
      margin: 2px 0 0;
      font-size: 0.8rem;
      color: rgb(var(--muted));
    }
    .btn-primary.sm {
      padding: 8px 12px;
      font-size: 0.8125rem;
      white-space: nowrap;
    }
    .btn-primary.sm mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    @media (max-width: 720px) {
      .hero { flex-direction: column; }
      .hero-stats { align-self: stretch; }
      .shortcuts { grid-template-columns: 1fr; }
      .row { flex-direction: column; align-items: stretch; }
    }
  `],
})
export class SellerHomeComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly sellerData = inject(SellerDataService);
  private readonly orderService = inject(OrderService);
  private readonly snack = inject(MatSnackBar);

  readonly formatMoney = formatMoney;
  readonly relativeTime = relativeTime;

  readonly greetingName = computed(() => {
    const user = this.auth.user();
    const seller = this.sellerData.seller();
    if (seller) return `${seller.firstName} ${seller.lastName}`.trim();
    if (user) {
      const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
      return name || user.email.split('@')[0] || 'Vendeur';
    }
    return 'Vendeur';
  });

  readonly recentPending = computed(() => this.sellerData.pendingOrders().slice(0, 5));

  ngOnInit(): void {
    this.sellerData.refreshOrders().subscribe();
  }

  redeem(order: Order): void {
    this.orderService.redeemOrder(order.id).subscribe({
      next: () => {
        this.snack.open(`Retrait confirmé · ${order.reference ?? order.pickupCode}`, 'OK', {
          duration: 2500,
        });
        this.sellerData.refreshOrders().subscribe();
      },
      error: () => {
        this.snack.open('Impossible de confirmer ce retrait', 'Fermer', { duration: 3000 });
      },
    });
  }
}
