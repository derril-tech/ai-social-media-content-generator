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
import { Campaign } from '../../campaigns/entities/campaign.entity';
import { Connector } from '../../connectors/entities/connector.entity';
import { VoiceModel } from '../../voice-models/entities/voice-model.entity';

@Entity('brands')
export class Brand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  organizationId: string;

  @Column()
  name: string;

  @Column('text', { array: true })
  colors: string[];

  @Column('text', { array: true })
  fonts: string[];

  @Column('text')
  guidelines: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Organization, (organization) => organization.brands, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @OneToMany(() => Campaign, (campaign) => campaign.brand)
  campaigns: Campaign[];

  @OneToMany(() => Connector, (connector) => connector.brand)
  connectors: Connector[];

  @OneToMany(() => VoiceModel, (voiceModel) => voiceModel.brand)
  voiceModels: VoiceModel[];
}
