import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { Brief } from '../../briefs/entities/brief.entity';

export interface CampaignSettings {
  autoGenerate?: boolean;
  generateFrequency?: 'daily' | 'weekly' | 'monthly';
  maxPostsPerDay?: number;
  approvalRequired?: boolean;
  autoPublish?: boolean;
  targetAudience?: {
    ageRange?: [number, number];
    interests?: string[];
    locations?: string[];
    languages?: string[];
  };
  goals?: {
    type: 'engagement' | 'leads' | 'sales' | 'awareness' | 'traffic';
    targetValue?: number;
    metric?: string;
  }[];
}

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  organizationId: string;

  @Column('uuid')
  brandId: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('jsonb', { nullable: true })
  settings: CampaignSettings;

  @Column({ default: 'active' })
  status: 'active' | 'paused' | 'completed' | 'draft';

  @Column('date', { nullable: true })
  startDate: Date;

  @Column('date', { nullable: true })
  endDate: Date;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  budget: number;

  @Column({ nullable: true })
  currency: string;

  @Column('jsonb', { nullable: true })
  performance: {
    totalPosts: number;
    totalImpressions: number;
    totalEngagements: number;
    totalClicks: number;
    averageCTR: number;
    topPerformingContent?: string[];
    bestPostingTimes?: string[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Organization, (organization) => organization.campaigns, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => Brand, (brand) => brand.campaigns, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @OneToMany(() => Brief, (brief) => brief.campaign)
  briefs: Brief[];
}
