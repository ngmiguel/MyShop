import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Order } from '../../../core/models';
import {
  computeKpis,
  enrichDemoSales,
  formatGrowth,
  groupByDay,
  growth,
  SaleRecord,
} from '../../../core/utils/analytics.util';
import { formatMoney, initials } from '../../../core/utils/format.util';
import {
  DemoSellerProfile,
  getSellerByUserId,
  getStoreTeam,
} from '../../../core/data/demo-sellers';

@Component({
  selector: 'app-seller-performance',
  standalone: true,
  imports: [DecimalPipe, MatIconModule, BaseChartDirective, LoadingSpinnerComponent],
  template: `
    <div class="page">
      <header>
        <h1>Ma performance</h1>
        <p>Vos ventes validées, votre rapidité de remise et vos notes clients.</p>
      </header>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (seller()) {
        <div class="stat-grid">
          <div class="stat card">
            <mat-icon>trending_up</mat-icon>
            <span class="label">Ventes du jour</span>
            <strong>{{ dayKpis().transactions }}</strong>
            <span class="hint">{{ formatMoney(dayKpis().revenue) }}</span>
          </div>
          <div class="stat card">
            <mat-icon>date_range</mat-icon>
            <span class="label">Ventes sur 7 jours</span>
            <strong>{{ weekKpis().transactions }}</strong>
            <span class="hint delta" [class.up]="weekGrowth() >= 0" [class.down]="weekGrowth() < 0">
              {{ formatGrowth(weekGrowth()) }} vs semaine précédente
            </span>
          </div>
          <div class="stat card">
            <mat-icon>shopping_bag</mat-icon>
            <span class="label">Panier moyen</span>
            <strong>{{ formatMoney(monthKpis().averageBasket) }}</strong>
            <span class="hint">30 derniers jours</span>
          </div>
          <div class="stat card">
            <mat-icon>schedule</mat-icon>
            <span class="label">Temps moyen de remise</span>
            <strong>{{ seller()!.avgHandoverMinutes }} min</strong>
            <span class="hint">du scan à la remise</span>
          </div>
        </div>

        <section class="card chart-card">
          <h2>Chiffre d'affaires généré (30 jours)</h2>
          <div class="chart-wrap">
            <canvas baseChart [type]="'line'" [data]="areaChartData" [options]="areaChartOptions"></canvas>
          </div>
        </section>

        <div class="bottom-grid">
          <section class="card">
            <h2>Objectif mensuel</h2>
            <p class="target-line">
              <mat-icon>flag</mat-icon>
              {{ monthKpis().transactions }} / {{ seller()!.monthlyTarget }} ventes
            </p>
            <div class="progress">
              <div class="bar" [style.width.%]="targetProgress()"></div>
            </div>
            <p class="hint">{{ targetProgress() | number:'1.0-0' }} % de l'objectif atteint</p>
            <div class="rating-block">
              <p class="sub">Note moyenne reçue</p>
              <div class="stars">
                @for (s of [1,2,3,4,5]; track s) {
                  <mat-icon [class.filled]="s <= Math.round(seller()!.rating)">star</mat-icon>
                }
                <span>{{ seller()!.rating.toFixed(1) }} ({{ seller()!.ratingCount }})</span>
              </div>
            </div>
          </section>

          <section class="card ranking">
            <h2>Classement de la boutique</h2>
            <ol>
              @for (row of teamRanking(); track row.seller.id; let i = $index) {
                <li>
                  <span class="rank">{{ i + 1 }}</span>
                  <span class="avatar">{{ initials(row.seller.firstName + ' ' + row.seller.lastName) }}</span>
                  <div class="info">
                    <p>
                      {{ row.seller.firstName }} {{ row.seller.lastName }}
                      @if (row.seller.id === seller()!.id) { <span class="you">Vous</span> }
                    </p>
                    <span class="pos">{{ row.seller.position }}</span>
                  </div>
                  @if (i === 0) { <mat-icon class="award">emoji_events</mat-icon> }
                  <span class="rev">{{ formatMoney(row.revenue) }}</span>
                </li>
              }
            </ol>
          </section>
        </div>

        <section class="card">
          <h2>Derniers avis clients</h2>
          @if (reviews().length) {
            <ul class="reviews">
              @for (order of reviews(); track order.id) {
                <li>
                  <div class="review-head">
                    <strong>{{ order.customerName }}</strong>
                    <span class="stars sm">
                      @for (s of [1,2,3,4,5]; track s) {
                        <mat-icon [class.filled]="s <= (order.sellerRating ?? 0)">star</mat-icon>
                      }
                    </span>
                  </div>
                  @if (order.ratingComment) {
                    <p>{{ order.ratingComment }}</p>
                  }
                </li>
              }
            </ul>
          } @else {
            <p class="empty-reviews"><mat-icon>star</mat-icon> Aucun avis pour le moment : les clients notent après chaque retrait.</p>
          }
        </section>
      } @else {
        <p class="empty">Profil vendeur introuvable. Reconnectez-vous avec un compte vendeur démo.</p>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 64rem; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; padding-bottom: 24px; }
    .empty { padding: 24px; text-align: center; color: rgb(var(--muted)); font-size: 14px; }
    h1 { margin: 0; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em; }
    header p { margin: 4px 0 0; font-size: 14px; color: rgb(var(--muted)); }
    .stat { padding: 16px; display: flex; flex-direction: column; gap: 4px; }
    .stat mat-icon { color: rgb(var(--accent)); font-size: 20px; width: 20px; height: 20px; }
    .stat .label { font-size: 12px; color: rgb(var(--muted)); }
    .stat strong { font-size: 1.25rem; }
    .stat .hint { font-size: 12px; color: rgb(var(--muted)); }
    .stat .hint.delta.up { color: #059669; }
    .stat .hint.delta.down { color: #dc2626; }
    .chart-card, section.card { padding: 16px; }
    section.card h2 { margin: 0 0 12px; font-size: 1rem; font-weight: 600; }
    .chart-wrap { height: 260px; }
    .bottom-grid { display: grid; gap: 20px; }
    @media (min-width: 1024px) { .bottom-grid { grid-template-columns: 1fr 2fr; } }
    .target-line { display: flex; align-items: center; gap: 8px; font-size: 14px; margin: 0; }
    .target-line mat-icon { font-size: 18px; width: 18px; height: 18px; color: rgb(var(--accent)); }
    .progress { height: 12px; border-radius: 999px; background: rgb(var(--surface-2)); margin-top: 12px; overflow: hidden; }
    .progress .bar { height: 100%; background: rgb(var(--accent)); border-radius: 999px; transition: width 0.3s; }
    .rating-block { margin-top: 20px; }
    .rating-block .sub { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: rgb(var(--muted)); margin: 0 0 8px; }
    .stars { display: flex; align-items: center; gap: 2px; }
    .stars mat-icon { font-size: 18px; width: 18px; height: 18px; color: #d1d5db; }
    .stars mat-icon.filled { color: #fbbf24; }
    .stars span { margin-left: 8px; font-size: 13px; color: rgb(var(--muted)); }
    .ranking ol { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .ranking li {
      display: flex; align-items: center; gap: 12px; padding: 10px 12px;
      border: 1px solid rgb(var(--line)); border-radius: 8px;
    }
    .rank { width: 24px; font-size: 14px; font-weight: 600; color: rgb(var(--muted)); }
    .avatar {
      width: 32px; height: 32px; border-radius: 999px; background: rgba(var(--accent), 0.1);
      color: rgb(var(--accent)); font-size: 11px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .info { flex: 1; min-width: 0; }
    .info p { margin: 0; font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .you { font-size: 11px; padding: 2px 6px; border-radius: 999px; background: rgba(var(--accent), 0.15); color: rgb(var(--accent)); }
    .pos { font-size: 12px; color: rgb(var(--muted)); }
    .award { color: #f59e0b; font-size: 18px; width: 18px; height: 18px; }
    .rev { font-size: 14px; font-weight: 600; flex-shrink: 0; }
    .reviews { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
    .reviews li { padding: 12px; border: 1px solid rgb(var(--line)); border-radius: 8px; }
    .review-head { display: flex; justify-content: space-between; align-items: center; }
    .reviews p { margin: 8px 0 0; font-size: 14px; color: rgb(var(--muted)); }
    .stars.sm mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .empty-reviews { display: flex; align-items: center; gap: 8px; padding: 16px 0; font-size: 14px; color: rgb(var(--muted)); margin: 0; }
  `],
})
export class SellerPerformanceComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly orders = inject(OrderService);

  readonly formatMoney = formatMoney;
  readonly formatGrowth = formatGrowth;
  readonly initials = initials;
  readonly Math = Math;

  loading = signal(true);
  seller = signal<DemoSellerProfile | null>(null);
  sales = signal<SaleRecord[]>([]);
  allOrders = signal<Order[]>([]);

  areaChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  areaChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 0 } },
      y: { ticks: { callback: (v) => `${Math.round(Number(v) / 1000)}k` } },
    },
  };

  dayKpis = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return computeKpis(this.sales().filter((s) => s.date.slice(0, 10) === today));
  });

  weekKpis = computed(() =>
    computeKpis(this.sales().filter((s) => Date.now() - new Date(s.date).getTime() < 7 * 86400000)),
  );

  prevWeekKpis = computed(() =>
    computeKpis(
      this.sales().filter((s) => {
        const age = Date.now() - new Date(s.date).getTime();
        return age >= 7 * 86400000 && age < 14 * 86400000;
      }),
    ),
  );

  weekGrowth = computed(() => growth(this.weekKpis().revenue, this.prevWeekKpis().revenue));

  monthKpis = computed(() =>
    computeKpis(this.sales().filter((s) => Date.now() - new Date(s.date).getTime() < 30 * 86400000)),
  );

  targetProgress = computed(() => {
    const s = this.seller();
    if (!s?.monthlyTarget) return 0;
    return Math.min(100, (this.monthKpis().transactions / s.monthlyTarget) * 100);
  });

  teamRanking = computed(() => {
    const storeId = this.seller()?.storeId;
    if (!storeId) return [];
    return getStoreTeam(storeId)
      .map((member) => ({
        seller: member,
        revenue: this.sales()
          .filter((x) => x.sellerId === member.id)
          .reduce((a, x) => a + x.revenue, 0),
      }))
      .sort((a, b) => b.revenue - a.revenue);
  });

  reviews = computed(() => {
    const sellerId = this.seller()?.id;
    return this.allOrders()
      .filter((o) => o.sellerId === sellerId && o.sellerRating)
      .sort((a, b) => new Date(b.redeemedAt ?? b.createdAt).getTime() - new Date(a.redeemedAt ?? a.createdAt).getTime())
      .slice(0, 5);
  });

  ngOnInit(): void {
    const user = this.auth.user();
    if (!user) {
      this.loading.set(false);
      return;
    }
    const seller = getSellerByUserId(user.id);
    if (!seller) {
      this.loading.set(false);
      return;
    }
    this.seller.set(seller);

    this.orders.getOrders({ storeId: seller.storeId }).subscribe({
      next: (res) => {
        const orders = res.data ?? [];
        this.allOrders.set(orders);
        const sales = enrichDemoSales(orders, seller.id, seller.storeId);
        this.sales.set(sales);
        this.updateChart(sales);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private updateChart(sales: SaleRecord[]): void {
    const cutoff = Date.now() - 30 * 86400000;
    const recent = sales.filter((s) => new Date(s.date).getTime() >= cutoff);
    const series = groupByDay(recent);
    this.areaChartData = {
      labels: series.map((p) => p.label),
      datasets: [{
        data: series.map((p) => p.revenue),
        borderColor: 'rgb(5, 150, 105)',
        backgroundColor: 'rgba(5, 150, 105, 0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 0,
      }],
    };
  }
}
