import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Brand } from '../../brands/entities/brand.entity';

@Entity('connectors')
export class Connector {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  brandId: string;

  @Column({
    type: 'enum',
    enum: ['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'youtube', 'threads', 'pinterest', 'buffer', 'hootsuite'],
  })
  platform:
    | 'twitter'
    | 'linkedin'
    | 'instagram'
    | 'facebook'
    | 'tiktok'
    | 'youtube'
    | 'threads'
    | 'pinterest'
    | 'buffer'
    | 'hootsuite';

  @Column('jsonb', { nullable: true })
  config: Record<string, any> | null;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Brand, (brand) => brand.connectors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;
}


