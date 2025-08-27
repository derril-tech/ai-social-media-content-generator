import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';

export enum DsrRequestType {
  ACCESS = 'access',
  RECTIFICATION = 'rectification',
  ERASURE = 'erasure',
  PORTABILITY = 'portability',
  RESTRICTION = 'restriction',
  OBJECTION = 'objection',
  WITHDRAWAL = 'withdrawal',
}

export enum DsrRequestStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum VerificationMethod {
  EMAIL = 'email',
  PHONE = 'phone',
  ID_DOCUMENT = 'id_document',
  ACCOUNT_ACCESS = 'account_access',
}

@Entity('dsr_requests')
export class DsrRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  requestId: string;

  @Column({
    type: 'enum',
    enum: DsrRequestType,
  })
  requestType: DsrRequestType;

  @Column({
    type: 'enum',
    enum: DsrRequestStatus,
    default: DsrRequestStatus.PENDING,
  })
  status: DsrRequestStatus;

  @Column({ type: 'varchar', length: 255 })
  dataSubjectEmail: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  dataSubjectName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  dataSubjectPhone: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', default: [] })
  dataTypes: string[];

  @Column({ type: 'jsonb', default: {} })
  verificationData: Record<string, any>;

  @Column({
    type: 'enum',
    enum: VerificationMethod,
    default: VerificationMethod.EMAIL,
  })
  verificationMethod: VerificationMethod;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  verifiedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  completedBy: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  rejectedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date;

  @Column({ type: 'jsonb', default: {} })
  exportedData: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  exportFileUrl: string;

  @Column({ type: 'timestamp', nullable: true })
  exportExpiresAt: Date;

  @Column({ type: 'jsonb', default: [] })
  auditLog: Array<{
    timestamp: Date;
    action: string;
    performedBy: string;
    details: Record<string, any>;
  }>;

  @Column({ type: 'varchar', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'varchar', length: 36, nullable: true })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;
}
