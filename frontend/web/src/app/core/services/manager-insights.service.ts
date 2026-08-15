import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { CATEGORIES } from '../data/categories';
import { SaleRecord } from '../utils/analytics.util';
import { ManagerDataService } from './manager-data.service';
import { Seller } from '../models';

@Injectable({ providedIn: 'root' })
export class ManagerInsightsService {
  private readonly data = inject(ManagerDataService);

  readonly period = signal('90');
  readonly storeFilter = signal('all');
  readonly categoryFilter = signal('all');
  readonly sellerFilter = signal('all');
  readonly channelFilter = signal('all');

  readonly stores = signal(this.data.getManagerStores());
  readonly sellers = signal<Seller[]>([]);

  readonly filteredSellers = computed(() => {
    const store = this.storeFilter();
    const list = this.sellers();
    return store === 'all' ? list : list.filter((s) => s.storeId === store);
  });

  readonly activeFilterCount = computed(() =>
    [this.storeFilter(), this.categoryFilter(), this.sellerFilter(), this.channelFilter()]
      .filter((v) => v !== 'all').length,
  );

  readonly categories = CATEGORIES;

  constructor() {
    effect(() => {
      const seller = this.sellerFilter();
      if (seller === 'all') return;
      const valid = this.filteredSellers().some((s) => s.id === seller);
      if (!valid) this.sellerFilter.set('all');
    });
  }

  loadSellers(): void {
    this.sellers.set(this.data.getSellers());
  }

  resetFilters(): void {
    this.storeFilter.set('all');
    this.categoryFilter.set('all');
    this.sellerFilter.set('all');
    this.channelFilter.set('all');
  }

  matchesFilters(s: SaleRecord): boolean {
    return (
      (this.storeFilter() === 'all' || s.storeId === this.storeFilter()) &&
      this.matchesCategory(s) &&
      (this.sellerFilter() === 'all' || s.sellerId === this.sellerFilter()) &&
      (this.channelFilter() === 'all' || s.channel === this.channelFilter())
    );
  }

  private matchesCategory(s: SaleRecord): boolean {
    const cat = this.categoryFilter();
    if (cat === 'all') return true;
    if (s.categoryId === cat) return true;
    const parent = CATEGORIES.find((c) => c.id === cat);
    if (parent?.subcategories.some((sub) => sub.id === s.categoryId)) return true;
    return false;
  }

  filterSales(sales: SaleRecord[], days?: number): SaleRecord[] {
    const periodDays = days ?? Number(this.period());
    const since = Date.now() - periodDays * 86400000;
    return sales.filter(
      (s) => new Date(s.date).getTime() >= since && this.matchesFilters(s),
    );
  }

  filterSalesAllTime(sales: SaleRecord[]): SaleRecord[] {
    return sales.filter((s) => this.matchesFilters(s));
  }

  storeName(id: string): string {
    return this.stores().find((s) => s.id === id)?.name ?? id;
  }

  sellerName(id: string): string {
    const s = this.sellers().find((x) => x.id === id);
    return s ? `${s.firstName} ${s.lastName}` : id;
  }
}
