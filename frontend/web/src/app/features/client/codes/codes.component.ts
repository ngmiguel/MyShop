import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';
import { QrTicketComponent } from '../../../shared/components/qr-ticket/qr-ticket.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SegmentedTabsComponent } from '../../../shared/components/segmented-tabs/segmented-tabs.component';
import { Order } from '../../../core/models';
import { formatDate } from '../../../core/utils/format.util';

type TabId = 'active' | 'done' | 'tickets';

@Component({
  selector: 'app-codes',
  standalone: true,
  imports: [
    CurrencyPipe, FormsModule, RouterLink, MatIconModule, MatSnackBarModule,
    QrTicketComponent, LoadingSpinnerComponent, EmptyStateComponent, SegmentedTabsComponent,
  ],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>Mes codes & tickets</h1>
          <p>Vos codes QR de retrait, leur validité et l'historique de vos tickets de caisse.</p>
        </div>
        <div class="head-actions">
          <app-segmented-tabs [items]="tabItems()" [value]="tab()" (valueChange)="onTabChange($event)" />
          <button type="button" class="btn-outline" (click)="exportTickets()">
            <mat-icon>download</mat-icon> Exporter
          </button>
        </div>
      </header>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (tab() === 'active') {
        @if (active().length) {
          <div class="active-grid">
            @for (order of active(); track order.id) {
              <app-qr-ticket [order]="order" />
            }
          </div>
        } @else {
          <app-empty-state
            icon="qr_code_2"
            title="Aucun code QR actif"
            message="Après un paiement, votre code apparaît ici avec son compte à rebours jusqu'à expiration."
          >
            <button type="button" class="btn-primary" routerLink="/client/feed">Parcourir le catalogue</button>
          </app-empty-state>
        }
      } @else if (tab() === 'done') {
        @if (done().length) {
          <div class="history-list">
            @for (order of done(); track order.id) {
              <article class="history-card card">
                <div class="history-row">
                  <div>
                    <p class="ref">{{ order.reference ?? order.pickupCode }}</p>
                    <p class="meta">{{ order.storeName }} · {{ formatDate(order.createdAt, true) }}</p>
                  </div>
                  <div class="history-actions">
                    <span class="amount">{{ order.total | currency:'XOF':'symbol-narrow':'1.0-0' }}</span>
                    @if (order.status === 'redeemed' && !order.sellerRating) {
                      <button type="button" class="btn-outline sm" (click)="openRating(order)">
                        <mat-icon>star</mat-icon> Noter le vendeur
                      </button>
                    }
                    @if (order.sellerRating) {
                      <div class="stars">
                        @for (s of [1,2,3,4,5]; track s) {
                          <mat-icon [class.filled]="s <= order.sellerRating!">star</mat-icon>
                        }
                      </div>
                    }
                    @if (order.status === 'expired') {
                      <span class="expired-label">Expiré</span>
                    }
                  </div>
                </div>
              </article>
            }
          </div>
        } @else {
          <app-empty-state
            icon="qr_code_2"
            title="Pas encore d'historique"
            message="Vos codes retirés ou expirés seront listés ici."
          />
        }
      } @else {
        @if (allOrders().length) {
          <div class="tickets-list">
            @for (order of allOrders(); track order.id) {
              <article class="ticket-card card">
                <div class="ticket-head">
                  <h2>Ticket {{ order.reference ?? order.pickupCode }}</h2>
                  <p>{{ order.storeName }} · {{ formatDate(order.createdAt, true) }}</p>
                </div>
                <ul class="ticket-lines">
                  @for (item of order.items; track item.productId) {
                    <li>
                      <span>{{ item.quantity }} × {{ item.product?.name ?? 'Article' }}</span>
                      <span>{{ lineTotal(item) | currency:'XOF':'symbol-narrow':'1.0-0' }}</span>
                    </li>
                  }
                </ul>
                <dl class="ticket-totals">
                  <div><dt>Taxes</dt><dd>{{ (order.tax ?? 0) | currency:'XOF':'symbol-narrow':'1.0-0' }}</dd></div>
                  @if ((order.discount ?? 0) > 0) {
                    <div class="discount"><dt>Remise</dt><dd>−{{ order.discount | currency:'XOF':'symbol-narrow':'1.0-0' }}</dd></div>
                  }
                  <div class="grand"><dt>Total payé</dt><dd>{{ order.total | currency:'XOF':'symbol-narrow':'1.0-0' }}</dd></div>
                </dl>
              </article>
            }
          </div>
        } @else {
          <app-empty-state
            icon="receipt_long"
            title="Aucun ticket"
            message="Vos tickets de caisse apparaîtront ici après chaque paiement."
          />
        }
      }
    </div>

    @if (ratingOrder()) {
      <div class="modal-backdrop" (click)="closeRating()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Noter le vendeur</h3>
          <p class="modal-desc">Commande {{ ratingOrder()!.reference }} · {{ ratingOrder()!.storeName }}</p>
          <p class="label">Votre note</p>
          <div class="stars editable">
            @for (s of [1,2,3,4,5]; track s) {
              <button type="button" (click)="ratingScore.set(s)">
                <mat-icon [class.filled]="s <= ratingScore()">star</mat-icon>
              </button>
            }
          </div>
          <label for="comment">Commentaire (facultatif)</label>
          <textarea id="comment" [(ngModel)]="ratingComment" rows="3" placeholder="Accueil, rapidité du retrait, conseil…"></textarea>
          <div class="modal-actions">
            <button type="button" class="btn-ghost" (click)="closeRating()">Annuler</button>
            <button type="button" class="btn-primary" (click)="submitRating()">Envoyer</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 20px; padding-bottom: 24px; }
    .page-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 12px; }
    h1 { margin: 0; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em; }
    .page-head > div > p { margin: 4px 0 0; font-size: 14px; color: rgb(var(--muted)); }
    .head-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .btn-outline {
      display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px;
      border: 1px solid rgb(var(--line)); border-radius: 8px; background: rgb(var(--surface));
      font-size: 13px; font-weight: 500; cursor: pointer;
    }
    .btn-outline.sm { font-size: 12px; padding: 4px 10px; }
    .btn-outline mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .active-grid { display: grid; gap: 16px; }
    @media (min-width: 768px) { .active-grid { grid-template-columns: 1fr 1fr; } }
    .history-list, .tickets-list { display: flex; flex-direction: column; gap: 12px; }
    .history-card, .ticket-card { padding: 16px; }
    .history-row { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; align-items: center; }
    .ref { margin: 0; font-family: ui-monospace, monospace; font-size: 14px; font-weight: 600; }
    .meta { margin: 4px 0 0; font-size: 12px; color: rgb(var(--muted)); }
    .history-actions { display: flex; align-items: center; gap: 12px; }
    .amount { font-size: 14px; font-weight: 600; }
    .expired-label { font-size: 12px; color: #f43f5e; }
    .stars { display: flex; }
    .stars mat-icon { font-size: 16px; width: 16px; height: 16px; color: #d1d5db; }
    .stars mat-icon.filled { color: #fbbf24; }
    .ticket-head h2 { margin: 0; font-size: 1rem; font-weight: 600; }
    .ticket-head p { margin: 4px 0 0; font-size: 12px; color: rgb(var(--muted)); }
    .ticket-lines { list-style: none; margin: 12px 0 0; padding: 0; }
    .ticket-lines li { display: flex; justify-content: space-between; gap: 12px; font-size: 14px; padding: 2px 0; }
    .ticket-lines li span:first-child { color: rgb(var(--muted)); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ticket-totals { margin: 12px 0 0; padding-top: 8px; border-top: 1px solid rgb(var(--line)); }
    .ticket-totals div { display: flex; justify-content: space-between; font-size: 14px; padding: 2px 0; }
    .ticket-totals dt { color: rgb(var(--muted)); }
    .ticket-totals .discount { color: #059669; }
    .ticket-totals .grand { font-weight: 600; margin-top: 4px; }
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15,23,42,0.45);
      display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px;
    }
    .modal {
      background: rgb(var(--surface)); border-radius: 12px; padding: 20px;
      max-width: 400px; width: 100%; border: 1px solid rgb(var(--line));
    }
    .modal h3 { margin: 0; font-size: 1rem; }
    .modal-desc { margin: 6px 0 16px; font-size: 13px; color: rgb(var(--muted)); }
    .label { margin: 0 0 8px; font-size: 14px; }
    .stars.editable button { border: none; background: none; padding: 0; cursor: pointer; }
    .stars.editable mat-icon { font-size: 28px; width: 28px; height: 28px; }
    textarea {
      width: 100%; margin-top: 6px; padding: 10px; border-radius: 8px;
      border: 1px solid rgb(var(--line)); font-family: inherit; font-size: 14px; box-sizing: border-box;
    }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
    .btn-ghost { border: none; background: none; color: rgb(var(--muted)); cursor: pointer; padding: 8px 12px; }
    .btn-primary { border: none; background: rgb(var(--accent)); color: white; border-radius: 8px; padding: 8px 16px; font-weight: 600; cursor: pointer; }
  `],
})
export class CodesComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly session = inject(SessionService);
  private readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  readonly formatDate = formatDate;

  allOrders = signal<Order[]>([]);
  loading = signal(true);
  tab = signal<TabId>('active');
  ratingOrder = signal<Order | null>(null);
  ratingScore = signal(5);
  ratingComment = '';

  active = computed(() => this.allOrders().filter((o) => o.status === 'pending'));
  done = computed(() => this.allOrders().filter((o) => o.status !== 'pending'));

  tabItems = computed(() => [
    { id: 'active', label: `Actifs (${this.active().length})` },
    { id: 'done', label: `Historique (${this.done().length})` },
    { id: 'tickets', label: 'Tickets' },
  ]);

  ngOnInit(): void {
    this.load();
  }

  onTabChange(id: string): void {
    this.tab.set(id as TabId);
  }

  lineTotal(item: { unitPrice?: number; product?: { price?: number }; quantity: number }): number {
    return (item.unitPrice ?? item.product?.price ?? 0) * item.quantity;
  }

  exportTickets(): void {
    const blob = new Blob([JSON.stringify(this.allOrders(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tickets-boutika.json';
    a.click();
    URL.revokeObjectURL(url);
    this.snackBar.open('Tickets exportés', 'OK', { duration: 2000 });
  }

  openRating(order: Order): void {
    this.ratingOrder.set(order);
    this.ratingScore.set(5);
    this.ratingComment = '';
  }

  closeRating(): void {
    this.ratingOrder.set(null);
  }

  submitRating(): void {
    const order = this.ratingOrder();
    if (!order) return;
    this.orderService.rateOrder(order.id, this.ratingScore(), this.ratingComment.trim() || undefined).subscribe({
      next: () => {
        this.snackBar.open('Merci pour votre note', 'OK', { duration: 2000 });
        this.closeRating();
        this.load();
      },
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 }),
    });
  }

  private load(): void {
    this.loading.set(true);
    const params: Record<string, string> = {};
    const user = this.auth.user();
    if (user) params['userId'] = user.id;
    else params['sessionId'] = this.session.getSessionId();

    this.orderService.getOrders(params).subscribe({
      next: (res) => {
        this.allOrders.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
