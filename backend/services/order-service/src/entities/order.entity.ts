import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';
import { CartItem } from '../common/interfaces';

export type OrderStatus = 'pending' | 'redeemed' | 'expired' | 'cancelled';
export type FulfillmentMode = 'pickup' | 'delivery';

@Entity({ name: 'orders', schema: 'orders' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  reference: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @Column({ type: 'jsonb' })
  items: CartItem[];

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column({ type: 'varchar', length: 3, default: 'XOF' })
  currency: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: OrderStatus;

  @Column({ name: 'fulfillment_mode', type: 'varchar', length: 20, default: 'pickup' })
  fulfillmentMode: FulfillmentMode;

  @Column({ name: 'contact_name', type: 'varchar', length: 200, nullable: true })
  contactName: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', length: 30, nullable: true })
  contactPhone: string | null;

  @Column({ name: 'contact_email', type: 'varchar', length: 255, nullable: true })
  contactEmail: string | null;

  @Column({ name: 'payment_method', type: 'varchar', length: 30, nullable: true })
  paymentMethod: string | null;

  @Column({ name: 'qr_payload', type: 'text', nullable: true })
  qrPayload: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'redeemed_at', type: 'timestamptz', nullable: true })
  redeemedAt: Date | null;

  @Column({ name: 'redeemed_by', type: 'uuid', nullable: true })
  redeemedBy: string | null;

  @Column({ name: 'seller_rating', type: 'int', nullable: true })
  sellerRating: number | null;

  @Column({ name: 'seller_comment', type: 'text', nullable: true })
  sellerComment: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
