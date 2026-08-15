import { PaymentMethod } from '../models';
import { DEMO_PRODUCTS } from './demo-catalog';
import { DEMO_MANAGER_STORES } from './demo-manager-stores';
import { DEMO_SELLERS } from './demo-sellers';
import { SaleRecord } from '../utils/analytics.util';

const CHANNELS = ['feed', 'search', 'store_page', 'recommendation'] as const;
const METHODS: PaymentMethod[] = ['mobile_money', 'card', 'cash', 'transfer'];

export const HISTORY_DAYS = 180;

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function intBetween(min: number, max: number, seed: number): number {
  return min + (seed % (max - min + 1));
}

/** Historique de ventes simulé sur 180 jours pour l'interface manager. */
export function buildDemoEnterpriseSales(): SaleRecord[] {
  const out: SaleRecord[] = [];
  const activeStores = DEMO_MANAGER_STORES.filter((s) => s.status === 'active');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let d = HISTORY_DAYS - 1; d >= 0; d -= 1) {
    const date = new Date(today.getTime() - d * 86400000);
    const dow = date.getDay();
    const weekendBoost = dow === 6 ? 1.45 : dow === 0 ? 0.55 : 1;
    const trend = 1 + (HISTORY_DAYS - d) / (HISTORY_DAYS * 2.4);
    const spike = d === 41 || d === 12 ? 2.6 : 1;
    const base = 26 * weekendBoost * trend * spike;
    const transactions = Math.max(4, Math.round(base + ((d * 17) % 10) - 5));

    for (let t = 0; t < transactions; t += 1) {
      const seed = d * 1000 + t;
      const store = pick(activeStores, seed);
      const storeProducts = DEMO_PRODUCTS.filter((p) => p.storeId === store.id);
      if (!storeProducts.length) continue;
      const product = pick(storeProducts, seed + 3);
      const storeSellers = DEMO_SELLERS.filter((s) => s.storeId === store.id && s.status === 'active');
      const seller = storeSellers.length ? pick(storeSellers, seed + 7) : DEMO_SELLERS[0];
      const quantity = intBetween(1, product.price > 200000 ? 1 : 4, seed + 11);
      const costUnit = Math.round((product.cost ?? product.price * 0.62));
      out.push({
        id: `sale-${d}-${t}`,
        date: date.toISOString(),
        storeId: store.id,
        sellerId: seller.id,
        categoryId: product.categoryId ?? 'services',
        productId: product.id,
        quantity,
        revenue: product.price * quantity,
        cost: costUnit * quantity,
        paymentMethod: pick(METHODS, seed + 13),
        customerId: `cu-${intBetween(1, 320, seed + 19)}`,
        hour: intBetween(8, 19, seed + 23),
        channel: pick([...CHANNELS], seed + 29),
      });
    }
  }
  return out;
}
