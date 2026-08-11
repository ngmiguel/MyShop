import {
  Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'preferences', schema: 'users' })
export class UserPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true, unique: true })
  userId: string | null;

  @Column({ name: 'session_id', type: 'varchar', length: 100, nullable: true, unique: true })
  sessionId: string | null;

  @Column({ name: 'completed_onboarding', default: false })
  completedOnboarding: boolean;

  @Column({ type: 'jsonb', default: [] })
  domains: string[];

  @Column({ type: 'jsonb', default: [] })
  subcategories: string[];

  @Column({ name: 'budget_min', type: 'decimal', precision: 12, scale: 2, nullable: true })
  budgetMin: number | null;

  @Column({ name: 'budget_max', type: 'decimal', precision: 12, scale: 2, nullable: true })
  budgetMax: number | null;

  @Column({ nullable: true })
  city: string;

  @Column({ name: 'radius_km', type: 'decimal', precision: 5, scale: 2, default: 10 })
  radiusKm: number;

  @Column({ name: 'preferred_mode', default: 'pickup' })
  preferredMode: string;

  @Column({ default: 'system' })
  theme: string;

  @Column({ default: 'XOF' })
  currency: string;

  @Column({ name: 'notifications_enabled', default: true })
  notificationsEnabled: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng: number | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
