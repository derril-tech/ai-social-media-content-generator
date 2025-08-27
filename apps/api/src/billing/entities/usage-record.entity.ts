import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';

export enum UsageType {
  GENERATION = 'generation',
  PUBLISH = 'publish',
  SEAT = 'seat',
  STORAGE = 'storage',
  API_CALL = 'api_call',
  WEBHOOK = 'webhook',
}

export enum BillingPeriod {
  DAILY = 'daily',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity('usage_records')
@Index(['organizationId', 'usageType', 'billingPeriod', 'periodStart'])
@Index(['userId', 'usageType', 'billingPeriod', 'periodStart'])
export class UsageRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({
    type: 'enum',
    enum: UsageType,
  })
  usageType: UsageType;

  @Column({
    type: 'enum',
    enum: BillingPeriod,
    default: BillingPeriod.MONTHLY,
  })
  billingPeriod: BillingPeriod;

  @Column({ type: 'timestamp' })
  periodStart: Date;

  @Column({ type: 'timestamp' })
  periodEnd: Date;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  totalCost: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 50, nullable: true })
  platform?: string; // For platform-specific usage (e.g., 'twitter', 'linkedin')

  @Column({ type: 'varchar', length: 50, nullable: true })
  feature?: string; // For feature-specific usage (e.g., 'ai_generation', 'scheduling')

  @Column({ type: 'boolean', default: false })
  isBilled: boolean;

  @Column({ type: 'timestamp', nullable: true })
  billedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  invoiceId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
