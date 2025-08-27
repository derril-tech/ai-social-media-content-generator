import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';

@Entity('variants')
export class Variant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  postId: string;

  @Column({
    type: 'enum',
    enum: ['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'youtube', 'threads', 'pinterest'],
  })
  platform:
    | 'twitter'
    | 'linkedin'
    | 'instagram'
    | 'facebook'
    | 'tiktok'
    | 'youtube'
    | 'threads'
    | 'pinterest';

  @Column('text')
  content: string;

  @Column({ default: 'en' })
  language: string;

  @Column('text', { array: true, default: '{}' })
  hashtags: string[];

  @Column('jsonb')
  score: {
    brandFit: number;
    readability: number;
    policyRisk: number;
    overall: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Post, (post) => post.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;
}


