import {
  Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn,
} from 'typeorm';
import { CartItem } from '../common/interfaces';

@Entity({ name: 'carts', schema: 'orders' })
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'session_id', type: 'varchar', length: 100, nullable: true })
  sessionId: string | null;

  @Column({ type: 'jsonb', default: [] })
  items: CartItem[];

  @Column({ name: 'promo_code', type: 'varchar', length: 50, nullable: true })
  promoCode: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
