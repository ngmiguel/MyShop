import { Injectable, signal } from '@angular/core';
import { DEMO_PRODUCTS } from '../data/demo-catalog';
import { DEMO_MANAGER_STORES, ManagerStore } from '../data/demo-manager-stores';
import {
  buildDemoMonitoringEvents,
  DEMO_LATENCY_SERIES,
  DEMO_SERVICES,
  MonitoringEvent,
  ServiceHealth,
} from '../data/demo-monitoring';
import { buildDemoEnterpriseSales } from '../data/demo-sales';
import { DEMO_SELLERS, DemoSellerProfile } from '../data/demo-sellers';
import { StoreDraft } from '../data/store-wizard.types';
import { Order, Seller, Store } from '../models';
import { computeKpis, Kpis, SaleRecord } from '../utils/analytics.util';
import { LocalOrderService } from './local-order.service';

const CUSTOM_STORES_KEY = 'boutika_custom_stores';

const EXTRA_SELLERS: DemoSellerProfile[] = DEMO_MANAGER_STORES.flatMap((store, si) => {
  if (DEMO_SELLERS.some((s) => s.storeId === store.id)) return [];
  const count = 2 + (si % 2);
  return Array.from({ length: count }).map((_, i) => ({
    id: `sl-${store.id}-${i}`,
    storeId: store.id,
    firstName: ['Aline', 'Boris', 'Chantal', 'Didier', 'Estelle'][((si + i) * 3) % 5],
    lastName: ['Mbarga', 'Ndongo', 'Fotso', 'Nkolo', 'Bayiha'][((si + i) * 2) % 5],
    email: `vendeur${i}.${store.id}@boutika.cm`,
    phone: `+237 69${String(1000000 + si * 1000 + i * 137).slice(0, 7)}`,
    position: ['Vendeur comptoir', 'Caissier', 'Chef de rayon'][i % 3],
    shift: ['Matin (07h–14h)', 'Après-midi (13h–20h)', 'Journée (08h–18h)'][i % 3],
    status: (si === 4 && i === 1 ? 'pending' : si === 9 && i === 0 ? 'suspended' : 'active') as DemoSellerProfile['status'],
    rating: Math.round((3.6 + ((si + i) % 5) * 0.2) * 10) / 10,
    ratingCount: 12 + si * 3 + i * 5,
    avgHandoverMinutes: 3 + (si % 4),
    monthlyTarget: 55 + si * 2,
    joinedAt: new Date(Date.now() - (40 + si * 30 + i * 15) * 86400000).toISOString(),
    idType: "Carte nationale d'identité",
    idNumber: `CM${100000000 + si * 11111 + i * 9999}`,
  }));
});

const ALL_SELLERS = [...DEMO_SELLERS, ...EXTRA_SELLERS];

function loadCustomStores(): ManagerStore[] {
  try {
    const raw = localStorage.getItem(CUSTOM_STORES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ManagerStore[];
  } catch {
    return [];
  }
}

function saveCustomStores(stores: ManagerStore[]): void {
  const custom = stores.filter((s) => !DEMO_MANAGER_STORES.some((d) => d.id === s.id));
  localStorage.setItem(CUSTOM_STORES_KEY, JSON.stringify(custom));
}

@Injectable({ providedIn: 'root' })
export class ManagerDataService {
  private sales: SaleRecord[] | null = null;
  private events: MonitoringEvent[] | null = null;
  readonly stores = signal<ManagerStore[]>([...DEMO_MANAGER_STORES, ...loadCustomStores()]);

  constructor(private readonly localOrders: LocalOrderService) {}

  getSales(): SaleRecord[] {
    if (!this.sales) this.sales = buildDemoEnterpriseSales();
    return this.sales;
  }

  getEvents(): MonitoringEvent[] {
    if (!this.events) this.events = buildDemoMonitoringEvents();
    return this.events;
  }

  getServices(): ServiceHealth[] {
    return DEMO_SERVICES;
  }

  getLatencySeries() {
    return DEMO_LATENCY_SERIES;
  }

  getManagerStores(): ManagerStore[] {
    return this.stores();
  }

  getStore(id: string): ManagerStore | undefined {
    return this.stores().find((s) => s.id === id);
  }

  createStore(draft: StoreDraft): ManagerStore {
    const id = `st-${Date.now()}`;
    const store: ManagerStore = {
      id,
      name: draft.name,
      legalName: draft.legalName || `${draft.name} SARL`,
      tagline: draft.tagline,
      shortDescription: draft.shortDescription,
      description: draft.description || draft.shortDescription,
      city: draft.city,
      region: draft.region,
      country: draft.country,
      address: draft.address,
      landmark: draft.landmark,
      categories: draft.categories,
      mainCategory: draft.mainCategory,
      subcategories: draft.subcategories,
      status: 'active',
      rating: 0,
      reviewCount: 0,
      maxSellers: draft.maxSellers,
      accessCode: draft.accessCode,
      accessCodeExpiry: new Date(Date.now() + draft.accessCodeDays * 86400000).toISOString(),
      autoApproveSellers: draft.autoApproveSellers,
      lat: draft.lat,
      lng: draft.lng,
      serviceRadiusKm: draft.serviceRadiusKm,
      productCount: 0,
      phone: draft.phone,
      email: draft.email || `contact@${id}.boutika.cm`,
      taxRate: draft.taxRate,
      paymentMethods: draft.paymentMethods,
      delivery: draft.delivery,
      pickup: draft.pickup,
      capacity: draft.capacity,
      foundedYear: draft.foundedYear,
      legalStatus: draft.legalStatus,
      registrationNumber: draft.registrationNumber || `RC/DLA/${draft.foundedYear}/B/${Math.floor(Math.random() * 9000) + 1000}`,
      hours: draft.hours,
      photos: draft.photos,
      coverIndex: draft.coverIndex,
      createdAt: new Date().toISOString(),
    };
    const next = [...this.stores(), store];
    this.stores.set(next);
    saveCustomStores(next);
    return store;
  }

  storeKpis(storeId: string, days = 180): Kpis {
    const since = Date.now() - days * 86400000;
    const rows = this.getSales().filter(
      (s) => s.storeId === storeId && new Date(s.date).getTime() >= since,
    );
    return computeKpis(rows);
  }

  getStoreOrders(storeId: string): Order[] {
    return this.localOrders.getOrders({ storeId });
  }

  toStoreView(store: ManagerStore): Store {
    return {
      id: store.id,
      name: store.name,
      city: store.city,
      address: store.address,
      phone: store.phone,
      email: store.email,
      description: store.description ?? store.shortDescription,
      accessCode: store.accessCode,
      isActive: store.status === 'active',
      productCount: store.productCount,
      sellerCount: ALL_SELLERS.filter((s) => s.storeId === store.id && s.status === 'active').length,
    };
  }

  getStoresPaginated(): { data: Store[]; total: number } {
    const data = this.stores().map((s) => this.toStoreView(s));
    return { data, total: data.length };
  }

  getSellers(params?: { storeId?: string; status?: string }): Seller[] {
    let list = ALL_SELLERS.map((s) => this.toSellerView(s));
    if (params?.storeId) list = list.filter((s) => s.storeId === params.storeId);
    if (params?.status) list = list.filter((s) => s.status === params.status);
    return list;
  }

  getSellersPaginated(params?: { storeId?: string; status?: string }): { data: Seller[]; total: number } {
    const data = this.getSellers(params);
    return { data, total: data.length };
  }

  sellerStats(sellerId: string): { salesCount: number; revenue: number } {
    const rows = this.getSales().filter((s) => s.sellerId === sellerId);
    return {
      salesCount: rows.length,
      revenue: rows.reduce((a, s) => a + s.revenue, 0),
    };
  }

  storeRevenue(storeId: string, days = 180): number {
    return this.storeKpis(storeId, days).revenue;
  }

  storeProductStats(storeId: string): { items: number; outOfStock: number } {
    const products = DEMO_PRODUCTS.filter((p) => p.storeId === storeId);
    return {
      items: products.length,
      outOfStock: products.filter((p) => p.stock === 0).length,
    };
  }

  toggleStoreStatus(id: string): ManagerStore | undefined {
    const store = this.getStore(id);
    if (!store) return undefined;
    const nextStatus = store.status === 'active' ? 'paused' : 'active';
    return this.updateStore(id, { status: nextStatus });
  }

  updateStore(id: string, patch: Partial<ManagerStore>): ManagerStore | undefined {
    const current = this.stores();
    const idx = current.findIndex((s) => s.id === id);
    if (idx < 0) return undefined;
    const next = [...current];
    next[idx] = { ...next[idx], ...patch };
    this.stores.set(next);
    saveCustomStores(next);
    return next[idx];
  }

  regenerateAccessCode(storeId: string, length = 9): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < length; i++) code += chars[(storeId.charCodeAt(i % storeId.length) + i * 7) % chars.length];
    const formatted = `${code.slice(0, 4)}-${code.slice(4)}`;
    this.updateStore(storeId, { accessCode: formatted });
    return formatted;
  }

  updateSellerStatus(id: string, status: Seller['status']): Seller | undefined {
    const seller = ALL_SELLERS.find((s) => s.id === id);
    if (!seller) return undefined;
    seller.status = status;
    return this.toSellerView(seller);
  }

  acknowledgeEvent(id: string): void {
    if (!this.events) this.events = buildDemoMonitoringEvents();
    const ev = this.events.find((e) => e.id === id);
    if (ev) ev.acknowledged = true;
  }

  acknowledgeAllOpen(): number {
    if (!this.events) this.events = buildDemoMonitoringEvents();
    let count = 0;
    this.events.forEach((e) => {
      if (!e.acknowledged) {
        e.acknowledged = true;
        count += 1;
      }
    });
    return count;
  }

  acknowledgeEvents(ids: string[]): number {
    if (!this.events) this.events = buildDemoMonitoringEvents();
    const set = new Set(ids);
    let count = 0;
    this.events.forEach((e) => {
      if (set.has(e.id) && !e.acknowledged) {
        e.acknowledged = true;
        count += 1;
      }
    });
    return count;
  }

  openAlertsCount(): number {
    return this.getEvents().filter((e) => !e.acknowledged && e.level !== 'info' && e.level !== 'success').length;
  }

  private toSellerView(seller: DemoSellerProfile): Seller & { salesCount: number; revenue: number; joinedAt: string } {
    const stats = this.sellerStats(seller.id);
    const store = this.getStore(seller.storeId);
    return {
      id: seller.id,
      userId: seller.userId,
      storeId: seller.storeId,
      storeName: store?.name,
      firstName: seller.firstName,
      lastName: seller.lastName,
      email: seller.email,
      phone: seller.phone,
      position: seller.position,
      shift: seller.shift,
      status: seller.status,
      rating: seller.rating,
      reviewCount: seller.ratingCount,
      salesCount: stats.salesCount,
      revenue: stats.revenue,
      joinedAt: seller.joinedAt,
    };
  }
}
