import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';

export enum ShareLinkStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export enum ShareLinkType {
  CONTENT_PREVIEW = 'content_preview',
  CAMPAIGN_PREVIEW = 'campaign_preview',
  ANALYTICS_REPORT = 'analytics_report',
  BILLING_REPORT = 'billing_report',
}

export interface WatermarkConfig {
  enabled: boolean;
  text?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  fontSize: number;
  color: string;
  includeTimestamp: boolean;
  includeUserInfo: boolean;
}

@Entity('share_links')
export class ShareLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  token: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ShareLinkType,
    default: ShareLinkType.CONTENT_PREVIEW,
  })
  type: ShareLinkType;

  @Column({ type: 'jsonb' })
  resourceData: Record<string, any>;

  @Column({
    type: 'enum',
    enum: ShareLinkStatus,
    default: ShareLinkStatus.ACTIVE,
  })
  status: ShareLinkStatus;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'int', default: 0 })
  maxViews: number;

  @Column({ type: 'int', default: 0 })
  currentViews: number;

  @Column({ type: 'boolean', default: false })
  requirePassword: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash: string;

  @Column({ type: 'jsonb', default: {} })
  watermarkConfig: WatermarkConfig;

  @Column({ type: 'boolean', default: true })
  allowDownload: boolean;

  @Column({ type: 'boolean', default: false })
  allowComments: boolean;

  @Column({ type: 'jsonb', default: [] })
  accessLog: Array<{
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    action: 'view' | 'download' | 'comment';
  }>;

  @Column({ type: 'varchar', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'varchar', length: 36 })
  createdById: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customDomain: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;
}
