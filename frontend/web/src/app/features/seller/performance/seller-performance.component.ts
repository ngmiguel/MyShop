import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { SellerService } from '../../../core/services/seller.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { SellerPerformance } from '../../../core/models';

@Component({
  selector: 'app-seller-performance',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, MatIconModule, PageHeaderComponent, LoadingSpinnerComponent],
  template: `
    <app-page-header title="Performance" />

    @if (loading()) {
      <app-loading-spinner />
    } @else if (perf()) {
      <div class="kpi-grid">
        <div class="kpi-card">
          <mat-icon>trending_up</mat-icon>
          <span class="value">{{ perf()!.totalOrders }}</span>
          <span class="label">Commandes totales</span>
        </div>
        <div class="kpi-card">
          <mat-icon>payments</mat-icon>
          <span class="value">{{ perf()!.totalRevenue | currency:'XOF':'symbol-narrow':'1.0-0' }}</span>
          <span class="label">Chiffre d'affaires</span>
        </div>
        <div class="kpi-card">
          <mat-icon>star</mat-icon>
          <span class="value">{{ perf()!.averageRating | number:'1.1-1' }}</span>
          <span class="label">Note moyenne</span>
        </div>
        <div class="kpi-card">
          <mat-icon>schedule</mat-icon>
          <span class="value">{{ perf()!.averagePickupMinutes }} min</span>
          <span class="label">Delai moyen</span>
        </div>
        <div class="kpi-card highlight">
          <mat-icon>today</mat-icon>
          <span class="value">{{ perf()!.ordersToday }}</span>
          <span class="label">Commandes aujourd'hui</span>
        </div>
        <div class="kpi-card highlight">
          <mat-icon>account_balance_wallet</mat-icon>
          <span class="value">{{ perf()!.revenueToday | currency:'XOF':'symbol-narrow':'1.0-0' }}</span>
          <span class="label">CA aujourd'hui</span>
        </div>
      </div>
    }
  `,
  styles: [`
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      padding: 16px;
    }
    .kpi-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .kpi-card mat-icon { color: #059669; font-size: 24px; width: 24px; height: 24px; }
    .kpi-card.highlight { background: rgba(5, 150, 105, 0.06); border-color: rgba(5, 150, 105, 0.2); }
    .value { font-size: 1.25rem; font-weight: 700; }
    .label { font-size: 0.75rem; color: var(--text-muted); }
  `],
})
export class SellerPerformanceComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly sellerService = inject(SellerService);

  perf = signal<SellerPerformance | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const user = this.auth.user();
    if (!user) {
      this.loading.set(false);
      return;
    }
    this.sellerService.getSellers().subscribe({
      next: (res) => {
        const seller = (res.data ?? []).find((s) => s.userId === user.id);
        if (seller) {
          this.sellerService.getPerformance(seller.id).subscribe({
            next: (p) => { this.perf.set(p); this.loading.set(false); },
            error: () => this.loading.set(false),
          });
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }
}
