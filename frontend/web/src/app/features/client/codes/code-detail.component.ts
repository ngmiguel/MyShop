import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import QRCode from 'qrcode';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { SessionService } from '../../../core/services/session.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Order } from '../../../core/models';
import { countdown, encodeQr } from '../../../core/utils/qr.util';
import { formatDate } from '../../../core/utils/format.util';

@Component({
  selector: 'app-code-detail',
  standalone: true,
  imports: [
    CurrencyPipe,
    RouterLink,
    MatIconModule,
    MatSnackBarModule,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="page">
      <header class="page-head">
        <a routerLink="/client/codes" class="back">
          <mat-icon>arrow_back</mat-icon> Mes codes
        </a>
        <div>
          <h1>Code de paiement</h1>
          <p>{{ order()?.storeName || 'Boutique' }}</p>
        </div>
      </header>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (!order()) {
        <div class="card empty">
          <mat-icon>qr_code_2</mat-icon>
          <h2>Code introuvable</h2>
          <p>Ce code n'existe plus ou n'appartient pas à cette session.</p>
          <a routerLink="/client/codes" class="btn-primary">Retour aux codes</a>
        </div>
      } @else {
        <section class="card hero">
          <span class="badge" [class]="statusTone()">{{ statusLabel() }}</span>
          <div class="qr-box" [class.dimmed]="!isActive()">
            @if (qrDataUrl()) {
              <img [src]="qrDataUrl()!" alt="QR code" width="220" height="220" />
            } @else {
              <mat-icon>qr_code_2</mat-icon>
            }
          </div>
          @if (isActive() && countdownLabel()) {
            <p class="timer" [class.expired]="expired()">
              <mat-icon>schedule</mat-icon>
              {{ expired() ? 'Expiré' : 'Expire dans ' + countdownLabel() }}
            </p>
          }
          <p class="ref">{{ order()!.reference ?? order()!.pickupCode }}</p>
          <button type="button" class="text-btn" (click)="copyRef()">
            <mat-icon>content_copy</mat-icon> Copier le code
          </button>
          <p class="total">{{ order()!.total | currency:(order()!.currency ?? 'XOF'):'symbol-narrow':'1.0-0' }}</p>
          <p class="meta">{{ paymentLabel(order()!.paymentMethod) }} · Retrait boutique</p>
        </section>

        <section class="card">
          <h2>Détail de la commande</h2>
          <ul class="lines">
            @for (item of order()!.items; track item.productId) {
              <li>
                <span>{{ item.quantity }} × {{ item.product?.name ?? 'Article' }}</span>
                <span>{{ lineTotal(item) | currency:(order()!.currency ?? 'XOF'):'symbol-narrow':'1.0-0' }}</span>
              </li>
            }
          </ul>
          <dl class="totals">
            <div><dt>Sous-total</dt><dd>{{ order()!.subtotal | currency:(order()!.currency ?? 'XOF'):'symbol-narrow':'1.0-0' }}</dd></div>
            @if (order()!.discount > 0) {
              <div class="discount">
                <dt>Remise</dt>
                <dd>−{{ order()!.discount | currency:(order()!.currency ?? 'XOF'):'symbol-narrow':'1.0-0' }}</dd>
              </div>
            }
            <div><dt>Taxes</dt><dd>{{ (order()!.tax ?? 0) | currency:(order()!.currency ?? 'XOF'):'symbol-narrow':'1.0-0' }}</dd></div>
            <div class="grand"><dt>Total</dt><dd>{{ order()!.total | currency:(order()!.currency ?? 'XOF'):'symbol-narrow':'1.0-0' }}</dd></div>
          </dl>
        </section>

        <section class="card">
          <h2>Informations</h2>
          <dl class="info">
            <div><dt>Client</dt><dd>{{ order()!.customerName || '—' }}</dd></div>
            <div><dt>Téléphone</dt><dd>{{ order()!.customerPhone || '—' }}</dd></div>
            <div><dt>Créé le</dt><dd>{{ formatDate(order()!.createdAt, true) }}</dd></div>
            @if (order()!.expiresAt) {
              <div><dt>Expire le</dt><dd>{{ formatDate(order()!.expiresAt!, true) }}</dd></div>
            }
            @if (order()!.redeemedAt) {
              <div><dt>Retiré le</dt><dd>{{ formatDate(order()!.redeemedAt!, true) }}</dd></div>
            }
          </dl>
        </section>

        <div class="actions">
          <a routerLink="/client/tickets" class="btn-outline">
            <mat-icon>receipt_long</mat-icon> Voir les tickets
          </a>
          @if (isActive()) {
            <button type="button" class="btn-warn" (click)="cancel()" [disabled]="busy()">
              <mat-icon>cancel</mat-icon> Annuler le code
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 40rem; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .page-head { display: flex; flex-direction: column; gap: 8px; }
    .back {
      display: inline-flex; align-items: center; gap: 4px;
      color: rgb(var(--muted)); font-size: 0.85rem; text-decoration: none; width: fit-content;
    }
    h1 { margin: 0; font-size: 1.4rem; font-weight: 700; }
    .page-head p { margin: 0; color: rgb(var(--muted)); font-size: 0.9rem; }
    .card {
      background: rgb(var(--surface)); border: 1px solid rgb(var(--line));
      border-radius: 14px; padding: 20px;
    }
    .hero { display: flex; flex-direction: column; align-items: center; text-align: center; }
    .badge {
      font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; margin-bottom: 14px;
    }
    .badge.warning { background: rgba(245,158,11,0.15); color: #b45309; }
    .badge.success { background: rgba(5,150,105,0.15); color: #047857; }
    .badge.danger { background: rgba(244,63,94,0.15); color: #be123c; }
    .badge.neutral { background: rgb(var(--surface-2)); color: rgb(var(--muted)); }
    .qr-box {
      padding: 12px; border-radius: 16px; border: 1px solid rgb(var(--line)); background: #fff;
    }
    .qr-box.dimmed { opacity: 0.35; filter: grayscale(1); }
    .qr-box mat-icon { font-size: 120px; width: 120px; height: 120px; color: rgb(var(--muted)); }
    .timer {
      display: inline-flex; align-items: center; gap: 6px; margin: 12px 0 0;
      padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;
      background: rgba(245,158,11,0.15); color: #b45309;
    }
    .timer.expired { background: rgba(244,63,94,0.15); color: #be123c; }
    .timer mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .ref {
      margin: 14px 0 0; font-family: ui-monospace, monospace;
      font-size: 1.15rem; font-weight: 800; letter-spacing: 0.08em;
    }
    .text-btn {
      display: inline-flex; align-items: center; gap: 6px; margin-top: 6px;
      border: none; background: transparent; color: rgb(var(--accent));
      font-weight: 700; font-size: 0.8rem; cursor: pointer;
    }
    .text-btn mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .total { margin: 10px 0 0; font-size: 1.5rem; font-weight: 800; }
    .meta { margin: 4px 0 0; font-size: 0.85rem; color: rgb(var(--muted)); }
    h2 { margin: 0 0 12px; font-size: 1rem; font-weight: 700; }
    .lines { list-style: none; margin: 0; padding: 0; }
    .lines li {
      display: flex; justify-content: space-between; gap: 12px;
      padding: 6px 0; font-size: 0.9rem; border-bottom: 1px solid rgb(var(--line));
    }
    .lines li span:first-child { color: rgb(var(--muted)); }
    .totals, .info { margin: 12px 0 0; }
    .totals div, .info div {
      display: flex; justify-content: space-between; gap: 12px;
      padding: 4px 0; font-size: 0.9rem;
    }
    dt { color: rgb(var(--muted)); }
    .discount { color: #059669; }
    .grand { font-weight: 700; margin-top: 4px; }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; }
    .btn-warn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 16px; border-radius: 999px; border: 1px solid #fecaca;
      background: #fef2f2; color: #dc2626; font-weight: 600; cursor: pointer;
    }
    .btn-warn:disabled { opacity: 0.6; cursor: not-allowed; }
    .empty { text-align: center; padding: 40px 20px; }
    .empty mat-icon { font-size: 40px; width: 40px; height: 40px; color: rgb(var(--muted)); }
  `],
})
export class CodeDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orders = inject(OrderService);
  private readonly auth = inject(AuthService);
  private readonly session = inject(SessionService);
  private readonly snack = inject(MatSnackBar);

  readonly formatDate = formatDate;
  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly qrDataUrl = signal<string | null>(null);
  readonly countdownLabel = signal('');
  readonly expired = signal(false);

  private timer?: ReturnType<typeof setInterval>;

  readonly isActive = computed(() => {
    const o = this.order();
    return !!o && (o.status === 'pending' || o.status === 'ready') && !this.expired();
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/client/codes']);
      return;
    }
    this.load(id);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  lineTotal(item: { unitPrice?: number; product?: { price?: number }; quantity: number }): number {
    return (item.unitPrice ?? item.product?.price ?? 0) * item.quantity;
  }

  statusLabel(): string {
    const map: Record<string, string> = {
      pending: 'En attente de retrait',
      ready: 'En attente de retrait',
      redeemed: 'Retiré',
      rated: 'Retiré',
      expired: 'Expiré',
      cancelled: 'Annulé',
    };
    return map[this.order()?.status ?? ''] ?? this.order()?.status ?? '';
  }

  statusTone(): string {
    const s = this.order()?.status;
    if (s === 'pending' || s === 'ready') return 'warning';
    if (s === 'redeemed' || s === 'rated') return 'success';
    if (s === 'expired' || s === 'cancelled') return 'danger';
    return 'neutral';
  }

  paymentLabel(method?: string): string {
    const map: Record<string, string> = {
      mobile_money: 'Mobile Money',
      card: 'Carte',
      transfer: 'Virement',
      cash: 'Espèces',
    };
    return method ? map[method] ?? method : '—';
  }

  copyRef(): void {
    const ref = this.order()?.reference ?? this.order()?.pickupCode;
    if (!ref) return;
    void navigator.clipboard.writeText(ref).then(() => {
      this.snack.open('Code copié', 'OK', { duration: 1800 });
    });
  }

  cancel(): void {
    const order = this.order();
    if (!order || !confirm('Annuler ce code de paiement ?')) return;
    this.busy.set(true);
    this.orders.cancelOrder(order.id).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.busy.set(false);
        this.snack.open('Code annulé', 'OK', { duration: 2200 });
      },
      error: () => {
        this.busy.set(false);
        this.snack.open('Impossible d’annuler ce code', 'Fermer', { duration: 3000 });
      },
    });
  }

  private load(id: string): void {
    this.loading.set(true);
    const params: Record<string, string> = {};
    const user = this.auth.user();
    if (user) params['userId'] = user.id;
    else params['sessionId'] = this.session.getSessionId();

    this.orders.getOrders(params).subscribe({
      next: (res) => {
        const found = (res.data ?? []).find((o) => o.id === id || o.reference === id || o.pickupCode === id) ?? null;
        this.order.set(found);
        this.loading.set(false);
        if (found) this.setupQr(found);
      },
      error: () => {
        this.loading.set(false);
        this.order.set(null);
      },
    });
  }

  private setupQr(order: Order): void {
    QRCode.toDataURL(encodeQr(order), {
      width: 440,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
      .then((url) => this.qrDataUrl.set(url))
      .catch(() => this.qrDataUrl.set(null));

    if (order.expiresAt && (order.status === 'pending' || order.status === 'ready')) {
      this.tick(order);
      this.timer = setInterval(() => this.tick(order), 1000);
    }
  }

  private tick(order: Order): void {
    if (!order.expiresAt) return;
    const { label, expired } = countdown(order.expiresAt);
    this.countdownLabel.set(label);
    this.expired.set(expired);
  }
}
