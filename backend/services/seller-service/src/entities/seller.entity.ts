import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

export type SellerStatus = 'pending' | 'active' | 'suspended';

@Entity({ name: 'sellers', schema: 'seller' })
export class Seller {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ length: 30, nullable: true })
  phone: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: string;

  @Column({ name: 'id_type', length: 50, nullable: true })
  idType: string;

  @Column({ name: 'id_number', length: 100, nullable: true })
  idNumber: string;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @Column({ length: 100, nullable: true })
  position: string;

  @Column({ length: 50, nullable: true })
  shift: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: SellerStatus;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ name: 'rating_count', type: 'int', default: 0 })
  ratingCount: number;

  @Column({ name: 'sales_count', type: 'int', default: 0 })
  salesCount: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  revenue: number;

  @Column({ name: 'avg_handover_minutes', type: 'decimal', precision: 5, scale: 2, default: 0 })
  avgHandoverMinutes: number;

  @Column({ name: 'monthly_target', type: 'decimal', precision: 12, scale: 2, default: 0 })
  monthlyTarget: number;

  @Column({ name: 'joined_at', type: 'timestamptz', default: () => 'NOW()' })
  joinedAt: Date;
}
