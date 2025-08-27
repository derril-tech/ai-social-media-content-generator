import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Brand } from '../../brands/entities/brand.entity';
import { Tone } from '@shared/types';

export interface VoiceConstraints {
  tone: Tone;
  sentenceLength: {
    min: number;
    max: number;
  };
  emojiThreshold: number;
  jargonThreshold: number;
  formalityLevel: number;
  humorLevel: number;
  technicalLevel: number;
  promotionalTone: number;
}

export interface TrainingExample {
  content: string;
  source: string;
  quality: number;
  metadata?: Record<string, any>;
}

@Entity('voice_models')
export class VoiceModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  brandId: string;

  @Column('vector', { nullable: true })
  embedding: number[];

  @Column('jsonb')
  constraints: VoiceConstraints;

  @Column('jsonb', { nullable: true })
  trainingExamples: TrainingExample[];

  @Column({ default: 'pending' })
  status: 'pending' | 'training' | 'completed' | 'failed';

  @Column('text', { nullable: true })
  errorMessage: string;

  @Column('float', { default: 0 })
  trainingProgress: number;

  @Column('jsonb', { nullable: true })
  metrics: {
    accuracy: number;
    loss: number;
    epochs: number;
    datasetSize: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  trainedAt: Date;

  // Relations
  @ManyToOne(() => Brand, (brand) => brand.voiceModels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;
}
