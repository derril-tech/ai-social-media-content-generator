import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DsrRequest, DsrRequestType, DsrRequestStatus, VerificationMethod } from '../entities/dsr-request.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';
import * as crypto from 'crypto';

export interface CreateDsrRequestDto {
  requestType: DsrRequestType;
  dataSubjectEmail: string;
  dataSubjectName?: string;
  dataSubjectPhone?: string;
  description?: string;
  dataTypes: string[];
  verificationMethod: VerificationMethod;
  verificationData: Record<string, any>;
}

export interface DsrRequestStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  rejectedRequests: number;
  averageProcessingTime: number;
  requestTypeBreakdown: Record<DsrRequestType, number>;
  statusBreakdown: Record<DsrRequestStatus, number>;
}

@Injectable()
export class DsrService {
  private readonly logger = new Logger(DsrService.name);

  constructor(
    @InjectRepository(DsrRequest)
    private readonly dsrRequestRepository: Repository<DsrRequest>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createDsrRequest(
    organizationId: string,
    request: CreateDsrRequestDto,
  ): Promise<DsrRequest> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`);
    }

    // Generate unique request ID
    const requestId = this.generateRequestId();

    // Set deadline (30 days from now for GDPR compliance)
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);

    const dsrRequest = this.dsrRequestRepository.create({
      requestId,
      ...request,
      organizationId,
      deadline,
      auditLog: [{
        timestamp: new Date(),
        action: 'request_created',
        performedBy: 'system',
        details: { requestType: request.requestType },
      }],
    });

    return await this.dsrRequestRepository.save(dsrRequest);
  }

  async getDsrRequests(
    organizationId: string,
    status?: DsrRequestStatus,
    requestType?: DsrRequestType,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ requests: DsrRequest[]; total: number }> {
    const queryBuilder = this.dsrRequestRepository
      .createQueryBuilder('request')
      .where('request.organizationId = :organizationId', { organizationId })
      .orderBy('request.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('request.status = :status', { status });
    }

    if (requestType) {
      queryBuilder.andWhere('request.requestType = :requestType', { requestType });
    }

    const [requests, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return { requests, total };
  }

  async getDsrRequest(
    requestId: string,
    organizationId: string,
  ): Promise<DsrRequest> {
    const request = await this.dsrRequestRepository.findOne({
      where: { requestId, organizationId },
    });

    if (!request) {
      throw new Error('DSR request not found');
    }

    return request;
  }

  async verifyDsrRequest(
    requestId: string,
    organizationId: string,
    verificationCode: string,
  ): Promise<DsrRequest> {
    const request = await this.getDsrRequest(requestId, organizationId);

    if (request.isVerified) {
      throw new Error('Request is already verified');
    }

    // Verify the verification code
    const isValid = await this.verifyCode(request, verificationCode);
    if (!isValid) {
      throw new Error('Invalid verification code');
    }

    request.isVerified = true;
    request.verifiedAt = new Date();
    request.verifiedBy = 'system';
    request.status = DsrRequestStatus.IN_PROGRESS;

    request.auditLog.push({
      timestamp: new Date(),
      action: 'request_verified',
      performedBy: 'system',
      details: { verificationMethod: request.verificationMethod },
    });

    return await this.dsrRequestRepository.save(request);
  }

  async processDsrRequest(
    requestId: string,
    organizationId: string,
    processedBy: string,
  ): Promise<DsrRequest> {
    const request = await this.getDsrRequest(requestId, organizationId);

    if (!request.isVerified) {
      throw new Error('Request must be verified before processing');
    }

    if (request.status !== DsrRequestStatus.IN_PROGRESS) {
      throw new Error('Request is not in progress');
    }

    try {
      // Process the request based on type
      const result = await this.processRequestByType(request);

      request.status = DsrRequestStatus.COMPLETED;
      request.completedAt = new Date();
      request.completedBy = processedBy;
      request.exportedData = result;

      if (result.exportFileUrl) {
        request.exportFileUrl = result.exportFileUrl;
        request.exportExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      }

      request.auditLog.push({
        timestamp: new Date(),
        action: 'request_completed',
        performedBy,
        details: { requestType: request.requestType },
      });

      return await this.dsrRequestRepository.save(request);
    } catch (error) {
      this.logger.error(`Error processing DSR request ${requestId}:`, error);
      
      request.status = DsrRequestStatus.REJECTED;
      request.rejectionReason = error.message;
      request.rejectedAt = new Date();
      request.rejectedBy = processedBy;

      request.auditLog.push({
        timestamp: new Date(),
        action: 'request_rejected',
        performedBy,
        details: { reason: error.message },
      });

      return await this.dsrRequestRepository.save(request);
    }
  }

  async rejectDsrRequest(
    requestId: string,
    organizationId: string,
    reason: string,
    rejectedBy: string,
  ): Promise<DsrRequest> {
    const request = await this.getDsrRequest(requestId, organizationId);

    request.status = DsrRequestStatus.REJECTED;
    request.rejectionReason = reason;
    request.rejectedAt = new Date();
    request.rejectedBy = rejectedBy;

    request.auditLog.push({
      timestamp: new Date(),
      action: 'request_rejected',
      performedBy: rejectedBy,
      details: { reason },
    });

    return await this.dsrRequestRepository.save(request);
  }

  async getDsrStats(organizationId: string): Promise<DsrRequestStats> {
    const requests = await this.dsrRequestRepository.find({
      where: { organizationId },
    });

    const stats: DsrRequestStats = {
      totalRequests: requests.length,
      pendingRequests: requests.filter(r => r.status === DsrRequestStatus.PENDING).length,
      completedRequests: requests.filter(r => r.status === DsrRequestStatus.COMPLETED).length,
      rejectedRequests: requests.filter(r => r.status === DsrRequestStatus.REJECTED).length,
      averageProcessingTime: this.calculateAverageProcessingTime(requests),
      requestTypeBreakdown: {} as any,
      statusBreakdown: {} as any,
    };

    // Initialize breakdowns
    Object.values(DsrRequestType).forEach(type => {
      stats.requestTypeBreakdown[type] = requests.filter(r => r.requestType === type).length;
    });

    Object.values(DsrRequestStatus).forEach(status => {
      stats.statusBreakdown[status] = requests.filter(r => r.status === status).length;
    });

    return stats;
  }

  private generateRequestId(): string {
    return `DSR-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  private async verifyCode(
    request: DsrRequest,
    verificationCode: string,
  ): Promise<boolean> {
    // This is a simplified verification
    // In a real implementation, you would verify against the stored verification data
    switch (request.verificationMethod) {
      case VerificationMethod.EMAIL:
        // Verify email verification code
        return verificationCode === '123456'; // Mock code
      case VerificationMethod.PHONE:
        // Verify SMS verification code
        return verificationCode === '123456'; // Mock code
      case VerificationMethod.ID_DOCUMENT:
        // Verify ID document
        return verificationCode === 'verified'; // Mock verification
      case VerificationMethod.ACCOUNT_ACCESS:
        // Verify account access
        return verificationCode === 'authenticated'; // Mock authentication
      default:
        return false;
    }
  }

  private async processRequestByType(request: DsrRequest): Promise<Record<string, any>> {
    switch (request.requestType) {
      case DsrRequestType.ACCESS:
        return await this.processAccessRequest(request);
      case DsrRequestType.RECTIFICATION:
        return await this.processRectificationRequest(request);
      case DsrRequestType.ERASURE:
        return await this.processErasureRequest(request);
      case DsrRequestType.PORTABILITY:
        return await this.processPortabilityRequest(request);
      case DsrRequestType.RESTRICTION:
        return await this.processRestrictionRequest(request);
      case DsrRequestType.OBJECTION:
        return await this.processObjectionRequest(request);
      case DsrRequestType.WITHDRAWAL:
        return await this.processWithdrawalRequest(request);
      default:
        throw new Error(`Unknown request type: ${request.requestType}`);
    }
  }

  private async processAccessRequest(request: DsrRequest): Promise<Record<string, any>> {
    // Mock implementation - in real app, you would collect all user data
    const userData = {
      profile: {
        name: 'John Doe',
        email: request.dataSubjectEmail,
        phone: '+1234567890',
        createdAt: new Date('2024-01-01'),
      },
      content: [
        { id: 'content-1', title: 'Sample Content', createdAt: new Date('2024-06-01') },
        { id: 'content-2', title: 'Another Content', createdAt: new Date('2024-07-01') },
      ],
      analytics: [
        { id: 'analytics-1', type: 'page_view', timestamp: new Date('2024-08-01') },
        { id: 'analytics-2', type: 'click', timestamp: new Date('2024-08-02') },
      ],
    };

    return {
      data: userData,
      exportFileUrl: `https://example.com/exports/${request.requestId}.json`,
    };
  }

  private async processRectificationRequest(request: DsrRequest): Promise<Record<string, any>> {
    // Mock implementation - in real app, you would update user data
    return {
      message: 'Data rectification completed',
      updatedFields: request.verificationData.rectificationFields || [],
    };
  }

  private async processErasureRequest(request: DsrRequest): Promise<Record<string, any>> {
    // Mock implementation - in real app, you would delete user data
    return {
      message: 'Data erasure completed',
      deletedRecords: 150,
    };
  }

  private async processPortabilityRequest(request: DsrRequest): Promise<Record<string, any>> {
    // Mock implementation - in real app, you would export user data
    return {
      message: 'Data portability export completed',
      exportFileUrl: `https://example.com/exports/${request.requestId}.zip`,
    };
  }

  private async processRestrictionRequest(request: DsrRequest): Promise<Record<string, any>> {
    // Mock implementation - in real app, you would restrict data processing
    return {
      message: 'Data processing restriction applied',
      restrictedDataTypes: request.dataTypes,
    };
  }

  private async processObjectionRequest(request: DsrRequest): Promise<Record<string, any>> {
    // Mock implementation - in real app, you would stop processing
    return {
      message: 'Data processing objection recorded',
      objectionReason: request.description,
    };
  }

  private async processWithdrawalRequest(request: DsrRequest): Promise<Record<string, any>> {
    // Mock implementation - in real app, you would withdraw consent
    return {
      message: 'Consent withdrawal processed',
      withdrawnConsents: request.dataTypes,
    };
  }

  private calculateAverageProcessingTime(requests: DsrRequest[]): number {
    const completedRequests = requests.filter(r => 
      r.status === DsrRequestStatus.COMPLETED && r.completedAt && r.createdAt
    );

    if (completedRequests.length === 0) {
      return 0;
    }

    const totalTime = completedRequests.reduce((sum, request) => {
      return sum + (request.completedAt!.getTime() - request.createdAt.getTime());
    }, 0);

    return totalTime / completedRequests.length;
  }
}
