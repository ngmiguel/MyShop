import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Seller } from './seller.entity';

@Entity({ name: 'reviews', schema: 'seller' })
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'seller_id', type: 'uuid', nullable: true })
  sellerId: string;

  @ManyToOne(() => Seller, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'seller_id' })
  seller: Seller;

  @Column({ name: 'store_id', type: 'uuid', nullable: true })
  storeId: string;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string;

  @Column({ name: 'author_name', length: 200, nullable: true })
  authorName: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
