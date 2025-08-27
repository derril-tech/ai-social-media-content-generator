import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { RetentionPolicy, RetentionPeriod, DataType, RetentionAction } from '../entities/retention-policy.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface RetentionExecutionResult {
  policyId: string;
  dataType: DataType;
  recordsProcessed: number;
  recordsDeleted: number;
  executionTime: number;
  errors: string[];
  success: boolean;
}

export interface RetentionStats {
  totalPolicies: number;
  activePolicies: number;
  lastExecution: Date | null;
  totalRecordsProcessed: number;
  totalRecordsDeleted: number;
  dataTypeBreakdown: Record<DataType, {
    policies: number;
    recordsProcessed: number;
    recordsDeleted: number;
  }>;
}

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(
    @InjectRepository(RetentionPolicy)
    private readonly retentionPolicyRepository: Repository<RetentionPolicy>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async createRetentionPolicy(
    organizationId: string,
    policy: Partial<RetentionPolicy>,
  ): Promise<RetentionPolicy> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`);
    }

    const retentionPolicy = this.retentionPolicyRepository.create({
      ...policy,
      organizationId,
    });

    return await this.retentionPolicyRepository.save(retentionPolicy);
  }

  async getRetentionPolicies(
    organizationId: string,
    dataType?: DataType,
    isActive?: boolean,
  ): Promise<RetentionPolicy[]> {
    const queryBuilder = this.retentionPolicyRepository
      .createQueryBuilder('policy')
      .where('policy.organizationId = :organizationId', { organizationId });

    if (dataType) {
      queryBuilder.andWhere('policy.dataType = :dataType', { dataType });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('policy.isActive = :isActive', { isActive });
    }

    return await queryBuilder.getMany();
  }

  async updateRetentionPolicy(
    policyId: string,
    organizationId: string,
    updates: Partial<RetentionPolicy>,
  ): Promise<RetentionPolicy> {
    const policy = await this.retentionPolicyRepository.findOne({
      where: { id: policyId, organizationId },
    });

    if (!policy) {
      throw new Error('Retention policy not found');
    }

    Object.assign(policy, updates);
    return await this.retentionPolicyRepository.save(policy);
  }

  async deleteRetentionPolicy(
    policyId: string,
    organizationId: string,
  ): Promise<void> {
    const policy = await this.retentionPolicyRepository.findOne({
      where: { id: policyId, organizationId },
    });

    if (!policy) {
      throw new Error('Retention policy not found');
    }

    await this.retentionPolicyRepository.remove(policy);
  }

  async executeRetentionPolicy(
    policyId: string,
    organizationId: string,
  ): Promise<RetentionExecutionResult> {
    const policy = await this.retentionPolicyRepository.findOne({
      where: { id: policyId, organizationId },
    });

    if (!policy) {
      throw new Error('Retention policy not found');
    }

    if (!policy.isActive) {
      throw new Error('Retention policy is not active');
    }

    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const cutoffDate = this.calculateCutoffDate(policy.retentionPeriod);
      const recordsToProcess = await this.findRecordsToProcess(
        policy.dataType,
        organizationId,
        cutoffDate,
        policy.conditions,
      );

      let recordsDeleted = 0;

      for (const record of recordsToProcess) {
        try {
          await this.processRecord(record, policy.retentionAction);
          recordsDeleted++;
        } catch (error) {
          errors.push(`Failed to process record ${record.id}: ${error.message}`);
        }
      }

      // Update policy statistics
      policy.lastExecutedAt = new Date();
      policy.recordsProcessed += recordsToProcess.length;
      policy.recordsDeleted += recordsDeleted;
      await this.retentionPolicyRepository.save(policy);

      const executionTime = Date.now() - startTime;

      return {
        policyId: policy.id,
        dataType: policy.dataType,
        recordsProcessed: recordsToProcess.length,
        recordsDeleted,
        executionTime,
        errors,
        success: errors.length === 0,
      };
    } catch (error) {
      this.logger.error(`Error executing retention policy ${policyId}:`, error);
      errors.push(error.message);
      
      return {
        policyId: policy.id,
        dataType: policy.dataType,
        recordsProcessed: 0,
        recordsDeleted: 0,
        executionTime: Date.now() - startTime,
        errors,
        success: false,
      };
    }
  }

  async getRetentionStats(organizationId: string): Promise<RetentionStats> {
    const policies = await this.retentionPolicyRepository.find({
      where: { organizationId },
    });

    const stats: RetentionStats = {
      totalPolicies: policies.length,
      activePolicies: policies.filter(p => p.isActive).length,
      lastExecution: policies.length > 0 
        ? new Date(Math.max(...policies.map(p => p.lastExecutedAt?.getTime() || 0)))
        : null,
      totalRecordsProcessed: policies.reduce((sum, p) => sum + p.recordsProcessed, 0),
      totalRecordsDeleted: policies.reduce((sum, p) => sum + p.recordsDeleted, 0),
      dataTypeBreakdown: {} as any,
    };

    // Initialize data type breakdown
    Object.values(DataType).forEach(dataType => {
      const typePolicies = policies.filter(p => p.dataType === dataType);
      stats.dataTypeBreakdown[dataType] = {
        policies: typePolicies.length,
        recordsProcessed: typePolicies.reduce((sum, p) => sum + p.recordsProcessed, 0),
        recordsDeleted: typePolicies.reduce((sum, p) => sum + p.recordsDeleted, 0),
      };
    });

    return stats;
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async executeScheduledRetentionPolicies(): Promise<void> {
    this.logger.log('Starting scheduled retention policy execution');

    const activePolicies = await this.retentionPolicyRepository.find({
      where: { isActive: true },
    });

    for (const policy of activePolicies) {
      try {
        await this.executeRetentionPolicy(policy.id, policy.organizationId);
        this.logger.log(`Successfully executed retention policy ${policy.id}`);
      } catch (error) {
        this.logger.error(`Failed to execute retention policy ${policy.id}:`, error);
      }
    }

    this.logger.log('Completed scheduled retention policy execution');
  }

  private calculateCutoffDate(retentionPeriod: RetentionPeriod): Date {
    const now = new Date();
    
    switch (retentionPeriod) {
      case RetentionPeriod.DAYS_7:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case RetentionPeriod.DAYS_30:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case RetentionPeriod.DAYS_90:
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case RetentionPeriod.DAYS_180:
        return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      case RetentionPeriod.DAYS_365:
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      case RetentionPeriod.DAYS_730:
        return new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
      case RetentionPeriod.PERMANENT:
        return new Date(0); // Never delete
      default:
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // Default to 1 year
    }
  }

  private async findRecordsToProcess(
    dataType: DataType,
    organizationId: string,
    cutoffDate: Date,
    conditions: Record<string, any>,
  ): Promise<any[]> {
    // This is a simplified implementation
    // In a real application, you would query the appropriate repository based on dataType
    switch (dataType) {
      case DataType.USER_PROFILE:
        // Query user profiles
        return [];
      case DataType.CONTENT_GENERATION:
        // Query content generation records
        return [];
      case DataType.PUBLISHED_CONTENT:
        // Query published content
        return [];
      case DataType.ANALYTICS_DATA:
        // Query analytics data
        return [];
      case DataType.BILLING_DATA:
        // Query billing data
        return [];
      case DataType.SHARE_LINKS:
        // Query share links
        return [];
      case DataType.EXPERIMENT_DATA:
        // Query experiment data
        return [];
      case DataType.CONNECTOR_DATA:
        // Query connector data
        return [];
      case DataType.AUDIT_LOGS:
        // Query audit logs
        return [];
      case DataType.SYSTEM_LOGS:
        // Query system logs
        return [];
      default:
        return [];
    }
  }

  private async processRecord(record: any, action: RetentionAction): Promise<void> {
    switch (action) {
      case RetentionAction.DELETE:
        // Delete the record
        // await this.deleteRecord(record);
        break;
      case RetentionAction.ANONYMIZE:
        // Anonymize the record
        // await this.anonymizeRecord(record);
        break;
      case RetentionAction.ARCHIVE:
        // Archive the record
        // await this.archiveRecord(record);
        break;
      case RetentionAction.MOVE_TO_COLD_STORAGE:
        // Move to cold storage
        // await this.moveToColdStorage(record);
        break;
      default:
        throw new Error(`Unknown retention action: ${action}`);
    }
  }
}
