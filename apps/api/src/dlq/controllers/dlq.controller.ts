import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DLQService } from '../services/dlq.service';
import { DLQMessage, DLQMessageType, DLQMessageStatus } from '../entities/dlq-message.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

// DTOs for request/response
export class ProcessDLQMessageDto {
  processor: string; // Type of processor to use
  context?: Record<string, any>;
}

export class UpdateDLQMessageDto {
  status?: DLQMessageStatus;
  resolutionNotes?: string;
  maxRetries?: number;
  expiresAt?: Date;
}

export class RetryDLQMessageDto {
  processor: string;
  context?: Record<string, any>;
}

@ApiTags('Dead Letter Queue')
@Controller('dlq')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DLQController {
  constructor(private readonly dlqService: DLQService) {}

  @Get('messages')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get DLQ messages' })
  @ApiResponse({ status: 200, description: 'DLQ messages retrieved successfully' })
  async getMessages(
    @Request() req,
    @Query('status') status?: DLQMessageStatus,
    @Query('type') type?: DLQMessageType,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ messages: DLQMessage[]; total: number }> {
    const organizationId = req.user.organizationId;
    const limitNum = Math.min(limit || 100, 1000);
    const offsetNum = offset || 0;

    let messages: DLQMessage[];
    
    if (status === DLQMessageStatus.PENDING) {
      messages = await this.dlqService.getPendingMessages(organizationId, type, limitNum);
    } else if (status === DLQMessageStatus.FAILED) {
      messages = await this.dlqService.getFailedMessages(organizationId, type, limitNum);
    } else {
      // Get all messages for the organization
      messages = await this.dlqService.getPendingMessages(organizationId, type, limitNum);
    }

    // Get total count for pagination
    const stats = await this.dlqService.getDLQStats(organizationId);
    const total = stats.total;

    return {
      messages: messages.slice(offsetNum, offsetNum + limitNum),
      total,
    };
  }

  @Get('messages/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get DLQ message details' })
  @ApiResponse({ status: 200, description: 'DLQ message details retrieved successfully' })
  async getMessage(@Request() req, @Param('id') id: string): Promise<DLQMessage> {
    const organizationId = req.user.organizationId;
    
    // In a real implementation, you would fetch the specific message
    // For now, return a mock message
    const mockMessage: DLQMessage = {
      id,
      organizationId,
      type: DLQMessageType.CONTENT_GENERATION,
      status: DLQMessageStatus.PENDING,
      originalMessage: '{"briefId": "brief-123", "platform": "twitter"}',
      messageData: {
        briefId: 'brief-123',
        platform: 'twitter',
        userId: 'user-123',
      },
      errorMessage: 'Content generation failed due to API rate limit',
      errorStack: 'Error: Rate limit exceeded...',
      errorContext: {
        name: 'RateLimitError',
        retryCount: 3,
      },
      retryCount: 2,
      maxRetries: 3,
      nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      lastRetryAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      retryHistory: [
        {
          attempt: 1,
          timestamp: new Date(Date.now() - 20 * 60 * 1000),
          error: 'API timeout',
        },
        {
          attempt: 2,
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          error: 'Rate limit exceeded',
        },
      ],
      sourceQueue: 'content-generation',
      sourceSubject: 'content.generate',
      metadata: {
        priority: 'high',
        campaign: 'summer-2024',
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      updatedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    };

    return mockMessage;
  }

  @Post('messages/:id/process')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Process a DLQ message' })
  @ApiResponse({ status: 200, description: 'DLQ message processed successfully' })
  async processMessage(
    @Request() req,
    @Param('id') id: string,
    @Body() processDto: ProcessDLQMessageDto,
  ): Promise<{ success: boolean; message: string; retryCount?: number; nextRetryAt?: Date }> {
    const organizationId = req.user.organizationId;

    // Define processor based on message type
    const processor = async (message: DLQMessage) => {
      switch (message.type) {
        case DLQMessageType.CONTENT_GENERATION:
          // Process content generation message
          await this.processContentGenerationMessage(message, processDto.context);
          break;
        case DLQMessageType.POLICY_CHECK:
          // Process policy check message
          await this.processPolicyCheckMessage(message, processDto.context);
          break;
        case DLQMessageType.PUBLISH:
          // Process publish message
          await this.processPublishMessage(message, processDto.context);
          break;
        case DLQMessageType.METRICS_INGESTION:
          // Process metrics ingestion message
          await this.processMetricsIngestionMessage(message, processDto.context);
          break;
        default:
          throw new Error(`Unknown message type: ${message.type}`);
      }
    };

    return this.dlqService.processDLQMessage(id, processor);
  }

  @Post('messages/:id/retry')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Retry a DLQ message' })
  @ApiResponse({ status: 200, description: 'DLQ message retry initiated successfully' })
  async retryMessage(
    @Request() req,
    @Param('id') id: string,
    @Body() retryDto: RetryDLQMessageDto,
  ): Promise<{ success: boolean; message: string; retryCount?: number; nextRetryAt?: Date }> {
    const organizationId = req.user.organizationId;

    // This is similar to process but with different context
    const processor = async (message: DLQMessage) => {
      // Add retry-specific logic here
      await this.processMessage(req, id, { processor: retryDto.processor, context: retryDto.context });
    };

    return this.dlqService.processDLQMessage(id, processor);
  }

  @Put('messages/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a DLQ message' })
  @ApiResponse({ status: 200, description: 'DLQ message updated successfully' })
  async updateMessage(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateDLQMessageDto,
  ): Promise<DLQMessage> {
    const organizationId = req.user.organizationId;

    // In a real implementation, you would update the message
    // For now, return a mock updated message
    const mockMessage: DLQMessage = {
      id,
      organizationId,
      type: DLQMessageType.CONTENT_GENERATION,
      status: updateDto.status || DLQMessageStatus.PENDING,
      originalMessage: '{"briefId": "brief-123", "platform": "twitter"}',
      messageData: {
        briefId: 'brief-123',
        platform: 'twitter',
      },
      errorMessage: 'Content generation failed due to API rate limit',
      errorStack: 'Error: Rate limit exceeded...',
      errorContext: {},
      retryCount: 2,
      maxRetries: updateDto.maxRetries || 3,
      nextRetryAt: new Date(Date.now() + 5 * 60 * 1000),
      lastRetryAt: new Date(Date.now() - 10 * 60 * 1000),
      retryHistory: [],
      sourceQueue: 'content-generation',
      sourceSubject: 'content.generate',
      metadata: {},
      expiresAt: updateDto.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      resolutionNotes: updateDto.resolutionNotes,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      updatedAt: new Date(),
    };

    return mockMessage;
  }

  @Delete('messages/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a DLQ message' })
  @ApiResponse({ status: 204, description: 'DLQ message deleted successfully' })
  async deleteMessage(@Request() req, @Param('id') id: string): Promise<void> {
    const organizationId = req.user.organizationId;
    await this.dlqService.deleteMessage(id);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get DLQ statistics' })
  @ApiResponse({ status: 200, description: 'DLQ statistics retrieved successfully' })
  async getStats(@Request() req): Promise<{
    total: number;
    pending: number;
    processing: number;
    failed: number;
    resolved: number;
    expired: number;
    byType: Record<string, number>;
  }> {
    const organizationId = req.user.organizationId;
    return this.dlqService.getDLQStats(organizationId);
  }

  @Post('cleanup/expired')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Clean up expired DLQ messages' })
  @ApiResponse({ status: 200, description: 'Expired messages cleaned up successfully' })
  async cleanupExpiredMessages(@Request() req): Promise<{ cleaned: number }> {
    const organizationId = req.user.organizationId;
    const cleaned = await this.dlqService.cleanupExpiredMessages();
    return { cleaned };
  }

  @Get('ready-to-retry')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get messages ready to retry' })
  @ApiResponse({ status: 200, description: 'Ready to retry messages retrieved successfully' })
  async getReadyToRetryMessages(
    @Request() req,
    @Query('limit') limit?: number,
  ): Promise<DLQMessage[]> {
    const organizationId = req.user.organizationId;
    const limitNum = Math.min(limit || 100, 1000);
    return this.dlqService.getReadyToRetryMessages(limitNum);
  }

  @Post('bulk/process')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Process multiple DLQ messages' })
  @ApiResponse({ status: 200, description: 'Bulk processing completed' })
  async bulkProcessMessages(
    @Request() req,
    @Body() body: {
      messageIds: string[];
      processor: string;
      context?: Record<string, any>;
    },
  ): Promise<{
    processed: number;
    failed: number;
    results: Array<{ messageId: string; success: boolean; message: string }>;
  }> {
    const organizationId = req.user.organizationId;
    const { messageIds, processor, context } = body;

    const results = [];
    let processed = 0;
    let failed = 0;

    for (const messageId of messageIds) {
      try {
        const processorFn = async (message: DLQMessage) => {
          switch (message.type) {
            case DLQMessageType.CONTENT_GENERATION:
              await this.processContentGenerationMessage(message, context);
              break;
            case DLQMessageType.POLICY_CHECK:
              await this.processPolicyCheckMessage(message, context);
              break;
            case DLQMessageType.PUBLISH:
              await this.processPublishMessage(message, context);
              break;
            case DLQMessageType.METRICS_INGESTION:
              await this.processMetricsIngestionMessage(message, context);
              break;
            default:
              throw new Error(`Unknown message type: ${message.type}`);
          }
        };

        const result = await this.dlqService.processDLQMessage(messageId, processorFn);
        
        results.push({
          messageId,
          success: result.success,
          message: result.message,
        });

        if (result.success) {
          processed++;
        } else {
          failed++;
        }
      } catch (error) {
        results.push({
          messageId,
          success: false,
          message: error.message,
        });
        failed++;
      }
    }

    return {
      processed,
      failed,
      results,
    };
  }

  // Mock processor methods
  private async processContentGenerationMessage(message: DLQMessage, context?: Record<string, any>): Promise<void> {
    // Simulate content generation processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (Math.random() < 0.1) { // 10% chance of failure
      throw new Error('Content generation still failing');
    }
  }

  private async processPolicyCheckMessage(message: DLQMessage, context?: Record<string, any>): Promise<void> {
    // Simulate policy check processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (Math.random() < 0.05) { // 5% chance of failure
      throw new Error('Policy check still failing');
    }
  }

  private async processPublishMessage(message: DLQMessage, context?: Record<string, any>): Promise<void> {
    // Simulate publish processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (Math.random() < 0.15) { // 15% chance of failure
      throw new Error('Publish still failing');
    }
  }

  private async processMetricsIngestionMessage(message: DLQMessage, context?: Record<string, any>): Promise<void> {
    // Simulate metrics ingestion processing
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (Math.random() < 0.02) { // 2% chance of failure
      throw new Error('Metrics ingestion still failing');
    }
  }
}
