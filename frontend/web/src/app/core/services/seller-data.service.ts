import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { DemoSellerProfile, getSellerByUserId } from '../data/demo-sellers';
import { Order } from '../models';
import { enrichDemoSales, SaleRecord } from '../utils/analytics.util';
import { storeById } from '../utils/cart.util';
import { AuthService } from './auth.service';
import { ManagerDataService } from './manager-data.service';
import { OrderService } from './order.service';

@Injectable({ providedIn: 'root' })
export class SellerDataService {
  private readonly auth = inject(AuthService);
  private readonly orders = inject(OrderService);
  private readonly manager = inject(ManagerDataService);

  readonly storeOrders = signal<Order[]>([]);
  readonly loading = signal(false);

  readonly seller = computed(() => {
    const userId = this.auth.user()?.id;
    return userId ? getSellerByUserId(userId) : undefined;
  });

  readonly storeId = computed(() => this.seller()?.storeId ?? this.auth.user()?.storeId);

  readonly storeName = computed(() => {
    const id = this.storeId();
    if (!id) return 'Boutique';
    return this.manager.getStore(id)?.name ?? storeById(id)?.name ?? 'Boutique';
  });

  readonly pendingOrders = computed(() =>
    this.storeOrders()
      .filter((o) => o.status === 'pending')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  );

  readonly pendingCount = computed(() => this.pendingOrders().length);

  readonly pendingTotal = computed(() =>
    this.pendingOrders().reduce((sum, o) => sum + o.total, 0),
  );

  readonly redeemedToday = computed(() => {
    const today = new Date().toDateString();
    return this.storeOrders().filter((o) => {
      if (o.status !== 'redeemed' && o.status !== 'rated') return false;
      const when = o.redeemedAt ?? o.createdAt;
      return new Date(when).toDateString() === today;
    }).length;
  });

  getSales(): SaleRecord[] {
    const storeId = this.storeId();
    const sellerId = this.seller()?.id;
    if (!storeId || !sellerId) return [];
    return enrichDemoSales(this.storeOrders(), sellerId, storeId);
  }

  refreshOrders(): Observable<{ data: Order[] }> {
    this.loading.set(true);
    const storeId = this.storeId();
    return this.orders.getOrders({ storeId }).pipe(
      tap({
        next: (res) => {
          this.storeOrders.set(res.data ?? []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      }),
    );
  }

  profile(): DemoSellerProfile | undefined {
    return this.seller();
  }
}
