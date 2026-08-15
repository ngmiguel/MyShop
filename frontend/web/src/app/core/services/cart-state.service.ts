import { Injectable, inject, signal } from '@angular/core';
import { OrderService } from './order.service';
import { LocalOrderService } from './local-order.service';
import { Cart } from '../models';

@Injectable({ providedIn: 'root' })
export class CartStateService {
  private readonly orders = inject(OrderService);
  private readonly local = inject(LocalOrderService);
  readonly cart = signal<Cart | null>(null);
  readonly count = signal(0);

  refresh(): void {
    this.orders.getCart().subscribe({
      next: (cart) => {
        this.cart.set(cart);
        const items = cart.items ?? [];
        this.count.set(items.reduce((s, i) => s + (i.quantity ?? 0), 0));
      },
      error: () => {
        const cart = this.local.getCart();
        this.cart.set(cart);
        this.count.set(cart.items.reduce((s, i) => s + i.quantity, 0));
      },
    });
  }
}
