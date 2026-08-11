import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from './category.entity';

@Entity({ name: 'products', schema: 'catalog' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 300 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.products, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'subcategory_id', length: 100, nullable: true })
  subcategoryId: string;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ name: 'compare_at_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
  compareAtPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cost: number;

  @Column({ length: 3, default: 'XOF' })
  currency: string;

  @Column({ default: 0 })
  stock: number;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string;

  @Column({ type: 'jsonb', default: [] })
  gallery: string[];

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ name: 'review_count', default: 0 })
  reviewCount: number;

  @Column({ type: 'jsonb', default: [] })
  variants: Record<string, unknown>[];

  @Column({ type: 'jsonb', default: {} })
  specs: Record<string, unknown>;

  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  @Column({ default: 0 })
  views: number;

  @Column({ name: 'sales_count', default: 0 })
  salesCount: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
