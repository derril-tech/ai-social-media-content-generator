import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

export enum RetentionPeriod {
  DAYS_7 = '7_days',
  DAYS_30 = '30_days',
  DAYS_90 = '90_days',
  DAYS_180 = '180_days',
  DAYS_365 = '365_days',
  DAYS_730 = '730_days',
  PERMANENT = 'permanent',
}

export enum DataType {
  USER_PROFILE = 'user_profile',
  CONTENT_GENERATION = 'content_generation',
  PUBLISHED_CONTENT = 'published_content',
  ANALYTICS_DATA = 'analytics_data',
  BILLING_DATA = 'billing_data',
  SHARE_LINKS = 'share_links',
  EXPERIMENT_DATA = 'experiment_data',
  CONNECTOR_DATA = 'connector_data',
  AUDIT_LOGS = 'audit_logs',
  SYSTEM_LOGS = 'system_logs',
}

export enum RetentionAction {
  DELETE = 'delete',
  ANONYMIZE = 'anonymize',
  ARCHIVE = 'archive',
  MOVE_TO_COLD_STORAGE = 'move_to_cold_storage',
}

@Entity('retention_policies')
export class RetentionPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: DataType,
  })
  dataType: DataType;

  @Column({
    type: 'enum',
    enum: RetentionPeriod,
    default: RetentionPeriod.DAYS_365,
  })
  retentionPeriod: RetentionPeriod;

  @Column({
    type: 'enum',
    enum: RetentionAction,
    default: RetentionAction.DELETE,
  })
  retentionAction: RetentionAction;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'jsonb', default: {} })
  conditions: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  exceptions: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  lastExecutedAt: Date;

  @Column({ type: 'int', default: 0 })
  recordsProcessed: number;

  @Column({ type: 'int', default: 0 })
  recordsDeleted: number;

  @Column({ type: 'varchar', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;
}
