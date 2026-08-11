import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Order } from '../../../core/models';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, MatIconModule, MatChipsModule],
  template: `
    <article class="order-card">
      <div class="order-header">
        <div>
          <span class="order-num">#{{ order.orderNumber }}</span>
          @if (order.storeName) {
            <span class="store">{{ order.storeName }}</span>
          }
        </div>
        <span class="status" [class]="order.status">{{ statusLabel(order.status) }}</span>
      </div>
      <div class="order-body">
        <div class="items">{{ order.items.length }} article(s)</div>
        <div class="total">{{ order.total | currency:'XOF':'symbol-narrow':'1.0-0' }}</div>
      </div>
      @if (order.status === 'pending' || order.status === 'ready') {
        <div class="pickup-code">
          <mat-icon>qr_code_2</mat-icon>
          <span>{{ order.pickupCode }}</span>
        </div>
      }
      <div class="order-date">{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
    </article>
  `,
  styles: [`
    .order-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px 16px;
    }
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }
    .order-num { font-weight: 600; font-size: 0.9375rem; display: block; }
    .store { font-size: 0.75rem; color: var(--text-muted); }
    .status {
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .status.pending { background: #fef3c7; color: #92400e; }
    .status.ready { background: #dbeafe; color: #1e40af; }
    .status.redeemed { background: #d1fae5; color: #065f46; }
    .status.cancelled { background: #fee2e2; color: #991b1b; }
    .status.rated { background: #e0e7ff; color: #3730a3; }
    .order-body {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .items { font-size: 0.8125rem; color: var(--text-muted); }
    .total { font-weight: 700; color: var(--primary); }
    .pickup-code {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--surface-alt);
      border-radius: 8px;
      font-family: monospace;
      font-size: 1.125rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }
    .pickup-code mat-icon { color: var(--primary); }
    .order-date { font-size: 0.75rem; color: var(--text-muted); }
  `],
})
export class OrderCardComponent {
  @Input({ required: true }) order!: Order;

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      ready: 'Pret',
      redeemed: 'Retire',
      cancelled: 'Annule',
      rated: 'Note',
    };
    return labels[status] ?? status;
  }
}
