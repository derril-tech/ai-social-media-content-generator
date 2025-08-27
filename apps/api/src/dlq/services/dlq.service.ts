import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { DLQMessage, DLQMessageStatus, DLQMessageType } from '../entities/dlq-message.entity';
import { ObservabilityService } from '../../observability/services/observability.service';

export interface DLQRetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean;
}

export interface DLQProcessingResult {
  success: boolean;
  message: string;
  retryCount?: number;
  nextRetryAt?: Date;
}

@Injectable()
export class DLQService {
  private readonly logger = new Logger(DLQService.name);

  private readonly defaultRetryConfig: DLQRetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 300000, // 5 minutes
    backoffMultiplier: 2,
    jitter: true,
  };

  constructor(
    @InjectRepository(DLQMessage)
    private readonly dlqMessageRepository: Repository<DLQMessage>,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async addToDLQ(
    organizationId: string,
    type: DLQMessageType,
    originalMessage: string,
    error: Error,
    context: {
      messageData?: Record<string, any>;
      sourceQueue?: string;
      sourceSubject?: string;
      metadata?: Record<string, any>;
      maxRetries?: number;
      expiresAt?: Date;
    } = {},
  ): Promise<DLQMessage> {
    const dlqMessage = this.dlqMessageRepository.create({
      organizationId,
      type,
      status: DLQMessageStatus.PENDING,
      originalMessage,
      messageData: context.messageData,
      errorMessage: error.message,
      errorStack: error.stack,
      errorContext: {
        name: error.name,
        ...context,
      },
      maxRetries: context.maxRetries || this.defaultRetryConfig.maxRetries,
      sourceQueue: context.sourceQueue,
      sourceSubject: context.sourceSubject,
      metadata: context.metadata,
      expiresAt: context.expiresAt || this.calculateExpirationDate(),
    });

    const savedMessage = await this.dlqMessageRepository.save(dlqMessage);

    this.logger.warn('Message added to DLQ', {
      organizationId,
      messageId: savedMessage.id,
      type,
      error: error.message,
      retryCount: 0,
    });

    // Send alert for new DLQ message
    await this.observabilityService.triggerAlert(organizationId, {
      title: 'Message Added to Dead Letter Queue',
      message: `A ${type} message failed processing and was added to DLQ`,
      severity: 'medium',
      source: 'dlq-service',
      tags: {
        messageType: type,
        messageId: savedMessage.id,
        errorType: error.name,
      },
      context: {
        error: error.message,
        retryCount: 0,
        maxRetries: savedMessage.maxRetries,
      },
    });

    return savedMessage;
  }

  async processDLQMessage(
    messageId: string,
    processor: (message: DLQMessage) => Promise<void>,
  ): Promise<DLQProcessingResult> {
    const message = await this.dlqMessageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      return {
        success: false,
        message: 'Message not found',
      };
    }

    if (message.status === DLQMessageStatus.RESOLVED) {
      return {
        success: true,
        message: 'Message already resolved',
      };
    }

    if (message.status === DLQMessageStatus.EXPIRED) {
      return {
        success: false,
        message: 'Message has expired',
      };
    }

    if (message.retryCount >= message.maxRetries) {
      await this.markAsFailed(message, 'Max retries exceeded');
      return {
        success: false,
        message: 'Max retries exceeded',
        retryCount: message.retryCount,
      };
    }

    // Check if it's time to retry
    if (message.nextRetryAt && message.nextRetryAt > new Date()) {
      return {
        success: false,
        message: 'Not yet time to retry',
        nextRetryAt: message.nextRetryAt,
      };
    }

    try {
      // Mark as processing
      await this.dlqMessageRepository.update(messageId, {
        status: DLQMessageStatus.PROCESSING,
        lastRetryAt: new Date(),
      });

      // Process the message
      await processor(message);

      // Mark as resolved
      await this.markAsResolved(message, 'Successfully processed');

      this.logger.log('DLQ message processed successfully', {
        messageId,
        type: message.type,
        organizationId: message.organizationId,
        retryCount: message.retryCount,
      });

      return {
        success: true,
        message: 'Message processed successfully',
        retryCount: message.retryCount,
      };
    } catch (error) {
      // Increment retry count and calculate next retry time
      const newRetryCount = message.retryCount + 1;
      const nextRetryAt = this.calculateNextRetryTime(newRetryCount);

      // Update retry history
      const retryHistory = message.retryHistory || [];
      retryHistory.push({
        attempt: newRetryCount,
        timestamp: new Date(),
        error: error.message,
        context: {
          name: error.name,
          stack: error.stack,
        },
      });

      // Update message
      await this.dlqMessageRepository.update(messageId, {
        status: newRetryCount >= message.maxRetries ? DLQMessageStatus.FAILED : DLQMessageStatus.PENDING,
        retryCount: newRetryCount,
        nextRetryAt,
        retryHistory,
        errorMessage: error.message,
        errorStack: error.stack,
        errorContext: {
          name: error.name,
          lastAttempt: new Date(),
        },
      });

      this.logger.error('DLQ message processing failed', {
        messageId,
        type: message.type,
        organizationId: message.organizationId,
        retryCount: newRetryCount,
        error: error.message,
        nextRetryAt,
      });

      // Send alert for failed processing
      if (newRetryCount >= message.maxRetries) {
        await this.observabilityService.triggerAlert(message.organizationId, {
          title: 'DLQ Message Failed After Max Retries',
          message: `A ${message.type} message failed processing after ${newRetries} attempts`,
          severity: 'high',
          source: 'dlq-service',
          tags: {
            messageType: message.type,
            messageId: message.id,
            retryCount: newRetryCount,
          },
          context: {
            error: error.message,
            maxRetries: message.maxRetries,
            lastAttempt: new Date(),
          },
        });
      }

      return {
        success: false,
        message: error.message,
        retryCount: newRetryCount,
        nextRetryAt,
      };
    }
  }

  async getPendingMessages(
    organizationId?: string,
    type?: DLQMessageType,
    limit: number = 100,
  ): Promise<DLQMessage[]> {
    const where: any = {
      status: DLQMessageStatus.PENDING,
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (type) {
      where.type = type;
    }

    return this.dlqMessageRepository.find({
      where,
      order: {
        createdAt: 'ASC',
      },
      take: limit,
    });
  }

  async getReadyToRetryMessages(limit: number = 100): Promise<DLQMessage[]> {
    return this.dlqMessageRepository.find({
      where: [
        {
          status: DLQMessageStatus.PENDING,
          nextRetryAt: LessThan(new Date()),
        },
        {
          status: DLQMessageStatus.PENDING,
          nextRetryAt: null,
        },
      ],
      order: {
        createdAt: 'ASC',
      },
      take: limit,
    });
  }

  async getFailedMessages(
    organizationId?: string,
    type?: DLQMessageType,
    limit: number = 100,
  ): Promise<DLQMessage[]> {
    const where: any = {
      status: DLQMessageStatus.FAILED,
    };

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (type) {
      where.type = type;
    }

    return this.dlqMessageRepository.find({
      where,
      order: {
        lastRetryAt: 'DESC',
      },
      take: limit,
    });
  }

  async getExpiredMessages(limit: number = 100): Promise<DLQMessage[]> {
    return this.dlqMessageRepository.find({
      where: {
        status: DLQMessageStatus.PENDING,
        expiresAt: LessThan(new Date()),
      },
      order: {
        createdAt: 'ASC',
      },
      take: limit,
    });
  }

  async markAsResolved(message: DLQMessage, notes?: string): Promise<void> {
    await this.dlqMessageRepository.update(message.id, {
      status: DLQMessageStatus.RESOLVED,
      processedAt: new Date(),
      resolutionNotes: notes,
    });

    this.logger.log('DLQ message marked as resolved', {
      messageId: message.id,
      type: message.type,
      organizationId: message.organizationId,
      notes,
    });
  }

  async markAsFailed(message: DLQMessage, reason: string): Promise<void> {
    await this.dlqMessageRepository.update(message.id, {
      status: DLQMessageStatus.FAILED,
      resolutionNotes: reason,
    });

    this.logger.warn('DLQ message marked as failed', {
      messageId: message.id,
      type: message.type,
      organizationId: message.organizationId,
      reason,
    });
  }

  async markAsExpired(message: DLQMessage): Promise<void> {
    await this.dlqMessageRepository.update(message.id, {
      status: DLQMessageStatus.EXPIRED,
      resolutionNotes: 'Message expired',
    });

    this.logger.warn('DLQ message marked as expired', {
      messageId: message.id,
      type: message.type,
      organizationId: message.organizationId,
    });
  }

  async deleteMessage(messageId: string): Promise<void> {
    await this.dlqMessageRepository.delete(messageId);

    this.logger.log('DLQ message deleted', {
      messageId,
    });
  }

  async getDLQStats(organizationId?: string): Promise<{
    total: number;
    pending: number;
    processing: number;
    failed: number;
    resolved: number;
    expired: number;
    byType: Record<string, number>;
  }> {
    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }

    const [total, pending, processing, failed, resolved, expired] = await Promise.all([
      this.dlqMessageRepository.count({ where }),
      this.dlqMessageRepository.count({ where: { ...where, status: DLQMessageStatus.PENDING } }),
      this.dlqMessageRepository.count({ where: { ...where, status: DLQMessageStatus.PROCESSING } }),
      this.dlqMessageRepository.count({ where: { ...where, status: DLQMessageStatus.FAILED } }),
      this.dlqMessageRepository.count({ where: { ...where, status: DLQMessageStatus.RESOLVED } }),
      this.dlqMessageRepository.count({ where: { ...where, status: DLQMessageStatus.EXPIRED } }),
    ]);

    // Get counts by type
    const typeStats = await this.dlqMessageRepository
      .createQueryBuilder('message')
      .select('message.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where(organizationId ? 'message.organizationId = :organizationId' : '1=1', { organizationId })
      .groupBy('message.type')
      .getRawMany();

    const byType: Record<string, number> = {};
    typeStats.forEach((stat: any) => {
      byType[stat.type] = parseInt(stat.count);
    });

    return {
      total,
      pending,
      processing,
      failed,
      resolved,
      expired,
      byType,
    };
  }

  async cleanupExpiredMessages(): Promise<number> {
    const expiredMessages = await this.getExpiredMessages(1000);
    
    for (const message of expiredMessages) {
      await this.markAsExpired(message);
    }

    this.logger.log('Cleaned up expired DLQ messages', {
      count: expiredMessages.length,
    });

    return expiredMessages.length;
  }

  private calculateNextRetryTime(retryCount: number): Date {
    const config = this.defaultRetryConfig;
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, retryCount - 1);
    
    // Cap at max delay
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter if enabled
    if (config.jitter) {
      const jitter = delay * 0.1; // 10% jitter
      delay += Math.random() * jitter;
    }

    return new Date(Date.now() + delay);
  }

  private calculateExpirationDate(): Date {
    // Default expiration: 7 days from now
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
}
