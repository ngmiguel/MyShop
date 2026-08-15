import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { OrderService } from '../../../core/services/order.service';

import { SellerDataService } from '../../../core/services/seller-data.service';

import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

import { SegmentedTabsComponent } from '../../../shared/components/segmented-tabs/segmented-tabs.component';

import { Order } from '../../../core/models';

import { countdown } from '../../../core/utils/qr.util';

import { formatDate, formatMoney, relativeTime } from '../../../core/utils/format.util';

import { sellerDisplayName } from '../../../core/data/demo-sellers';



type TabId = 'queue' | 'history';



@Component({

  selector: 'app-queue',

  standalone: true,

  imports: [

    FormsModule, RouterLink, MatButtonModule, MatIconModule, MatSnackBarModule,

    LoadingSpinnerComponent, EmptyStateComponent, SegmentedTabsComponent,

  ],

  template: `

    <div class="page">

      <header class="page-head">

        <div>

          <h1>File des retraits</h1>

          <p>Codes QR en attente pour {{ sellerData.storeName() }}, du plus ancien au plus récent.</p>

        </div>

        <div class="head-actions">

          <a routerLink="/seller/scanner" class="btn-outline">

            <mat-icon>qr_code_scanner</mat-icon> Scanner

          </a>

          <button type="button" class="btn-outline" (click)="refresh()" [disabled]="sellerData.loading()">

            <mat-icon>refresh</mat-icon> Actualiser

          </button>

          <app-segmented-tabs [items]="tabItems()" [value]="tab()" (valueChange)="onTabChange($event)" />

        </div>

      </header>



      <div class="stat-grid">

        <div class="stat card">

          <mat-icon>pending_actions</mat-icon>

          <span class="label">En attente</span>

          <strong>{{ sellerData.pendingCount() }}</strong>

        </div>

        <div class="stat card">

          <mat-icon>payments</mat-icon>

          <span class="label">Valeur en attente</span>

          <strong>{{ formatMoney(sellerData.pendingTotal()) }}</strong>

        </div>

        <div class="stat card">

          <mat-icon>check_circle</mat-icon>

          <span class="label">Retraits aujourd'hui</span>

          <strong>{{ sellerData.redeemedToday() }}</strong>

        </div>

      </div>



      @if (sellerData.loading() && !sellerData.storeOrders().length) {

        <app-loading-spinner />

      } @else if (tab() === 'queue') {

        <div class="search-wrap">

          <mat-icon>search</mat-icon>

          <input

            class="input-field"

            [(ngModel)]="query"

            placeholder="Rechercher une référence…"

            aria-label="Rechercher une référence"

          />

        </div>



        @if (queue().length) {

          <div class="queue-list">

            @for (order of queue(); track order.id) {

              @let timer = countdown(order.expiresAt ?? order.createdAt);

              <article class="order-card card">

                <div class="order-head">

                  <div>

                    <p class="ref">{{ order.reference ?? order.pickupCode }}</p>

                    <p class="meta">{{ order.customerName }} · {{ order.customerPhone }}</p>

                    <p class="meta">{{ itemCount(order) }} article(s) · commandé {{ relativeTime(order.createdAt) }}</p>

                  </div>

                  <div class="order-actions">

                    <span class="badge" [class.danger]="timer.expired" [class.warning]="!timer.expired">

                      <mat-icon>schedule</mat-icon>

                      {{ timer.expired ? 'Expiré' : 'Expire dans ' + timer.label }}

                    </span>

                    <span class="pay-badge">{{ paymentLabel(order.paymentMethod) }}</span>

                    <span class="amount">{{ formatMoney(order.total) }}</span>

                    <button type="button" class="btn-primary sm" (click)="redeem(order)">

                      <mat-icon>check_circle</mat-icon> Confirmer

                    </button>

                  </div>

                </div>

                <ul class="items">

                  @for (item of order.items; track item.productId) {

                    <li>{{ item.quantity }} × {{ item.product?.name ?? 'Article' }}</li>

                  }

                </ul>

              </article>

            }

          </div>

        } @else {

          <app-empty-state

            icon="inbox"

            title="Aucun retrait en attente"

            message="Les nouveaux paiements clients apparaîtront ici automatiquement."

          />

        }

      } @else {

        <div class="search-wrap">

          <mat-icon>search</mat-icon>

          <input

            class="input-field"

            [(ngModel)]="historyQuery"

            placeholder="Filtrer l'historique…"

            aria-label="Filtrer l'historique"

          />

        </div>



        @if (history().length) {

          <div class="table-wrap">

            <table>

              <thead>

                <tr>

                  <th>Référence</th>

                  <th>Client</th>

                  <th>Statut</th>

                  <th>Traité par</th>

                  <th class="right">Montant</th>

                  <th>Date</th>

                </tr>

              </thead>

              <tbody>

                @for (order of history(); track order.id) {

                  <tr>

                    <td class="ref">{{ order.reference ?? order.pickupCode }}</td>

                    <td class="muted">{{ order.customerName }}</td>

                    <td>

                      <span class="badge" [class]="statusTone(order.status)">{{ statusLabel(order.status) }}</span>

                    </td>

                    <td class="muted">{{ sellerDisplayName(order.sellerId) }}</td>

                    <td class="right amount">{{ formatMoney(order.total) }}</td>

                    <td class="date">{{ formatDate(order.redeemedAt ?? order.createdAt, true) }}</td>

                  </tr>

                }

              </tbody>

            </table>

          </div>

        } @else {

          <app-empty-state

            icon="inbox"

            title="Historique vide"

            message="Les retraits confirmés ou expirés seront listés ici."

          />

        }

      }

    </div>

  `,

  styles: [`

    .page { max-width: 64rem; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; padding-bottom: 24px; }

    .page-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 12px; }

    h1 { margin: 0; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em; }

    .page-head > div > p { margin: 4px 0 0; font-size: 14px; color: rgb(var(--muted)); }

    .head-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }

    .btn-outline {

      display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px;

      border-radius: 8px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface));

      font-size: 13px; font-weight: 600; color: rgb(var(--ink)); cursor: pointer; text-decoration: none;

    }

    .btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-outline mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .stat-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }

    .stat.card {

      padding: 16px; display: flex; flex-direction: column; gap: 4px;

      background: rgb(var(--surface)); border: 1px solid rgb(var(--line)); border-radius: 12px;

    }

    .stat mat-icon { font-size: 20px; width: 20px; height: 20px; color: rgb(var(--muted)); }

    .stat .label { font-size: 12px; color: rgb(var(--muted)); }

    .stat strong { font-size: 1.25rem; }

    .search-wrap { position: relative; max-width: 24rem; }

    .search-wrap mat-icon {

      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);

      font-size: 18px; width: 18px; height: 18px; color: rgb(var(--muted));

    }

    .search-wrap .input-field { padding-left: 40px; width: 100%; box-sizing: border-box; }

    .queue-list { display: flex; flex-direction: column; gap: 12px; }

    .order-card { padding: 0; overflow: hidden; }

    .order-head {

      display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px;

      padding: 16px;

    }

    .ref { margin: 0; font-family: ui-monospace, monospace; font-size: 14px; font-weight: 600; }

    .meta { margin: 4px 0 0; font-size: 12px; color: rgb(var(--muted)); }

    .order-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }

    .amount { font-size: 14px; font-weight: 600; }

    .pay-badge {

      font-size: 11px; padding: 2px 8px; border-radius: 999px;

      background: rgb(var(--surface-2)); color: rgb(var(--muted));

    }

    .badge {

      display: inline-flex; align-items: center; gap: 4px;

      padding: 4px 8px; border-radius: 999px; font-size: 11px; font-weight: 600;

    }

    .badge.warning { background: rgba(245,158,11,0.15); color: #b45309; }

    .badge.danger { background: rgba(244,63,94,0.15); color: #be123c; }

    .badge.success { background: rgba(5,150,105,0.15); color: #047857; }

    .badge.neutral { background: rgb(var(--surface-2)); color: rgb(var(--muted)); }

    .badge mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .items {

      list-style: none; margin: 0; padding: 8px 16px;

      border-top: 1px solid rgb(var(--line)); font-size: 12px; color: rgb(var(--muted));

    }

    .items li { padding: 2px 0; }

    .btn-primary.sm {

      display: inline-flex; align-items: center; gap: 6px;

      padding: 6px 12px; border: none; border-radius: 8px;

      background: rgb(var(--accent)); color: white; font-size: 13px; font-weight: 600; cursor: pointer;

    }

    .btn-primary.sm mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); }

    table { width: 100%; border-collapse: collapse; font-size: 14px; }

    thead { border-bottom: 1px solid rgb(var(--line)); text-align: left; }

    th { padding: 12px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: rgb(var(--muted)); font-weight: 600; }

    td { padding: 12px 16px; border-top: 1px solid rgb(var(--line)); }

    td.ref { font-family: ui-monospace, monospace; font-size: 12px; }

    td.muted, td.date { color: rgb(var(--muted)); font-size: 13px; }

    td.right { text-align: right; }

  `],

})

export class QueueComponent implements OnInit, OnDestroy {

  readonly sellerData = inject(SellerDataService);

  private readonly orderService = inject(OrderService);

  private readonly snackBar = inject(MatSnackBar);



  readonly formatMoney = formatMoney;

  readonly formatDate = formatDate;

  readonly relativeTime = relativeTime;

  readonly countdown = countdown;

  readonly sellerDisplayName = sellerDisplayName;



  tab = signal<TabId>('queue');

  query = '';

  historyQuery = '';

  private refreshTimer?: ReturnType<typeof setInterval>;



  queue = computed(() => {

    const q = this.query.trim().toLowerCase();

    return this.sellerData.pendingOrders().filter(

      (o) => !q || (o.reference ?? o.pickupCode).toLowerCase().includes(q),

    );

  });



  history = computed(() => {

    const q = this.historyQuery.trim().toLowerCase();

    return this.sellerData.storeOrders()

      .filter((o) => o.status !== 'pending')

      .filter((o) => {

        if (!q) return true;

        const ref = (o.reference ?? o.pickupCode).toLowerCase();

        return ref.includes(q) || (o.customerName ?? '').toLowerCase().includes(q);

      })

      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  });



  tabItems = computed(() => {
    const historyCount = this.sellerData.storeOrders().filter((o) => o.status !== 'pending').length;
    return [
      { id: 'queue', label: `En attente (${this.sellerData.pendingCount()})` },
      { id: 'history', label: `Historique (${historyCount})` },
    ];
  });



  ngOnInit(): void {

    this.refresh();

    this.refreshTimer = setInterval(() => this.refresh(), 15000);

  }



  ngOnDestroy(): void {

    if (this.refreshTimer) clearInterval(this.refreshTimer);

  }



  onTabChange(id: string): void {

    this.tab.set(id as TabId);

  }



  itemCount(order: Order): number {

    return order.items.reduce((a, i) => a + i.quantity, 0);

  }



  paymentLabel(method?: string): string {

    const labels: Record<string, string> = {

      mobile_money: 'Mobile Money',

      card: 'Carte',

      cash: 'Espèces',

      transfer: 'Virement',

    };

    return labels[method ?? ''] ?? 'Paiement';

  }



  statusLabel(status: string): string {

    const labels: Record<string, string> = {

      redeemed: 'Retiré', rated: 'Retiré', expired: 'Expiré', cancelled: 'Annulé',

    };

    return labels[status] ?? status;

  }



  statusTone(status: string): string {

    if (status === 'redeemed' || status === 'rated') return 'success';

    if (status === 'expired') return 'danger';

    return 'neutral';

  }



  redeem(order: Order): void {

    this.orderService.redeemOrder(order.id).subscribe({

      next: () => {

        this.snackBar.open('Retrait confirmé', order.reference ?? order.pickupCode, { duration: 2500 });

        this.refresh();

      },

      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 }),

    });

  }



  refresh(): void {

    this.sellerData.refreshOrders().subscribe();

  }

}


