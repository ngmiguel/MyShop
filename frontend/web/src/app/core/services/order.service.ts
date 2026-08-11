import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { SessionService } from './session.service';
import { AuthService } from './auth.service';
import { Cart, Order, PaginatedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly api = inject(ApiService);
  private readonly session = inject(SessionService);
  private readonly auth = inject(AuthService);

  private cartQuery(): Record<string, string> {
    const user = this.auth.user();
    if (user) return { userId: user.id };
    return { sessionId: this.session.getSessionId() };
  }

  getCart(): Observable<Cart> {
    return this.api.get<Cart>('/orders/cart', this.cartQuery());
  }

  addToCart(productId: string, quantity = 1): Observable<Cart> {
    return this.api.post<Cart>('/orders/cart/items', { productId, quantity }, this.cartQuery());
  }

  updateCartItem(productId: string, quantity: number): Observable<Cart> {
    return this.api.patch<Cart>('/orders/cart/items', { productId, quantity }, this.cartQuery());
  }

  removeFromCart(productId: string): Observable<Cart> {
    return this.api.delete<Cart>('/orders/cart/items', { productId }, this.cartQuery());
  }

  clearCart(): Observable<void> {
    return this.api.delete<void>('/orders/cart', undefined, this.cartQuery());
  }

  applyPromo(code: string): Observable<Cart> {
    return this.api.post<Cart>('/orders/cart/promo', { code }, this.cartQuery());
  }

  checkout(notes?: string): Observable<Order[]> {
    const payload: Record<string, string> = { ...this.cartQuery() };
    if (notes) payload['notes'] = notes;
    return this.api.post<Order[]>('/orders/orders/checkout', payload);
  }

  getOrders(params?: { storeId?: string; status?: string; userId?: string }): Observable<PaginatedResponse<Order>> {
    return this.api.get<PaginatedResponse<Order>>('/orders/orders', params);
  }

  getOrder(id: string): Observable<Order> {
    return this.api.get<Order>(`/orders/orders/${id}`);
  }

  redeemOrder(id: string): Observable<Order> {
    return this.api.post<Order>(`/orders/orders/${id}/redeem`, {});
  }

  rateOrder(id: string, rating: number, comment?: string): Observable<Order> {
    return this.api.post<Order>(`/orders/orders/${id}/rate`, { rating, comment });
  }

  cancelOrder(id: string): Observable<Order> {
    return this.api.post<Order>(`/orders/orders/${id}/cancel`, {});
  }
}
