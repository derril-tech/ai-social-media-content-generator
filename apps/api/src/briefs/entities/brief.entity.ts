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
import { Campaign } from '../../campaigns/entities/campaign.entity';
import { Post } from '../../posts/entities/post.entity';
import { Tone, Platform } from '@shared/types';

export interface BriefConstraints {
  maxLength?: number;
  minLength?: number;
  includeHashtags?: boolean;
  hashtagCount?: number;
  includeCallToAction?: boolean;
  includeEmojis?: boolean;
  toneStrength?: number;
  formalityLevel?: number;
  bannedWords?: string[];
  requiredWords?: string[];
  excludedTopics?: string[];
}

@Entity('briefs')
export class Brief {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  campaignId: string;

  @Column()
  topic: string;

  @Column('text', { nullable: true })
  audience: string;

  @Column({
    type: 'enum',
    enum: ['professional', 'casual', 'humorous', 'educational', 'promotional', 'controversial'],
    default: 'professional',
  })
  tone: Tone;

  @Column('text', { array: true, default: '{}' })
  languages: string[];

  @Column({
    type: 'enum',
    enum: ['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'youtube', 'threads', 'pinterest'],
    array: true,
    default: '{}',
  })
  platforms: Platform[];

  @Column('text', { array: true, default: '{}' })
  regions: string[];

  @Column('text', { array: true, default: '{}' })
  competitors: string[];

  @Column('text', { array: true, default: '{}' })
  constraints: string[];

  @Column('jsonb', { nullable: true })
  detailedConstraints: BriefConstraints;

  @Column('jsonb', { nullable: true })
  metadata: {
    estimatedGenerationTime?: number;
    contentType?: 'post' | 'thread' | 'carousel' | 'story' | 'reel' | 'video';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    tags?: string[];
    internalNotes?: string;
  };

  @Column({ default: 'draft' })
  status: 'draft' | 'ready' | 'generating' | 'completed' | 'failed';

  @Column('text', { nullable: true })
  errorMessage: string;

  @Column('jsonb', { nullable: true })
  generationStats: {
    generatedAt?: Date;
    generationTime?: number;
    postsGenerated?: number;
    successRate?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Campaign, (campaign) => campaign.briefs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @OneToMany(() => Post, (post) => post.brief)
  posts: Post[];
}
