import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { SessionService } from '../../../core/services/session.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Order } from '../../../core/models';
import { formatDate } from '../../../core/utils/format.util';

@Component({
  selector: 'app-client-tickets',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    RouterLink,
    MatIconModule,
    MatSnackBarModule,
    EmptyStateComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <div class="title-row">
            <h1>Tickets de caisse</h1>
            <span class="sync" [class.on]="!!auth.user()">
              <mat-icon>{{ auth.user() ? 'cloud_done' : 'cloud_off' }}</mat-icon>
              {{ auth.user() ? 'Sync' : 'Local' }}
            </span>
          </div>
          <p>{{ tickets().length }} reçu{{ tickets().length > 1 ? 's' : '' }} conservé{{ tickets().length > 1 ? 's' : '' }}</p>
        </div>
        <div class="head-actions">
          @if (!auth.user()) {
            <a routerLink="/client/account" class="btn-outline">
              <mat-icon>mail</mat-icon> Synchroniser
            </a>
          }
          <button type="button" class="btn-outline" (click)="exportJson()">
            <mat-icon>download</mat-icon> Exporter
          </button>
        </div>
      </header>

      <div class="stat-grid">
        <div class="stat card">
          <span>Total dépensé</span>
          <strong>{{ totalSpent() | currency:'XOF':'symbol-narrow':'1.0-0' }}</strong>
        </div>
        <div class="stat card">
          <span>Économies</span>
          <strong class="saving">{{ totalSaved() | currency:'XOF':'symbol-narrow':'1.0-0' }}</strong>
        </div>
      </div>

      <div class="search-wrap">
        <mat-icon>search</mat-icon>
        <input
          [(ngModel)]="query"
          (ngModelChange)="querySig.set($event)"
          placeholder="Rechercher une référence, boutique ou article…"
          aria-label="Rechercher un ticket"
        />
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (!filtered().length) {
        <app-empty-state
          icon="receipt_long"
          title="Aucun ticket"
          message="Vos tickets de caisse apparaissent ici après chaque paiement confirmé."
        >
          <a routerLink="/client/feed" class="btn-primary">Parcourir le catalogue</a>
        </app-empty-state>
      } @else {
        <div class="list">
          @for (order of filtered(); track order.id) {
            <article class="card ticket">
              <button type="button" class="ticket-head" (click)="toggle(order.id)">
                <div>
                  <p class="ref">Ticket {{ order.reference ?? order.pickupCode }}</p>
                  <p class="meta">{{ order.storeName }} · {{ formatDate(order.createdAt, true) }}</p>
                </div>
                <div class="head-right">
                  <strong>{{ order.total | currency:'XOF':'symbol-narrow':'1.0-0' }}</strong>
                  <mat-icon>{{ expanded() === order.id ? 'expand_less' : 'expand_more' }}</mat-icon>
                </div>
              </button>
              @if (expanded() === order.id) {
                <div class="ticket-body">
                  <ul>
                    @for (item of order.items; track item.productId) {
                      <li>
                        <span>{{ item.quantity }} × {{ item.product?.name ?? 'Article' }}</span>
                        <span>{{ lineTotal(item) | currency:'XOF':'symbol-narrow':'1.0-0' }}</span>
                      </li>
                    }
                  </ul>
                  <dl>
                    <div><dt>Taxes</dt><dd>{{ (order.tax ?? 0) | currency:'XOF':'symbol-narrow':'1.0-0' }}</dd></div>
                    @if (order.discount > 0) {
                      <div class="discount">
                        <dt>Remise</dt>
                        <dd>−{{ order.discount | currency:'XOF':'symbol-narrow':'1.0-0' }}</dd>
                      </div>
                    }
                    <div class="grand"><dt>Total payé</dt><dd>{{ order.total | currency:'XOF':'symbol-narrow':'1.0-0' }}</dd></div>
                  </dl>
                  <div class="ticket-actions">
                    <button type="button" class="btn-outline sm" (click)="copyEmail(order)">
                      <mat-icon>mail</mat-icon> E-mail
                    </button>
                    <button type="button" class="btn-outline sm" (click)="printTicket(order)">
                      <mat-icon>print</mat-icon> Imprimer / PDF
                    </button>
                    <a class="btn-outline sm" [routerLink]="['/client/codes', order.id]">
                      <mat-icon>qr_code_2</mat-icon> Voir le code
                    </a>
                  </div>
                </div>
              }
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 16px; max-width: 48rem; margin: 0 auto; }
    .page-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; }
    .title-row { display: flex; align-items: center; gap: 10px; }
    h1 { margin: 0; font-size: 1.45rem; font-weight: 700; }
    .page-head p { margin: 4px 0 0; color: rgb(var(--muted)); font-size: 0.9rem; }
    .sync {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700;
      background: rgb(var(--surface-2)); color: rgb(var(--muted));
    }
    .sync.on { background: rgba(5,150,105,0.12); color: #047857; }
    .sync mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .head-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .stat { padding: 16px; }
    .stat span { display: block; font-size: 12px; color: rgb(var(--muted)); margin-bottom: 4px; }
    .stat strong { font-size: 1.15rem; }
    .stat .saving { color: #059669; }
    .search-wrap {
      display: flex; align-items: center; gap: 8px; padding: 10px 14px;
      border: 1px solid rgb(var(--line)); border-radius: 12px; background: rgb(var(--surface));
    }
    .search-wrap mat-icon { color: rgb(var(--muted)); }
    .search-wrap input {
      flex: 1; border: none; outline: none; background: transparent; font: inherit;
    }
    .list { display: flex; flex-direction: column; gap: 10px; }
    .ticket { overflow: hidden; padding: 0; }
    .ticket-head {
      width: 100%; display: flex; justify-content: space-between; gap: 12px;
      padding: 14px 16px; border: none; background: transparent; cursor: pointer; text-align: left;
    }
    .ref { margin: 0; font-family: ui-monospace, monospace; font-weight: 700; font-size: 0.9rem; }
    .meta { margin: 4px 0 0; font-size: 0.8rem; color: rgb(var(--muted)); }
    .head-right { display: flex; align-items: center; gap: 6px; }
    .ticket-body { padding: 0 16px 16px; border-top: 1px solid rgb(var(--line)); }
    .ticket-body ul { list-style: none; margin: 12px 0; padding: 0; }
    .ticket-body li {
      display: flex; justify-content: space-between; gap: 12px;
      padding: 4px 0; font-size: 0.875rem;
    }
    .ticket-body li span:first-child { color: rgb(var(--muted)); }
    dl { margin: 0; padding-top: 8px; border-top: 1px solid rgb(var(--line)); }
    dl div { display: flex; justify-content: space-between; padding: 2px 0; font-size: 0.875rem; }
    dt { color: rgb(var(--muted)); }
    .discount { color: #059669; }
    .grand { font-weight: 700; }
    .ticket-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .btn-outline.sm {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 10px; font-size: 12px; text-decoration: none; color: inherit;
    }
    .btn-outline.sm mat-icon { font-size: 14px; width: 14px; height: 14px; }
  `],
})
export class ClientTicketsComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly orders = inject(OrderService);
  private readonly session = inject(SessionService);
  private readonly snack = inject(MatSnackBar);

  readonly formatDate = formatDate;
  readonly loading = signal(true);
  readonly all = signal<Order[]>([]);
  readonly expanded = signal<string | null>(null);
  readonly querySig = signal('');
  query = '';

  readonly tickets = computed(() =>
    [...this.all()]
      .filter((o) => o.status === 'redeemed' || o.status === 'rated' || o.status === 'pending' || o.status === 'ready')
      .sort((a, b) => (b.redeemedAt ?? b.createdAt).localeCompare(a.redeemedAt ?? a.createdAt)),
  );

  readonly filtered = computed(() => {
    const q = this.querySig().trim().toLowerCase();
    if (!q) return this.tickets();
    return this.tickets().filter((o) => {
      const hay = [
        o.reference,
        o.pickupCode,
        o.storeName,
        ...o.items.map((i) => i.product?.name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  });

  readonly totalSpent = computed(() => this.tickets().reduce((s, o) => s + o.total, 0));
  readonly totalSaved = computed(() => this.tickets().reduce((s, o) => s + (o.discount ?? 0), 0));

  ngOnInit(): void {
    this.load();
  }

  toggle(id: string): void {
    this.expanded.update((cur) => (cur === id ? null : id));
  }

  lineTotal(item: { unitPrice?: number; product?: { price?: number }; quantity: number }): number {
    return (item.unitPrice ?? item.product?.price ?? 0) * item.quantity;
  }

  copyEmail(order: Order): void {
    const email = order.customerEmail || this.auth.user()?.email || '';
    const body = `Ticket ${order.reference ?? order.pickupCode}\nBoutique: ${order.storeName}\nTotal: ${order.total} FCFA`;
    if (email) {
      window.location.href = `mailto:${email}?subject=${encodeURIComponent('Ticket Boutika')}&body=${encodeURIComponent(body)}`;
    } else {
      void navigator.clipboard.writeText(body).then(() => {
        this.snack.open('Récapitulatif copié (aucun e-mail lié)', 'OK', { duration: 2500 });
      });
    }
  }

  printTicket(order: Order): void {
    const lines = order.items
      .map((i) => `${i.quantity} × ${i.product?.name ?? 'Article'} — ${this.lineTotal(i)} FCFA`)
      .join('<br/>');
    const w = window.open('', '_blank', 'width=480,height=720');
    if (!w) {
      this.snack.open('Autorisez les pop-ups pour imprimer', 'OK', { duration: 2500 });
      return;
    }
    w.document.write(`<!doctype html><html><head><title>Ticket ${order.reference ?? ''}</title>
      <style>body{font-family:system-ui;padding:24px;color:#0f172a}h1{font-size:18px} .muted{color:#64748b}</style>
      </head><body>
      <h1>Ticket ${order.reference ?? order.pickupCode}</h1>
      <p class="muted">${order.storeName ?? ''} · ${formatDate(order.createdAt, true)}</p>
      <p>${lines}</p>
      <p><strong>Total : ${order.total} FCFA</strong></p>
      <script>window.print()</script>
      </body></html>`);
    w.document.close();
  }

  exportJson(): void {
    const blob = new Blob([JSON.stringify(this.tickets(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tickets-boutika.json';
    a.click();
    URL.revokeObjectURL(url);
    this.snack.open('Tickets exportés', 'OK', { duration: 2000 });
  }

  private load(): void {
    this.loading.set(true);
    const params: Record<string, string> = {};
    const user = this.auth.user();
    if (user) params['userId'] = user.id;
    else params['sessionId'] = this.session.getSessionId();
    this.orders.getOrders(params).subscribe({
      next: (res) => {
        this.all.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
