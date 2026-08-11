import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type DiscountType = 'percent' | 'fixed';

@Entity({ name: 'promo_codes', schema: 'orders' })
export class PromoCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ name: 'discount_type', type: 'varchar', length: 20 })
  discountType: DiscountType;

  @Column({ name: 'discount_value', type: 'decimal', precision: 10, scale: 2 })
  discountValue: number;

  @Column({ name: 'min_order', type: 'decimal', precision: 12, scale: 2, default: 0 })
  minOrder: number;

  @Column({ name: 'max_uses', type: 'int', nullable: true })
  maxUses: number | null;

  @Column({ name: 'used_count', type: 'int', default: 0 })
  usedCount: number;

  @Column({ name: 'valid_from', type: 'timestamptz', default: () => 'NOW()' })
  validFrom: Date;

  @Column({ name: 'valid_until', type: 'timestamptz', nullable: true })
  validUntil: Date | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
