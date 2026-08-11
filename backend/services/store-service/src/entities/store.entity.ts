import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type StoreStatus = 'active' | 'draft' | 'paused' | 'suspended';

export interface OpeningHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

@Entity({ name: 'stores', schema: 'store' })
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ name: 'legal_name', type: 'varchar', length: 200, nullable: true })
  legalName: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  tagline: string;

  @Column({ name: 'short_description', type: 'text', nullable: true })
  shortDescription: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string;

  @Column({ type: 'jsonb', default: [] })
  photos: string[];

  @Column({ name: 'cover_index', type: 'int', default: 0 })
  coverIndex: number;

  @Column({ type: 'jsonb', default: [] })
  categories: string[];

  @Column({ name: 'main_category', type: 'varchar', length: 100, nullable: true })
  mainCategory: string;

  @Column({ type: 'jsonb', default: [] })
  subcategories: string[];

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string;

  @Column({ type: 'varchar', length: 100, default: 'CI' })
  country: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  landmark: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng: number;

  @Column({ name: 'service_radius_km', type: 'decimal', precision: 5, scale: 2, default: 10 })
  serviceRadiusKm: number;

  @Column({ type: 'jsonb', default: [] })
  hours: OpeningHours[];

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ name: 'payment_methods', type: 'jsonb', default: [] })
  paymentMethods: string[];

  @Column({ type: 'varchar', length: 3, default: 'XOF' })
  currency: string;

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 18 })
  taxRate: number;

  @Column({ type: 'boolean', default: true })
  delivery: boolean;

  @Column({ type: 'boolean', default: true })
  pickup: boolean;

  @Column({ type: 'int', default: 50 })
  capacity: number;

  @Column({ name: 'founded_year', type: 'int', nullable: true })
  foundedYear: number;

  @Column({ name: 'legal_status', type: 'varchar', length: 100, nullable: true })
  legalStatus: string;

  @Column({ name: 'registration_number', type: 'varchar', length: 100, nullable: true })
  registrationNumber: string;

  @Column({ name: 'access_code', type: 'varchar', length: 20 })
  accessCode: string;

  @Column({ name: 'access_code_expiry', type: 'timestamptz', nullable: true })
  accessCodeExpiry: Date;

  @Column({ name: 'max_sellers', type: 'int', default: 10 })
  maxSellers: number;

  @Column({ name: 'auto_approve_sellers', type: 'boolean', default: false })
  autoApproveSellers: boolean;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: StoreStatus;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ name: 'review_count', type: 'int', default: 0 })
  reviewCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
