import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DailyMetric, OrderSnapshot, SellerSnapshot, StoreSnapshot,
} from '../entities/analytics.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(OrderSnapshot) private orderRepo: Repository<OrderSnapshot>,
    @InjectRepository(StoreSnapshot) private storeRepo: Repository<StoreSnapshot>,
    @InjectRepository(SellerSnapshot) private sellerRepo: Repository<SellerSnapshot>,
    @InjectRepository(DailyMetric) private metricsRepo: Repository<DailyMetric>,
  ) {}

  async getOverview() {
    const [orders, stores, sellers] = await Promise.all([
      this.orderRepo.find(),
      this.storeRepo.find(),
      this.sellerRepo.find(),
    ]);

    const redeemed = orders.filter((o) => o.status === 'redeemed');
    const revenue = redeemed.reduce((s, o) => s + Number(o.total), 0);

    return {
      storeCount: stores.filter((s) => s.status === 'active').length,
      sellerCount: sellers.filter((s) => s.status === 'active').length,
      orderCount: orders.length,
      pendingOrders: orders.filter((o) => o.status === 'pending').length,
      totalRevenue: revenue,
      conversionRate: orders.length > 0
        ? Math.round((redeemed.length / orders.length) * 100)
        : 0,
    };
  }

  async getMonitoring() {
    const services = [
      { name: 'Auth Service', status: 'healthy', latencyMs: 12, uptime: 99.9 },
      { name: 'Store Service', status: 'healthy', latencyMs: 18, uptime: 99.8 },
      { name: 'Catalog Service', status: 'healthy', latencyMs: 22, uptime: 99.7 },
      { name: 'Order Service', status: 'healthy', latencyMs: 15, uptime: 99.9 },
      { name: 'Seller Service', status: 'healthy', latencyMs: 20, uptime: 99.8 },
      { name: 'User Service', status: 'healthy', latencyMs: 14, uptime: 99.9 },
      { name: 'Analytics Service', status: 'healthy', latencyMs: 25, uptime: 99.6 },
      { name: 'Meilisearch', status: 'healthy', latencyMs: 8, uptime: 99.5 },
      { name: 'PostgreSQL', status: 'healthy', latencyMs: 5, uptime: 99.99 },
    ];

    return {
      services,
      lastChecked: new Date().toISOString(),
      globalStatus: 'operational',
    };
  }

  async getDashboard(storeId?: string) {
    const qb = this.orderRepo.createQueryBuilder('o');
    if (storeId) {
      qb.where('o.store_id = :storeId', { storeId });
    }
    const orders = await qb.getMany();

    const redeemed = orders.filter((o) => o.status === 'redeemed');
    const revenue = redeemed.reduce((s, o) => s + Number(o.total), 0);

    const byDay = new Map<string, number>();
    for (const order of redeemed) {
      const day = order.createdAt.toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + Number(order.total));
    }

    const revenueByDay = [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({ date, amount }));

    return {
      revenue,
      ordersTotal: orders.length,
      ordersRedeemed: redeemed.length,
      avgBasket: redeemed.length > 0 ? Math.round(revenue / redeemed.length) : 0,
      revenueByDay,
    };
  }

  async getProfit(storeId?: string) {
    const orders = await this.orderRepo.find({
      where: storeId ? { storeId, status: 'redeemed' } : { status: 'redeemed' },
    });

    const revenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const estimatedCost = revenue * 0.65;
    const margin = revenue - estimatedCost;

    return {
      revenue,
      estimatedCost,
      margin,
      marginRate: revenue > 0 ? Math.round((margin / revenue) * 100) : 0,
      ordersCount: orders.length,
    };
  }
}
