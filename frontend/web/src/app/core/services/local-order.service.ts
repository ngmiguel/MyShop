import { Injectable, inject } from '@angular/core';
import { Cart, CartItem, Order, PaymentMethod, Product } from '../models';
import { DEMO_PRODUCTS } from '../data/demo-catalog';
import { buildDemoSeedOrders, buildSellerPickupOrders, DEMO_SEED_ORDERS_VERSION } from '../data/demo-orders';
import { evaluateScan, makeReference } from '../utils/qr.util';
import {
  getPromoRate,
  groupTax,
  promoDiscount,
  PROMO_CODES,
  QR_EXPIRY_HOURS,
} from '../utils/cart.util';
import { SessionService } from './session.service';
import { AuthService } from './auth.service';

const CART_KEY = 'boutika_local_cart';
const ORDERS_KEY = 'boutika_local_orders';
const SEED_FLAG = 'boutika_demo_orders_seed';

@Injectable({ providedIn: 'root' })
export class LocalOrderService {
  private readonly session = inject(SessionService);
  private readonly auth = inject(AuthService);

  getCart(): Cart {
    const raw = localStorage.getItem(CART_KEY);
    if (raw) {
      try {
        return this.enrichCart(JSON.parse(raw) as Cart);
      } catch {
        /* ignore */
      }
    }
    return this.emptyCart();
  }

  saveCart(cart: Cart): Cart {
    const enriched = this.enrichCart(cart);
    localStorage.setItem(CART_KEY, JSON.stringify(enriched));
    return enriched;
  }

  addToCart(product: Product, quantity = 1): Cart {
    const cart = this.getCart();
    const existing = cart.items.find((i) => i.productId === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({
        productId: product.id,
        quantity,
        product,
        unitPrice: product.price,
        lineTotal: product.price * quantity,
      });
    }
    return this.recalc(this.saveCart(cart));
  }

  updateCartItem(productId: string, quantity: number): Cart {
    const cart = this.getCart();
    const idx = cart.items.findIndex((i) => i.productId === productId);
    if (idx === -1) return cart;
    if (quantity <= 0) cart.items.splice(idx, 1);
    else cart.items[idx].quantity = quantity;
    return this.recalc(this.saveCart(cart));
  }

  removeFromCart(productId: string): Cart {
    const cart = this.getCart();
    cart.items = cart.items.filter((i) => i.productId !== productId);
    return this.recalc(this.saveCart(cart));
  }

  applyPromo(code: string): Cart {
    const cart = this.getCart();
    const normalized = code.trim().toUpperCase();
    if (!PROMO_CODES[normalized]) throw new Error('Invalid promo');
    cart.promoCode = normalized;
    return this.recalc(this.saveCart(cart));
  }

  clearPromo(): Cart {
    const cart = this.getCart();
    cart.promoCode = undefined;
    return this.recalc(this.saveCart(cart));
  }

  clearStore(storeId: string): Cart {
    const cart = this.getCart();
    cart.items = cart.items.filter((i) => (i.product?.storeId ?? 'demo-store-1') !== storeId);
    return this.recalc(this.saveCart(cart));
  }

  clearCart(): void {
    localStorage.removeItem(CART_KEY);
  }

  getOrders(filters?: { status?: string; storeId?: string; userId?: string; sessionId?: string }): Order[] {
    this.ensureSeedOrders();
    let orders = this.loadOrders();
    if (filters?.status) orders = orders.filter((o) => o.status === filters.status);
    if (filters?.storeId) orders = orders.filter((o) => o.storeId === filters.storeId);
    if (filters?.userId) orders = orders.filter((o) => o.userId === filters.userId);
    if (filters?.sessionId) orders = orders.filter((o) => o.sessionId === filters.sessionId);
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getOrder(id: string): Order | undefined {
    return this.loadOrders().find((o) => o.id === id);
  }

  checkout(opts: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    paymentMethod: PaymentMethod;
  }): Order[] {
    const cart = this.getCart();
    if (!cart.items.length) throw new Error('Panier vide');

    const byStore = new Map<string, CartItem[]>();
    for (const item of cart.items) {
      const storeId = item.product?.storeId ?? 'demo-store-1';
      const list = byStore.get(storeId) ?? [];
      list.push(item);
      byStore.set(storeId, list);
    }

    const user = this.auth.user();
    const sessionId = this.session.getSessionId();
    const created: Order[] = [];
    const promoRate = getPromoRate(cart.promoCode);

    for (const [storeId, items] of byStore) {
      const subtotal = items.reduce((s, i) => s + (i.unitPrice ?? i.product?.price ?? 0) * i.quantity, 0);
      const discount = promoDiscount(subtotal, promoRate);
      const tax = groupTax(subtotal, storeId);
      const total = subtotal + tax - discount;
      const ref = makeReference();
      const now = new Date();
      const expires = new Date(now.getTime() + QR_EXPIRY_HOURS * 3600000);

      const order: Order = {
        id: crypto.randomUUID(),
        orderNumber: ref,
        reference: ref,
        pickupCode: ref,
        storeId,
        storeName: items[0]?.product?.storeName ?? this.storeName(storeId),
        userId: user?.id,
        sessionId,
        status: 'pending',
        items: items.map((i) => ({
          ...i,
          lineTotal: (i.unitPrice ?? i.product?.price ?? 0) * i.quantity,
        })),
        subtotal,
        discount,
        tax,
        total,
        currency: 'XOF',
        createdAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        paymentMethod: opts.paymentMethod,
        customerName: opts.customerName,
        customerPhone: opts.customerPhone,
        customerEmail: opts.customerEmail,
      };
      created.push(order);
    }

    const all = [...this.loadOrders(), ...created];
    localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
    this.clearCart();
    return created;
  }

  redeemOrder(orderId: string, sellerId?: string): Order {
    const orders = this.loadOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new Error('Commande introuvable');
    orders[idx] = {
      ...orders[idx],
      status: 'redeemed',
      redeemedAt: new Date().toISOString(),
      sellerId,
    };
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return orders[idx];
  }

  redeemByReference(raw: string, storeId?: string, sellerId?: string): Order {
    const outcome = evaluateScan(raw, this.loadOrders(), storeId);
    if (outcome.status === 'unknown') throw new Error('Commande introuvable');
    if (outcome.status === 'other_store') throw new Error('Cette commande appartient a une autre boutique');
    if (outcome.status === 'already') throw new Error('Deja retire');
    if (outcome.status === 'expired') throw new Error('Code expire');
    return this.redeemOrder(outcome.order.id, sellerId);
  }

  resetDemoOrders(): void {
    localStorage.removeItem(SEED_FLAG);
    localStorage.removeItem(ORDERS_KEY);
    this.ensureSeedOrders();
  }

  rateOrder(orderId: string, rating: number, comment?: string): Order {
    const orders = this.loadOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new Error('Commande introuvable');
    orders[idx] = {
      ...orders[idx],
      sellerRating: rating,
      ratingComment: comment,
    };
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return orders[idx];
  }

  private ensureSeedOrders(): void {
    if (localStorage.getItem(SEED_FLAG) === DEMO_SEED_ORDERS_VERSION) return;
    const sessionId = this.session.getSessionId();
    const seeded = [
      ...buildDemoSeedOrders(sessionId),
      ...buildSellerPickupOrders(),
    ];
    const existing = this.loadOrders().filter(
      (o) => !o.id.startsWith('ord-seed-') && !o.id.startsWith('ord-queue-'),
    );
    localStorage.setItem(ORDERS_KEY, JSON.stringify([...seeded, ...existing]));
    localStorage.setItem(SEED_FLAG, DEMO_SEED_ORDERS_VERSION);
  }

  private loadOrders(): Order[] {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Order[];
    } catch {
      return [];
    }
  }

  private emptyCart(): Cart {
    return {
      id: 'local-cart',
      sessionId: this.session.getSessionId(),
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
    };
  }

  private enrichCart(cart: Cart): Cart {
    cart.items = cart.items.map((item) => {
      const product = item.product ?? DEMO_PRODUCTS.find((p) => p.id === item.productId);
      const unitPrice = item.unitPrice ?? product?.price ?? 0;
      return { ...item, product, unitPrice, lineTotal: unitPrice * item.quantity };
    });
    return this.recalc(cart);
  }

  private recalc(cart: Cart): Cart {
    cart.subtotal = cart.items.reduce((s, i) => s + (i.unitPrice ?? 0) * i.quantity, 0);
    cart.discount = cart.promoCode
      ? promoDiscount(cart.subtotal, getPromoRate(cart.promoCode))
      : 0;
    cart.total = cart.subtotal - cart.discount;
    return cart;
  }

  private storeName(storeId: string): string {
    const names: Record<string, string> = {
      'demo-store-1': 'Boutique Kofi',
      'demo-store-2': 'Atelier Aicha',
      'demo-store-3': 'Market Express',
    };
    return names[storeId] ?? 'Boutique';
  }
}
