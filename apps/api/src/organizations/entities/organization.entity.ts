import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Membership } from '../../memberships/entities/membership.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { Campaign } from '../../campaigns/entities/campaign.entity';
import { Asset } from '../../assets/entities/asset.entity';
import { Experiment } from '../../experiments/entities/experiment.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Membership, (membership) => membership.organization)
  memberships: Membership[];

  @OneToMany(() => Brand, (brand) => brand.organization)
  brands: Brand[];

  @OneToMany(() => Campaign, (campaign) => campaign.organization)
  campaigns: Campaign[];

  @OneToMany(() => Asset, (asset) => asset.organization)
  assets: Asset[];

  @OneToMany(() => Experiment, (experiment) => experiment.organization)
  experiments: Experiment[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.organization)
  auditLogs: AuditLog[];
}
