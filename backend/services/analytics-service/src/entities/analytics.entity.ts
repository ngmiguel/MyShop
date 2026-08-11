import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity({ name: 'daily_metrics', schema: 'analytics' })
@Unique(['metricDate', 'storeId'])
export class DailyMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'metric_date', type: 'date' })
  metricDate: string;

  @Column({ name: 'store_id', type: 'uuid', nullable: true })
  storeId: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  revenue: number;

  @Column({ name: 'orders_count', type: 'int', default: 0 })
  ordersCount: number;

  @Column({ name: 'avg_basket', type: 'decimal', precision: 12, scale: 2, default: 0 })
  avgBasket: number;

  @Column({ name: 'unique_clients', type: 'int', default: 0 })
  uniqueClients: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity({ name: 'orders', schema: 'orders' })
export class OrderSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity({ name: 'stores', schema: 'store' })
export class StoreSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 20 })
  status: string;
}

@Entity({ name: 'sellers', schema: 'seller' })
export class SellerSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  status: string;
}
