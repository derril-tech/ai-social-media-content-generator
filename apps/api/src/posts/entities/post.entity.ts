import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Brief } from '../../briefs/entities/brief.entity';
import { Variant } from '../../variants/entities/variant.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  briefId: string;

  @Column({
    type: 'enum',
    enum: ['draft', 'pending_approval', 'approved', 'scheduled', 'published', 'failed'],
    default: 'draft',
  })
  status:
    | 'draft'
    | 'pending_approval'
    | 'approved'
    | 'scheduled'
    | 'published'
    | 'failed';

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ nullable: true })
  externalId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Brief, (brief) => brief.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'briefId' })
  brief: Brief;

  @OneToMany(() => Variant, (variant) => variant.post)
  variants: Variant[];
}


