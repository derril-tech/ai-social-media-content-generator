import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DLQMessageStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  RETRYING = 'retrying',
  FAILED = 'failed',
  RESOLVED = 'resolved',
  EXPIRED = 'expired',
}

export enum DLQMessageType {
  CONTENT_GENERATION = 'content_generation',
  POLICY_CHECK = 'policy_check',
  PUBLISH = 'publish',
  METRICS_INGESTION = 'metrics_ingestion',
  WEBHOOK_PROCESSING = 'webhook_processing',
  ASSET_PROCESSING = 'asset_processing',
  EXPERIMENT_PROCESSING = 'experiment_processing',
  REPORT_GENERATION = 'report_generation',
  NOTIFICATION = 'notification',
  AUDIT_LOG = 'audit_log',
}

@Entity('dlq_messages')
@Index(['organizationId', 'status'])
@Index(['type', 'status'])
@Index(['createdAt', 'status'])
@Index(['retryCount', 'status'])
export class DLQMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({
    type: 'enum',
    enum: DLQMessageType,
  })
  type: DLQMessageType;

  @Column({
    type: 'enum',
    enum: DLQMessageStatus,
    default: DLQMessageStatus.PENDING,
  })
  status: DLQMessageStatus;

  @Column({ type: 'text' })
  originalMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  messageData: Record<string, any>;

  @Column({ type: 'text' })
  errorMessage: string;

  @Column({ type: 'text', nullable: true })
  errorStack: string;

  @Column({ type: 'jsonb', nullable: true })
  errorContext: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'int', default: 3 })
  maxRetries: number;

  @Column({ type: 'timestamp', nullable: true })
  nextRetryAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastRetryAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  retryHistory: Array<{
    attempt: number;
    timestamp: Date;
    error: string;
    context?: Record<string, any>;
  }>;

  @Column({ type: 'text', nullable: true })
  sourceQueue: string;

  @Column({ type: 'text', nullable: true })
  sourceSubject: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'text', nullable: true })
  resolvedBy: string;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;
}
