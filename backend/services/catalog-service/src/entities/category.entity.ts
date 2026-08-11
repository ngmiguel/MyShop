import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Product } from './product.entity';

@Entity({ name: 'categories', schema: 'catalog' })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  label: string;

  @Column({ length: 50 })
  icon: string;

  @Column({ length: 20, nullable: true })
  color: string;

  @Column({ type: 'jsonb', default: [] })
  subcategories: Record<string, unknown>[];

  @Column({ type: 'jsonb', default: [] })
  attributes: Record<string, unknown>[];

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
