import { CartItem, Order, PaymentMethod } from '../models';
import { DEMO_PRODUCTS } from './demo-catalog';
import { DEMO_STORES } from './demo-stores';
import { makeReference } from '../utils/qr.util';

import { groupTax } from '../utils/cart.util';

const NAMES = ['Clarisse Ateba', 'Junior Mbappe', 'Sandrine Eyenga', 'Paul Nkodo', 'Lydie Ngo', 'Armand Fochive', 'Bertine Sama', 'Hugues Manga'];
const METHODS: PaymentMethod[] = ['mobile_money', 'card', 'transfer', 'cash'];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function buildItems(storeId: string, seed: number): CartItem[] {
  const pool = DEMO_PRODUCTS.filter((p) => p.storeId === storeId);
  if (!pool.length) {
    const fallback = DEMO_PRODUCTS.filter((_, i) => i % 3 === seed % 3).slice(0, 2);
    return fallback.map((p, i) => ({
      productId: p.id,
      quantity: 1 + (i % 2),
      product: p,
      unitPrice: p.price,
      lineTotal: p.price * (1 + (i % 2)),
    }));
  }
  const count = 1 + (seed % 3);
  const items: CartItem[] = [];
  for (let i = 0; i < count; i++) {
    const p = pick(pool, seed + i * 7);
    const qty = 1 + ((seed + i) % 2);
    items.push({
      productId: p.id,
      quantity: qty,
      product: p,
      unitPrice: p.price,
      lineTotal: p.price * qty,
    });
  }
  return items;
}

function makeOrder(index: number, storeId: string, status: Order['status'], daysAgo: number): Order {
  const store = DEMO_STORES.find((s) => s.id === storeId) ?? DEMO_STORES[0];
  const items = buildItems(storeId, index);
  const subtotal = items.reduce((a, i) => a + (i.unitPrice ?? 0) * i.quantity, 0);
  const discount = index % 3 === 0 ? Math.round(subtotal * 0.08) : index % 5 === 0 ? Math.round(subtotal * 0.05) : 0;
  const tax = groupTax(subtotal - discount, storeId);
  const total = subtotal - discount + tax;
  const ref = makeReference();
  const createdAt = new Date(Date.now() - daysAgo * 86400000 - (index % 12) * 3600000);
  const expiresAt = new Date(createdAt.getTime() + 86400000);

  return {
    id: `ord-seed-${index}`,
    orderNumber: ref,
    reference: ref,
    pickupCode: ref,
    storeId,
    storeName: store.name,
    status,
    items,
    subtotal,
    discount,
    tax,
    total,
    currency: 'XOF',
    paymentMethod: pick(METHODS, index),
    customerName: pick(NAMES, index),
    customerPhone: `+237 6${70000000 + (index * 1337) % 29999999}`,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    redeemedAt: status === 'redeemed' || status === 'rated'
      ? new Date(createdAt.getTime() + 7200000).toISOString()
      : undefined,
    sellerRating: status === 'rated' ? 4 + (index % 2) : undefined,
  };
}

/** Historique d'achats démo pour prévisualiser Dépenses, codes, etc. */
export function buildDemoSeedOrders(sessionId?: string): Order[] {
  const stores = DEMO_STORES.slice(0, 8);
  const orders: Order[] = [];
  let idx = 0;
  const daySpread = [2, 5, 8, 12, 18, 25, 35, 48, 60, 75, 90, 120, 150, 200, 280, 320];

  stores.forEach((store, si) => {
    daySpread.forEach((days, di) => {
      if ((si + di) % 3 === 0) return;
      const status: Order['status'] =
        days < 10 && si % 2 === 0 ? 'pending' :
        di % 7 === 0 ? 'rated' :
        'redeemed';
      const order = makeOrder(idx++, store.id, status, days);
      if (sessionId) order.sessionId = sessionId;
      orders.push(order);
    });
  });

  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

const SELLER_QUEUE_STORES: Array<{ storeId: string; sellerId: string }> = [
  { storeId: 'demo-store-1', sellerId: 'demo-seller-1' },
  { storeId: 'demo-store-2', sellerId: 'demo-seller-2' },
];

const REVIEW_COMMENTS = [
  'Retrait très rapide, merci !',
  'Accueil chaleureux et conseils utiles.',
  'Parfait, commande prête à l\'heure.',
  'Service impeccable comme d\'habitude.',
  'Un peu d\'attente mais vendeur très pro.',
];

function makePickupOrder(
  id: string,
  storeId: string,
  status: Order['status'],
  minutesAgo: number,
  redeemedBy?: string,
  opts?: { redeemedAt?: string; sellerRating?: number; ratingComment?: string },
): Order {
  const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const store = DEMO_STORES.find((s) => s.id === storeId) ?? DEMO_STORES[0];
  const items = buildItems(storeId, seed);
  const subtotal = items.reduce((a, i) => a + (i.unitPrice ?? 0) * i.quantity, 0);
  const discount = seed % 4 === 0 ? Math.round(subtotal * 0.05) : 0;
  const tax = groupTax(subtotal - discount, storeId);
  const total = subtotal - discount + tax;
  const ref = makeReference();
  const createdAt = new Date(Date.now() - minutesAgo * 60000);
  const expiresAt = status === 'expired'
    ? new Date(Date.now() - 3600000)
    : new Date(createdAt.getTime() + 86400000);
  const isDone = status === 'redeemed' || status === 'rated';
  const redeemedAt = opts?.redeemedAt
    ?? (isDone ? new Date(createdAt.getTime() + 45 * 60000).toISOString() : undefined);

  return {
    id,
    orderNumber: ref,
    reference: ref,
    pickupCode: ref,
    storeId,
    storeName: store.name,
    status,
    items,
    subtotal,
    discount,
    tax,
    total,
    currency: 'XOF',
    paymentMethod: pick(METHODS, seed),
    customerName: pick(NAMES, seed),
    customerPhone: `+237 6${70000000 + (seed * 1337) % 29999999}`,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    redeemedAt,
    sellerId: isDone ? redeemedBy : undefined,
    sellerRating: opts?.sellerRating ?? (status === 'rated' ? 4 + (seed % 2) : undefined),
    ratingComment: opts?.ratingComment ?? (status === 'rated' ? pick(REVIEW_COMMENTS, seed) : undefined),
  };
}

/** Commandes récentes pour tester la file de retrait vendeur (par boutique). */
export function buildSellerPickupOrders(): Order[] {
  const orders: Order[] = [];
  let idx = 0;
  const today = new Date();
  today.setHours(10, 30, 0, 0);

  for (const { storeId, sellerId } of SELLER_QUEUE_STORES) {
    [22, 48, 95, 160].forEach((mins) => {
      orders.push(makePickupOrder(`ord-queue-${idx++}`, storeId, 'pending', mins));
    });

    // Retraits du jour pour le journal de caisse
    [90, 180, 320].forEach((mins, i) => {
      const redeemedAt = new Date(today.getTime() - i * 7200000).toISOString();
      orders.push(makePickupOrder(`ord-cash-${idx++}`, storeId, 'redeemed', mins, sellerId, { redeemedAt }));
    });

    // Historique performance + avis
    [60 * 8, 60 * 36, 60 * 72, 60 * 120, 60 * 200].forEach((mins, i) => {
      const status: Order['status'] = i % 2 === 0 ? 'rated' : 'redeemed';
      orders.push(makePickupOrder(`ord-queue-${idx++}`, storeId, status, mins, sellerId));
    });

    orders.push(makePickupOrder(`ord-queue-${idx++}`, storeId, 'expired', 60 * 28, sellerId));
    orders.push(makePickupOrder(`ord-queue-${idx++}`, storeId, 'cancelled', 60 * 52, sellerId));
  }

  return orders;
}

export const DEMO_SEED_ORDERS_VERSION = 'v5';
