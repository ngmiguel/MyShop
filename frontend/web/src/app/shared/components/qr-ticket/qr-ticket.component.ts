import { CurrencyPipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import QRCode from 'qrcode';
import { Order } from '../../../core/models';
import { encodeQr, countdown } from '../../../core/utils/qr.util';
import { formatDate } from '../../../core/utils/format.util';

const STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: 'En attente de retrait', tone: 'warning' },
  ready: { label: 'En attente de retrait', tone: 'warning' },
  redeemed: { label: 'Retiré', tone: 'success' },
  expired: { label: 'Expiré', tone: 'danger' },
  cancelled: { label: 'Annulé', tone: 'neutral' },
  rated: { label: 'Retiré', tone: 'success' },
};

@Component({
  selector: 'app-qr-ticket',
  standalone: true,
  imports: [CurrencyPipe, MatIconModule],
  template: `
    <article class="ticket" [class.dimmed]="dimmed()">
      <header>
        <div>
          <p class="ref">{{ order.reference ?? order.pickupCode }}</p>
          <p class="store"><mat-icon>storefront</mat-icon> {{ order.storeName ?? 'Boutique' }}</p>
        </div>
        <span class="badge" [class]="statusTone()">{{ statusLabel() }}</span>
      </header>

      <div class="body" [class.compact]="compact">
        <div class="qr-box">
          @if (qrDataUrl()) {
            <img [src]="qrDataUrl()!" alt="QR code" [width]="qrSize" [height]="qrSize" />
          } @else {
            <mat-icon>qr_code_2</mat-icon>
          }
        </div>
        <div class="info">
          <p class="total">{{ order.total | currency:(order.currency ?? 'XOF'):'symbol-narrow':'1.0-0' }}</p>
          <p class="meta">{{ itemCount() }} article(s) · {{ formatDate(order.createdAt, true) }}</p>
          @if (order.status === 'pending' && order.expiresAt) {
            <p class="timer" [class.expired]="expired()">
              <mat-icon>schedule</mat-icon>
              @if (expired()) { Expiré } @else { Expire dans {{ countdownLabel() }} }
            </p>
          }
          @if (order.status === 'redeemed' && order.redeemedAt) {
            <p class="redeemed">Retiré le {{ formatDate(order.redeemedAt, true) }}</p>
          }
          @if (!compact) {
            <ul class="items">
              @for (item of order.items; track item.productId) {
                <li>
                  <span>{{ item.quantity }} × {{ item.product?.name ?? 'Article' }}</span>
                  <span>{{ lineTotal(item) | currency:(order.currency ?? 'XOF'):'symbol-narrow':'1.0-0' }}</span>
                </li>
              }
            </ul>
          }
        </div>
      </div>
    </article>
  `,
  styles: [`
    .ticket { overflow: hidden; border-radius: 12px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); }
    .ticket.dimmed .qr-box { opacity: 0.4; }
    header {
      display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
      padding: 12px 16px; border-bottom: 1px solid rgb(var(--line));
    }
    .ref { margin: 0; font-family: ui-monospace, monospace; font-size: 14px; font-weight: 600; }
    .store { display: flex; align-items: center; gap: 6px; margin: 4px 0 0; font-size: 12px; color: rgb(var(--muted)); }
    .store mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .badge { font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 999px; white-space: nowrap; }
    .badge.warning { background: rgba(245,158,11,0.15); color: #b45309; }
    .badge.success { background: rgba(5,150,105,0.15); color: #047857; }
    .badge.danger { background: rgba(244,63,94,0.15); color: #be123c; }
    .badge.neutral { background: rgb(var(--surface-2)); color: rgb(var(--muted)); }
    .body { display: flex; gap: 16px; padding: 16px; }
    .body.compact { align-items: center; }
    .qr-box {
      flex-shrink: 0; border-radius: 8px; background: white; padding: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .qr-box mat-icon { font-size: 64px; width: 64px; height: 64px; color: rgb(var(--muted)); }
    .info { flex: 1; min-width: 0; font-size: 14px; }
    .total { margin: 0; font-weight: 600; font-size: 14px; }
    .meta { margin: 4px 0 0; font-size: 12px; color: rgb(var(--muted)); }
    .timer {
      display: inline-flex; align-items: center; gap: 6px; margin-top: 8px;
      padding: 4px 8px; border-radius: 999px; font-size: 12px; font-weight: 500;
      background: rgba(245,158,11,0.15); color: #b45309;
    }
    .timer.expired { background: rgba(244,63,94,0.15); color: #be123c; }
    .timer mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .redeemed { margin-top: 8px; font-size: 12px; color: #059669; }
    .items { list-style: none; margin: 12px 0 0; padding: 0; }
    .items li { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; color: rgb(var(--muted)); padding: 2px 0; }
  `],
})
export class QrTicketComponent implements OnInit, OnDestroy {
  @Input({ required: true }) order!: Order;
  @Input() compact = false;

  readonly formatDate = formatDate;
  qrDataUrl = signal<string | null>(null);
  countdownLabel = signal('');
  expired = signal(false);
  dimmed = signal(false);

  private timer?: ReturnType<typeof setInterval>;

  get qrSize(): number {
    return this.compact ? 86 : 132;
  }

  ngOnInit(): void {
    this.dimmed.set(this.order.status !== 'pending' && this.order.status !== 'ready');
    QRCode.toDataURL(encodeQr(this.order), {
      width: this.qrSize * 2,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
      .then((url) => this.qrDataUrl.set(url))
      .catch(() => this.qrDataUrl.set(null));

    if (this.order.expiresAt && (this.order.status === 'pending' || this.order.status === 'ready')) {
      this.tick();
      this.timer = setInterval(() => this.tick(), 1000);
    }
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  itemCount(): number {
    return this.order.items.reduce((a, i) => a + i.quantity, 0);
  }

  lineTotal(item: { unitPrice?: number; product?: { price?: number }; quantity: number }): number {
    return (item.unitPrice ?? item.product?.price ?? 0) * item.quantity;
  }

  statusLabel(): string {
    return STATUS[this.order.status]?.label ?? this.order.status;
  }

  statusTone(): string {
    return STATUS[this.order.status]?.tone ?? 'neutral';
  }

  private tick(): void {
    if (!this.order.expiresAt) return;
    const { label, expired } = countdown(this.order.expiresAt);
    this.countdownLabel.set(label);
    this.expired.set(expired);
  }
}
