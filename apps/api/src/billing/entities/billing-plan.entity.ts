import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

export enum PlanType {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity('billing_plans')
export class BillingPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({
    type: 'enum',
    enum: PlanType,
  })
  planType: PlanType;

  @Column({
    type: 'enum',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
  })
  billingCycle: BillingCycle;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'int', default: 0 })
  maxSeats: number;

  @Column({ type: 'int', default: 0 })
  maxGenerationsPerMonth: number;

  @Column({ type: 'int', default: 0 })
  maxPublishesPerMonth: number;

  @Column({ type: 'int', default: 0 })
  maxStorageGB: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  generationPricePerUnit: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  publishPricePerUnit: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  storagePricePerGB: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  seatPricePerMonth: number;

  @Column({ type: 'jsonb', nullable: true })
  features: string[];

  @Column({ type: 'jsonb', nullable: true })
  limits: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isCustom: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Organization, organization => organization.billingPlan)
  organizations: Organization[];
}
