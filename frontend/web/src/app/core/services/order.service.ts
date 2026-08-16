import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { SessionService } from './session.service';
import { AuthService } from './auth.service';
import { LocalOrderService } from './local-order.service';
import { DEMO_PRODUCTS } from '../data/demo-catalog';
import { Cart, Order, PaginatedResponse, PaymentMethod, Product } from '../models';

export interface CheckoutOptions {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod: PaymentMethod;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly api = inject(ApiService);
  private readonly session = inject(SessionService);
  private readonly auth = inject(AuthService);
  private readonly local = inject(LocalOrderService);

  private cartQuery(): Record<string, string> {
    const user = this.auth.user();
    if (user) return { userId: user.id };
    return { sessionId: this.session.getSessionId() };
  }

  private useLocal(): boolean {
    return this.auth.isDemoMode();
  }

  private orderFilters(params?: { storeId?: string; status?: string; userId?: string; sessionId?: string }) {
    if (params?.storeId) {
      return { ...params };
    }
    const user = this.auth.user();
    return {
      ...params,
      userId: params?.userId ?? user?.id,
      sessionId: params?.sessionId ?? (!user ? this.session.getSessionId() : undefined),
    };
  }

  getCart(): Observable<Cart> {
    if (this.useLocal()) return of(this.local.getCart());
    return this.api.get<Cart>('/orders/cart', this.cartQuery()).pipe(
      catchError(() => of(this.local.getCart())),
    );
  }

  addToCart(productId: string, quantity = 1, product?: Product): Observable<Cart> {
    const resolved = product ?? DEMO_PRODUCTS.find((p) => p.id === productId);
    if (this.useLocal()) {
      if (!resolved) return throwError(() => new Error('Produit introuvable'));
      return of(this.local.addToCart(resolved, quantity));
    }
    return this.api.post<Cart>('/orders/cart/items', { productId, quantity }, this.cartQuery()).pipe(
      catchError(() => {
        if (!resolved) return throwError(() => new Error('Produit introuvable'));
        return of(this.local.addToCart(resolved, quantity));
      }),
    );
  }

  updateCartItem(productId: string, quantity: number): Observable<Cart> {
    if (this.useLocal()) return of(this.local.updateCartItem(productId, quantity));
    return this.api.patch<Cart>('/orders/cart/items', { productId, quantity }, this.cartQuery()).pipe(
      catchError(() => of(this.local.updateCartItem(productId, quantity))),
    );
  }

  removeFromCart(productId: string): Observable<Cart> {
    if (this.useLocal()) return of(this.local.removeFromCart(productId));
    return this.api.delete<Cart>('/orders/cart/items', { productId }, this.cartQuery()).pipe(
      catchError(() => of(this.local.removeFromCart(productId))),
    );
  }

  clearCart(): Observable<void> {
    if (this.useLocal()) {
      this.local.clearCart();
      return of(undefined);
    }
    return this.api.delete<void>('/orders/cart', undefined, this.cartQuery()).pipe(
      catchError(() => {
        this.local.clearCart();
        return of(undefined);
      }),
    );
  }

  applyPromo(code: string): Observable<Cart> {
    if (this.useLocal()) {
      try {
        return of(this.local.applyPromo(code));
      } catch {
        return throwError(() => new Error('Code promo invalide'));
      }
    }
    return this.api.post<Cart>('/orders/cart/promo', { code }, this.cartQuery()).pipe(
      catchError(() => {
        try {
          return of(this.local.applyPromo(code));
        } catch {
          return throwError(() => new Error('Code promo invalide'));
        }
      }),
    );
  }

  clearPromo(): Observable<Cart> {
    if (this.useLocal()) return of(this.local.clearPromo());
    return this.api.delete<Cart>('/orders/cart/promo', undefined, this.cartQuery()).pipe(
      catchError(() => of(this.local.clearPromo())),
    );
  }

  clearStore(storeId: string): Observable<Cart> {
    if (this.useLocal()) return of(this.local.clearStore(storeId));
    return this.api.delete<Cart>('/orders/cart/store', { storeId }, this.cartQuery()).pipe(
      catchError(() => of(this.local.clearStore(storeId))),
    );
  }

  checkout(opts?: CheckoutOptions): Observable<Order[]> {
    if (this.useLocal() || opts) {
      const options = opts ?? {
        customerName: 'Client Demo',
        customerPhone: '0700000000',
        paymentMethod: 'mobile_money' as PaymentMethod,
      };
      return of(this.local.checkout(options));
    }
    const payload: Record<string, string> = { ...this.cartQuery() };
    return this.api.post<Order[]>('/orders/orders/checkout', payload).pipe(
      catchError(() => of(this.local.checkout({
        customerName: 'Client',
        customerPhone: '0700000000',
        paymentMethod: 'mobile_money',
      }))),
    );
  }

  getOrders(params?: { storeId?: string; status?: string; userId?: string }): Observable<PaginatedResponse<Order>> {
    const filters = this.orderFilters(params);
    if (this.useLocal()) {
      const data = this.local.getOrders(filters);
      return of({ data, total: data.length, page: 1, limit: data.length, totalPages: 1 });
    }
    return this.api.get<PaginatedResponse<Order>>('/orders/orders', params).pipe(
      catchError(() => {
        const data = this.local.getOrders(filters);
        return of({ data, total: data.length, page: 1, limit: data.length, totalPages: 1 });
      }),
    );
  }

  getOrder(id: string): Observable<Order> {
    if (this.useLocal()) {
      const order = this.local.getOrder(id);
      if (!order) return throwError(() => new Error('Introuvable'));
      return of(order);
    }
    return this.api.get<Order>(`/orders/orders/${id}`).pipe(
      catchError(() => {
        const order = this.local.getOrder(id);
        if (!order) return throwError(() => new Error('Introuvable'));
        return of(order);
      }),
    );
  }

  redeemOrder(id: string): Observable<Order> {
    const sellerId = this.auth.user()?.id;
    if (this.useLocal()) return of(this.local.redeemOrder(id, sellerId));
    return this.api.post<Order>(`/orders/orders/${id}/redeem`, {}).pipe(
      catchError(() => of(this.local.redeemOrder(id, sellerId))),
    );
  }

  redeemByCode(raw: string, storeId?: string): Observable<Order> {
    const sellerId = this.auth.user()?.id;
    if (this.useLocal()) return of(this.local.redeemByReference(raw, storeId, sellerId));
    return this.redeemOrder(raw).pipe(
      catchError(() => of(this.local.redeemByReference(raw, storeId, sellerId))),
    );
  }

  rateOrder(id: string, rating: number, comment?: string): Observable<Order> {
    if (this.useLocal()) return of(this.local.rateOrder(id, rating, comment));
    return this.api.post<Order>(`/orders/orders/${id}/rate`, { rating, comment }).pipe(
      catchError(() => of(this.local.rateOrder(id, rating, comment))),
    );
  }

  cancelOrder(id: string): Observable<Order> {
    if (this.useLocal()) {
      try {
        return of(this.local.cancelOrder(id));
      } catch (e) {
        return throwError(() => e);
      }
    }
    return this.api.post<Order>(`/orders/orders/${id}/cancel`, {}).pipe(
      catchError(() => {
        try {
          return of(this.local.cancelOrder(id));
        } catch (e) {
          return throwError(() => e);
        }
      }),
    );
  }
}
