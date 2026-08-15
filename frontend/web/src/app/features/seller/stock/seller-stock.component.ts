import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { OrderService } from '../../../core/services/order.service';
import { PaymentMethod, Product } from '../../../core/models';
import { categoryLabel } from '../../../core/data/categories';
import { getSellerByUserId } from '../../../core/data/demo-sellers';
import { storeById } from '../../../core/utils/cart.util';
import { formatMoney } from '../../../core/utils/format.util';
import { SegmentedTabsComponent } from '../../../shared/components/segmented-tabs/segmented-tabs.component';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  mobile_money: 'Mobile Money',
  card: 'Carte bancaire',
  cash: 'Espèces',
  transfer: 'Virement',
};

@Component({
  selector: 'app-seller-stock',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule, MatSnackBarModule, SegmentedTabsComponent],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>Stock & caisse</h1>
          <p>{{ storeName() }}</p>
        </div>
        <app-segmented-tabs
          [items]="tabs"
          [value]="tab()"
          (valueChange)="tab.set($event)"
        />
      </header>

      @if (tab() === 'stock') {
        <div class="stat-grid cols-3">
          <div class="stat card">
            <mat-icon>inventory_2</mat-icon>
            <span class="label">Références</span>
            <strong>{{ stock().length }}</strong>
          </div>
          <div class="stat card">
            <mat-icon>warning_amber</mat-icon>
            <span class="label">En rupture</span>
            <strong class="warn">{{ outOfStock() }}</strong>
          </div>
          <div class="stat card">
            <span class="label">Stock faible (≤ 5)</span>
            <strong>{{ lowStock() }}</strong>
          </div>
        </div>

        <div class="search-wrap">
          <mat-icon>search</mat-icon>
          <input [(ngModel)]="search" placeholder="Rechercher un article…" aria-label="Rechercher un article" />
        </div>

        <div class="table-card card">
          <table>
            <thead>
              <tr>
                <th>Article</th>
                <th>Catégorie</th>
                <th class="num">Prix</th>
                <th class="num">Stock</th>
                <th class="num">Signalement</th>
              </tr>
            </thead>
            <tbody>
              @for (p of stock(); track p.id) {
                <tr>
                  <td>{{ p.name }}</td>
                  <td class="muted">{{ categoryLabel(p.categoryId ?? '') }}</td>
                  <td class="num">{{ formatMoney(p.price) }}</td>
                  <td class="num">
                    <span class="badge" [class]="stockTone(p.stock)">{{ p.stock }}</span>
                  </td>
                  <td class="num">
                    <button type="button" class="ghost-btn" (click)="reportGap(p)">Signaler un écart</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="stat-grid cols-3">
          <div class="stat card">
            <span class="label">Encaissé aujourd'hui</span>
            <strong>{{ formatMoney(cashTotal()) }}</strong>
            <span class="hint">{{ todayOrders().length }} retraits</span>
          </div>
          <div class="stat card">
            <span class="label">Retraits traités</span>
            <strong>{{ todayOrders().length }}</strong>
          </div>
          <div class="stat card">
            <span class="label">Panier moyen du jour</span>
            <strong>{{ formatMoney(averageBasket()) }}</strong>
          </div>
        </div>

        <section class="card panel">
          <h2>Répartition par moyen de paiement</h2>
          @if (byMethod().length) {
            <ul class="method-list">
              @for (row of byMethod(); track row.method) {
                <li>
                  <span>{{ row.label }}</span>
                  <strong>{{ formatMoney(row.amount) }}</strong>
                </li>
              }
            </ul>
          } @else {
            <p class="empty">Aucun encaissement enregistré aujourd'hui.</p>
          }
        </section>

        <section class="card panel">
          <h2>Clôture de service</h2>
          <p class="desc">La clôture fige le journal du poste et transmet le récapitulatif au manager de {{ storeName() }}.</p>
          <button mat-flat-button color="primary" (click)="closeService()">
            <mat-icon>lock</mat-icon>
            Clôturer le service
          </button>
        </section>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 64rem; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; padding-bottom: 24px; }
    .page-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 12px; }
    h1 { margin: 0; font-size: 1.5rem; font-weight: 600; }
    .page-head p { margin: 4px 0 0; font-size: 14px; color: rgb(var(--muted)); }
    .stat-grid.cols-3 { display: grid; gap: 16px; }
    @media (min-width: 640px) { .stat-grid.cols-3 { grid-template-columns: repeat(3, 1fr); } }
    .stat { padding: 16px; display: flex; flex-direction: column; gap: 4px; }
    .stat mat-icon { color: rgb(var(--accent)); font-size: 20px; width: 20px; height: 20px; }
    .stat .label { font-size: 12px; color: rgb(var(--muted)); }
    .stat strong { font-size: 1.125rem; }
    .stat strong.warn { color: #d97706; }
    .stat .hint { font-size: 12px; color: rgb(var(--muted)); }
    .search-wrap { position: relative; max-width: 24rem; }
    .search-wrap mat-icon {
      position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
      font-size: 18px; width: 18px; height: 18px; color: rgb(var(--muted));
    }
    .search-wrap input {
      width: 100%; padding: 10px 14px 10px 40px; border-radius: 999px;
      border: 1px solid rgb(var(--line)); background: rgb(var(--surface));
    }
    .table-card { overflow-x: auto; padding: 0; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid rgb(var(--line)); }
    th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: rgb(var(--muted)); }
    td.num, th.num { text-align: right; }
    td.muted { color: rgb(var(--muted)); }
    .badge {
      display: inline-block; min-width: 28px; padding: 2px 8px; border-radius: 999px;
      font-size: 12px; font-weight: 600; text-align: center;
    }
    .badge.ok { background: rgba(5,150,105,0.1); color: #059669; }
    .badge.warn { background: rgba(217,119,6,0.1); color: #d97706; }
    .badge.danger { background: rgba(220,38,38,0.1); color: #dc2626; }
    .ghost-btn {
      border: none; background: transparent; color: rgb(var(--accent));
      font-size: 13px; font-weight: 500; cursor: pointer; padding: 4px 8px; border-radius: 6px;
    }
    .ghost-btn:hover { background: rgba(var(--accent), 0.08); }
    .panel { padding: 16px; }
    .panel h2 { margin: 0 0 12px; font-size: 1rem; font-weight: 600; }
    .panel .desc { margin: 0 0 12px; font-size: 14px; color: rgb(var(--muted)); }
    .method-list { list-style: none; margin: 0; padding: 0; }
    .method-list li {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 0; border-bottom: 1px solid rgb(var(--line)); font-size: 14px;
    }
    .method-list li:last-child { border-bottom: none; }
    .method-list span { color: rgb(var(--muted)); }
    .empty { margin: 0; padding: 8px 0; font-size: 14px; color: rgb(var(--muted)); }
    button mat-icon { margin-right: 6px; }
  `],
})
export class SellerStockComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly catalog = inject(CatalogService);
  private readonly orders = inject(OrderService);
  private readonly snack = inject(MatSnackBar);

  readonly formatMoney = formatMoney;
  readonly categoryLabel = categoryLabel;

  readonly tabs = [
    { id: 'stock', label: 'Stock' },
    { id: 'caisse', label: 'Journal de caisse' },
  ];

  tab = signal('stock');
  storeId = signal('');
  storeName = signal('Boutique');
  products = signal<Product[]>([]);
  todayOrders = signal<Array<{ total: number; paymentMethod?: PaymentMethod }>>([]);
  search = '';

  stock = computed(() => {
    const q = this.search.trim().toLowerCase();
    return this.products()
      .filter((p) => p.storeId === this.storeId())
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => a.stock - b.stock);
  });

  outOfStock = computed(() => this.stock().filter((p) => p.stock === 0).length);
  lowStock = computed(() => this.stock().filter((p) => p.stock > 0 && p.stock <= 5).length);
  cashTotal = computed(() => this.todayOrders().reduce((a, o) => a + o.total, 0));
  averageBasket = computed(() => {
    const n = this.todayOrders().length;
    return n ? this.cashTotal() / n : 0;
  });

  byMethod = computed(() => {
    const map = new Map<PaymentMethod, number>();
    for (const o of this.todayOrders()) {
      const method = o.paymentMethod ?? 'mobile_money';
      map.set(method, (map.get(method) ?? 0) + o.total);
    }
    return [...map.entries()].map(([method, amount]) => ({
      method,
      amount,
      label: METHOD_LABELS[method],
    }));
  });

  ngOnInit(): void {
    const user = this.auth.user();
    const seller = user ? getSellerByUserId(user.id) : undefined;
    const storeId = seller?.storeId ?? user?.storeId ?? '';
    this.storeId.set(storeId);
    this.storeName.set(storeById(storeId)?.name ?? 'Boutique');

    this.catalog.getProducts({ limit: 200 }).subscribe({
      next: (res) => this.products.set(res.data ?? []),
      error: () => this.products.set([]),
    });

    if (storeId) {
      this.orders.getOrders({ storeId }).subscribe({
        next: (res) => {
          const today = new Date().toDateString();
          const list = (res.data ?? []).filter(
            (o) =>
              o.status === 'redeemed' &&
              o.redeemedAt &&
              new Date(o.redeemedAt).toDateString() === today,
          );
          this.todayOrders.set(list);
        },
      });
    }
  }

  stockTone(stock: number): string {
    if (stock === 0) return 'danger';
    if (stock <= 5) return 'warn';
    return 'ok';
  }

  reportGap(product: Product): void {
    this.snack.open(`Écart signalé au manager — ${product.name}`, 'OK', { duration: 3000 });
  }

  closeService(): void {
    this.snack.open(
      `Service clôturé — ${formatMoney(this.cashTotal())} encaissés sur ${this.todayOrders().length} retraits`,
      'OK',
      { duration: 4000 },
    );
  }
}
