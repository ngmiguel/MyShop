import { Order, PaymentMethod } from '../models';

export interface SaleRecord {
  id: string;
  sellerId: string;
  storeId: string;
  productId: string;
  customerId: string;
  date: string;
  hour: number;
  revenue: number;
  cost: number;
  quantity: number;
  categoryId?: string;
  channel?: string;
  paymentMethod?: PaymentMethod;
}

export interface DayPoint {
  date: string;
  label: string;
  revenue: number;
  cost: number;
  margin: number;
  transactions: number;
  moyenne?: number;
}

export interface Kpis {
  revenue: number;
  margin: number;
  marginRate: number;
  transactions: number;
  averageBasket: number;
  units: number;
  customers: number;
}

export function groupByDay(sales: SaleRecord[]): DayPoint[] {
  const map = new Map<string, DayPoint>();
  for (const s of sales) {
    const key = s.date.slice(0, 10);
    const existing = map.get(key);
    if (existing) {
      existing.revenue += s.revenue;
      existing.cost += s.cost;
      existing.margin += s.revenue - s.cost;
      existing.transactions += 1;
    } else {
      const d = new Date(s.date);
      map.set(key, {
        date: key,
        label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        revenue: s.revenue,
        cost: s.cost,
        margin: s.revenue - s.cost,
        transactions: 1,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function computeKpis(sales: SaleRecord[]): Kpis {
  const revenue = sales.reduce((a, s) => a + s.revenue, 0);
  const cost = sales.reduce((a, s) => a + s.cost, 0);
  const margin = revenue - cost;
  const transactions = sales.length;
  return {
    revenue,
    margin,
    marginRate: revenue ? (margin / revenue) * 100 : 0,
    transactions,
    averageBasket: transactions ? revenue / transactions : 0,
    units: sales.reduce((a, s) => a + s.quantity, 0),
    customers: new Set(sales.map((s) => s.customerId)).size,
  };
}

export function growth(current: number, previous: number): number {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function formatGrowth(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${Math.round(value)} %`;
}

export function groupSum(
  list: SaleRecord[],
  keyFn: (item: SaleRecord) => string,
  valueFn: (item: SaleRecord) => number,
): Array<{ key: string; value: number }> {
  const map = new Map<string, number>();
  for (const item of list) {
    const k = keyFn(item);
    map.set(k, (map.get(k) ?? 0) + valueFn(item));
  }
  return [...map.entries()].map(([key, value]) => ({ key, value }));
}

export function buildSalesFromOrders(orders: Order[]): SaleRecord[] {
  const sales: SaleRecord[] = [];
  for (const order of orders) {
    if (!['redeemed', 'rated'].includes(order.status)) continue;
    const date = order.redeemedAt ?? order.createdAt;
    const sellerId = order.sellerId ?? 'demo-seller-1';
    for (const item of order.items) {
      const unit = item.unitPrice ?? item.product?.price ?? 0;
      const cost = Math.round(unit * 0.62);
      sales.push({
        id: `${order.id}-${item.productId}`,
        sellerId,
        storeId: order.storeId,
        productId: item.productId,
        customerId: order.customerPhone ?? order.id,
        date,
        hour: new Date(date).getHours(),
        revenue: unit * item.quantity,
        cost: cost * item.quantity,
        quantity: item.quantity,
      });
    }
  }
  return sales;
}

/** Génère un historique démo si peu de ventes réelles. */
export function enrichDemoSales(
  orders: Order[],
  sellerId: string,
  storeId: string,
): SaleRecord[] {
  const fromOrders = buildSalesFromOrders(orders).filter((s) => s.storeId === storeId);
  const sellerSales = fromOrders.filter((s) => s.sellerId === sellerId);
  if (sellerSales.length >= 25 || fromOrders.length >= 25) {
    return sellerSales.length ? sellerSales : fromOrders;
  }

  const synthetic: SaleRecord[] = [];
  const seed = sellerId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let day = 29; day >= 0; day--) {
    const count = 1 + ((seed + day) % 4);
    for (let i = 0; i < count; i++) {
      const d = new Date(Date.now() - day * 86400000 - i * 3600000);
      const revenue = 15000 + ((seed + day * 7 + i * 13) % 85000);
      synthetic.push({
        id: `syn-${sellerId}-${day}-${i}`,
        sellerId,
        storeId,
        productId: `prod-${(seed + i) % 20}`,
        customerId: `cust-${day}-${i}`,
        date: d.toISOString(),
        hour: 8 + ((seed + i) % 10),
        revenue,
        cost: Math.round(revenue * 0.62),
        quantity: 1 + (i % 2),
      });
    }
  }
  return [...fromOrders.filter((s) => s.sellerId === sellerId), ...synthetic];
}

/** Ventes agrégées au niveau boutique (page Profit). */
export function enrichDemoStoreSales(orders: Order[], storeId: string): SaleRecord[] {
  const fromOrders = buildSalesFromOrders(orders).filter((s) => s.storeId === storeId);
  if (fromOrders.length >= 25) return fromOrders;

  const synthetic: SaleRecord[] = [];
  const seed = storeId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const sellers = ['demo-seller-1', 'sl-demo-store-1-1', 'sl-demo-store-1-2', 'demo-seller-2', 'sl-demo-store-2-1'];
  for (let day = 89; day >= 0; day--) {
    const count = 2 + ((seed + day) % 5);
    for (let i = 0; i < count; i++) {
      const d = new Date(Date.now() - day * 86400000 - i * 5400000);
      const revenue = 18000 + ((seed + day * 11 + i * 17) % 120000);
      synthetic.push({
        id: `store-syn-${storeId}-${day}-${i}`,
        sellerId: sellers[(seed + i + day) % sellers.length],
        storeId,
        productId: `prod-${(seed + i + day) % 20}`,
        customerId: `cust-${day}-${i}`,
        date: d.toISOString(),
        hour: 7 + ((seed + i) % 12),
        revenue,
        cost: Math.round(revenue * 0.62),
        quantity: 1 + (i % 3),
      });
    }
  }
  return [...fromOrders, ...synthetic];
}

export function movingAverage(points: DayPoint[], window = 7): DayPoint[] {
  return points.map((p, i) => {
    const slice = points.slice(Math.max(0, i - window + 1), i + 1);
    return {
      ...p,
      moyenne: Math.round(slice.reduce((a, s) => a + s.revenue, 0) / slice.length),
    };
  });
}

export interface AbcRow {
  key: string;
  revenue: number;
  share: number;
  cumulative: number;
  classe: 'A' | 'B' | 'C';
}

export function abcAnalysis(rows: Array<{ key: string; value: number }>): AbcRow[] {
  const total = rows.reduce((a, r) => a + r.value, 0) || 1;
  let cumulative = 0;
  return [...rows]
    .sort((a, b) => b.value - a.value)
    .map((r) => {
      const share = (r.value / total) * 100;
      cumulative += share;
      return {
        key: r.key,
        revenue: r.value,
        share,
        cumulative,
        classe: cumulative <= 70 ? 'A' as const : cumulative <= 90 ? 'B' as const : 'C' as const,
      };
    });
}

export function retentionCohorts(sales: SaleRecord[]) {
  const firstSeen = new Map<string, string>();
  [...sales]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((s) => {
      if (!firstSeen.has(s.customerId)) firstSeen.set(s.customerId, s.date.slice(0, 7));
    });

  const cohorts = new Map<string, { size: number; months: Record<number, Set<string>> }>();
  sales.forEach((s) => {
    const cohort = firstSeen.get(s.customerId);
    if (!cohort) return;
    const entry = cohorts.get(cohort) ?? { size: 0, months: {} };
    const monthIndex =
      (Number(s.date.slice(0, 4)) - Number(cohort.slice(0, 4))) * 12 +
      (Number(s.date.slice(5, 7)) - Number(cohort.slice(5, 7)));
    entry.months[monthIndex] = entry.months[monthIndex] ?? new Set();
    entry.months[monthIndex].add(s.customerId);
    cohorts.set(cohort, entry);
  });

  return [...cohorts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([cohort, entry]) => {
      const size = entry.months[0]?.size ?? 0;
      return {
        cohort,
        size,
        values: [0, 1, 2, 3, 4, 5].map((m) =>
          size ? Math.round(((entry.months[m]?.size ?? 0) / size) * 100) : 0,
        ),
      };
    });
}

export interface Anomaly {
  date: string;
  label: string;
  revenue: number;
  expected: number;
  zScore: number;
  severity: 'haute' | 'moyenne';
}

export function detectAnomalies(points: DayPoint[]): Anomaly[] {
  const values = points.map((p) => p.revenue);
  const mean = values.reduce((a, b) => a + b, 0) / (values.length || 1);
  const sd = Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / (values.length || 1)) || 1;
  return points
    .map((p) => ({
      date: p.date,
      label: p.label,
      revenue: p.revenue,
      expected: Math.round(mean),
      zScore: Math.round(((p.revenue - mean) / sd) * 100) / 100,
      severity: Math.abs((p.revenue - mean) / sd) > 3 ? 'haute' as const : 'moyenne' as const,
    }))
    .filter((p) => Math.abs(p.zScore) > 2.2)
    .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
}

export interface RfmSegment {
  segment: string;
  customers: number;
  revenue: number;
  description: string;
}

export function rfmSegments(sales: SaleRecord[]): RfmSegment[] {
  const now = Date.now();
  const byCustomer = new Map<string, { recency: number; frequency: number; monetary: number }>();
  sales.forEach((s) => {
    const rec = Math.floor((now - new Date(s.date).getTime()) / 86400000);
    const cur = byCustomer.get(s.customerId);
    if (cur) {
      cur.recency = Math.min(cur.recency, rec);
      cur.frequency += 1;
      cur.monetary += s.revenue;
    } else {
      byCustomer.set(s.customerId, { recency: rec, frequency: 1, monetary: s.revenue });
    }
  });

  const buckets: Record<string, { customers: number; revenue: number; description: string }> = {
    Champions: { customers: 0, revenue: 0, description: 'Achat récent, fréquence et panier élevés' },
    Fidèles: { customers: 0, revenue: 0, description: 'Réguliers, panier moyen solide' },
    Prometteurs: { customers: 0, revenue: 0, description: 'Récents mais peu fréquents' },
    'À risque': { customers: 0, revenue: 0, description: 'Bon historique, plus vus depuis longtemps' },
    Perdus: { customers: 0, revenue: 0, description: 'Aucune activité récente' },
  };

  byCustomer.forEach((v) => {
    let key: keyof typeof buckets;
    if (v.recency < 30 && v.frequency >= 5) key = 'Champions';
    else if (v.frequency >= 4) key = 'Fidèles';
    else if (v.recency < 30) key = 'Prometteurs';
    else if (v.recency < 90) key = 'À risque';
    else key = 'Perdus';
    buckets[key].customers += 1;
    buckets[key].revenue += v.monetary;
  });

  return Object.entries(buckets).map(([segment, v]) => ({ segment, ...v }));
}

export function forecast(points: DayPoint[], horizon = 30) {
  const n = points.length;
  if (n < 4) return { points: [] as Array<{ label: string; prevision: number; bas: number; haut: number }>, confidence: 0 };
  const xs = points.map((_, i) => i);
  const ys = points.map((p) => p.revenue);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((acc, x, i) => acc + (x - meanX) * (ys[i] - meanY), 0);
  const den = xs.reduce((acc, x) => acc + (x - meanX) ** 2, 0) || 1;
  const slope = num / den;
  const intercept = meanY - slope * meanX;
  const residuals = ys.map((y, i) => y - (intercept + slope * i));
  const rmse = Math.sqrt(residuals.reduce((a, r) => a + r * r, 0) / n);
  const ssTot = ys.reduce((a, y) => a + (y - meanY) ** 2, 0) || 1;
  const ssRes = residuals.reduce((a, r) => a + r * r, 0);
  const r2 = Math.max(0, 1 - ssRes / ssTot);
  const last = new Date(points[n - 1].date);

  const projection = Array.from({ length: horizon }).map((_, i) => {
    const idx = n + i;
    const date = new Date(last.getTime() + (i + 1) * 86400000);
    const dow = date.getDay();
    const seasonal = dow === 6 ? 1.35 : dow === 0 ? 0.62 : 1;
    const value = Math.max(0, (intercept + slope * idx) * seasonal);
    return {
      label: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      prevision: Math.round(value),
      bas: Math.round(Math.max(0, value - 1.28 * rmse)),
      haut: Math.round(value + 1.28 * rmse),
    };
  });

  return { points: projection, confidence: Math.round(r2 * 100) };
}
