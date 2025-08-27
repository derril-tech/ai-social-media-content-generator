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
import { ObservabilityService, AlertRule, NotificationChannel, Alert } from '../services/observability.service';
import { SentryService } from '../services/sentry.service';
import { PagerDutyService } from '../services/pagerduty.service';
import { SlackService } from '../services/slack.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

// DTOs for request/response
export class CreateAlertRuleDto {
  name: string;
  description: string;
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
    threshold: number;
    duration: number;
  };
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  actions: {
    sentry?: boolean;
    pagerduty?: boolean;
    slack?: boolean;
    email?: boolean;
  };
  tags: Record<string, string>;
}

export class UpdateAlertRuleDto extends CreateAlertRuleDto {}

export class CreateNotificationChannelDto {
  name: string;
  type: 'slack' | 'email' | 'webhook' | 'pagerduty';
  config: Record<string, any>;
  enabled: boolean;
  recipients?: string[];
}

export class UpdateNotificationChannelDto extends CreateNotificationChannelDto {}

export class TriggerAlertDto {
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  tags?: Record<string, string>;
  context?: Record<string, any>;
}

export class CaptureMetricDto {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp?: Date;
}

export class UpdateObservabilityConfigDto {
  enableAlerting?: boolean;
  enableNotifications?: boolean;
  enableMetrics?: boolean;
  enableTracing?: boolean;
  alertProvider?: 'sentry' | 'pagerduty' | 'custom';
  notificationProvider?: 'slack' | 'email' | 'webhook';
  retentionDays?: number;
  samplingRate?: number;
}

@ApiTags('Observability')
@Controller('observability')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ObservabilityController {
  constructor(
    private readonly observabilityService: ObservabilityService,
    private readonly sentryService: SentryService,
    private readonly pagerDutyService: PagerDutyService,
    private readonly slackService: SlackService,
  ) {}

  @Get('config')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get observability configuration' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved successfully' })
  async getConfig(@Request() req) {
    const organizationId = req.user.organizationId;
    return this.observabilityService.getConfig(organizationId);
  }

  @Put('config')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update observability configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  async updateConfig(
    @Request() req,
    @Body() updateDto: UpdateObservabilityConfigDto,
  ) {
    const organizationId = req.user.organizationId;
    return this.observabilityService.updateConfig(organizationId, updateDto);
  }

  // Alert Rules
  @Get('alert-rules')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all alert rules' })
  @ApiResponse({ status: 200, description: 'Alert rules retrieved successfully' })
  async getAlertRules(@Request() req): Promise<AlertRule[]> {
    const organizationId = req.user.organizationId;
    return this.observabilityService.getAlertRules(organizationId);
  }

  @Post('alert-rules')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new alert rule' })
  @ApiResponse({ status: 201, description: 'Alert rule created successfully' })
  async createAlertRule(
    @Request() req,
    @Body() createDto: CreateAlertRuleDto,
  ): Promise<AlertRule> {
    const organizationId = req.user.organizationId;
    return this.observabilityService.createAlertRule(organizationId, createDto);
  }

  @Put('alert-rules/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an alert rule' })
  @ApiResponse({ status: 200, description: 'Alert rule updated successfully' })
  async updateAlertRule(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateAlertRuleDto,
  ): Promise<AlertRule> {
    const organizationId = req.user.organizationId;
    return this.observabilityService.updateAlertRule(organizationId, id, updateDto);
  }

  @Delete('alert-rules/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an alert rule' })
  @ApiResponse({ status: 204, description: 'Alert rule deleted successfully' })
  async deleteAlertRule(
    @Request() req,
    @Param('id') id: string,
  ): Promise<void> {
    const organizationId = req.user.organizationId;
    await this.observabilityService.deleteAlertRule(organizationId, id);
  }

  // Notification Channels
  @Get('notification-channels')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all notification channels' })
  @ApiResponse({ status: 200, description: 'Notification channels retrieved successfully' })
  async getNotificationChannels(@Request() req): Promise<NotificationChannel[]> {
    const organizationId = req.user.organizationId;
    return this.observabilityService.getNotificationChannels(organizationId);
  }

  @Post('notification-channels')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new notification channel' })
  @ApiResponse({ status: 201, description: 'Notification channel created successfully' })
  async createNotificationChannel(
    @Request() req,
    @Body() createDto: CreateNotificationChannelDto,
  ): Promise<NotificationChannel> {
    const organizationId = req.user.organizationId;
    return this.observabilityService.createNotificationChannel(organizationId, createDto);
  }

  @Put('notification-channels/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a notification channel' })
  @ApiResponse({ status: 200, description: 'Notification channel updated successfully' })
  async updateNotificationChannel(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateNotificationChannelDto,
  ): Promise<NotificationChannel> {
    const organizationId = req.user.organizationId;
    return this.observabilityService.updateNotificationChannel(organizationId, id, updateDto);
  }

  @Delete('notification-channels/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a notification channel' })
  @ApiResponse({ status: 204, description: 'Notification channel deleted successfully' })
  async deleteNotificationChannel(
    @Request() req,
    @Param('id') id: string,
  ): Promise<void> {
    const organizationId = req.user.organizationId;
    await this.observabilityService.deleteNotificationChannel(organizationId, id);
  }

  // Alerts
  @Post('alerts/trigger')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Trigger a manual alert' })
  @ApiResponse({ status: 201, description: 'Alert triggered successfully' })
  async triggerAlert(
    @Request() req,
    @Body() triggerDto: TriggerAlertDto,
  ): Promise<Alert> {
    const organizationId = req.user.organizationId;
    return this.observabilityService.triggerAlert(organizationId, triggerDto);
  }

  @Post('alerts/:id/acknowledge')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Acknowledge an alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged successfully' })
  async acknowledgeAlert(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { note?: string },
  ): Promise<void> {
    const organizationId = req.user.organizationId;
    const userId = req.user.id;
    await this.observabilityService.acknowledgeAlert(organizationId, id, userId, body.note);
  }

  @Post('alerts/:id/resolve')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Resolve an alert' })
  @ApiResponse({ status: 200, description: 'Alert resolved successfully' })
  async resolveAlert(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { resolution?: string },
  ): Promise<void> {
    const organizationId = req.user.organizationId;
    const userId = req.user.id;
    await this.observabilityService.resolveAlert(organizationId, id, userId, body.resolution);
  }

  @Get('alerts/stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get alert statistics' })
  @ApiResponse({ status: 200, description: 'Alert statistics retrieved successfully' })
  async getAlertStats(
    @Request() req,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const organizationId = req.user.organizationId;
    const timeRange = {
      start: new Date(start || Date.now() - 7 * 24 * 60 * 60 * 1000), // Default to 7 days ago
      end: new Date(end || Date.now()),
    };
    return this.observabilityService.getAlertStats(organizationId, timeRange);
  }

  // Metrics
  @Post('metrics/capture')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Capture a metric' })
  @ApiResponse({ status: 201, description: 'Metric captured successfully' })
  async captureMetric(
    @Request() req,
    @Body() captureDto: CaptureMetricDto,
  ): Promise<void> {
    const organizationId = req.user.organizationId;
    await this.observabilityService.captureMetric(organizationId, captureDto);
  }

  // Sentry Integration
  @Get('sentry/alerts')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get Sentry alerts' })
  @ApiResponse({ status: 200, description: 'Sentry alerts retrieved successfully' })
  async getSentryAlerts(
    @Request() req,
    @Query('status') status?: 'active' | 'resolved' | 'ignored',
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const organizationId = req.user.organizationId;
    return this.sentryService.getAlerts(organizationId, status, limit, offset);
  }

  @Get('sentry/alerts/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get Sentry alert details' })
  @ApiResponse({ status: 200, description: 'Sentry alert details retrieved successfully' })
  async getSentryAlertDetails(
    @Request() req,
    @Param('id') id: string,
  ) {
    const organizationId = req.user.organizationId;
    return this.sentryService.getAlertDetails(organizationId, id);
  }

  @Post('sentry/alerts/:id/resolve')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Resolve a Sentry alert' })
  @ApiResponse({ status: 200, description: 'Sentry alert resolved successfully' })
  async resolveSentryAlert(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ): Promise<void> {
    const organizationId = req.user.organizationId;
    await this.sentryService.resolveAlert(organizationId, id, body.reason);
  }

  @Post('sentry/alerts/:id/ignore')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Ignore a Sentry alert' })
  @ApiResponse({ status: 200, description: 'Sentry alert ignored successfully' })
  async ignoreSentryAlert(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ): Promise<void> {
    const organizationId = req.user.organizationId;
    await this.sentryService.ignoreAlert(organizationId, id, body.reason);
  }

  @Get('sentry/stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get Sentry error statistics' })
  @ApiResponse({ status: 200, description: 'Sentry error statistics retrieved successfully' })
  async getSentryStats(
    @Request() req,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const organizationId = req.user.organizationId;
    const timeRange = {
      start: new Date(start || Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(end || Date.now()),
    };
    return this.sentryService.getErrorStats(organizationId, timeRange);
  }

  // PagerDuty Integration
  @Get('pagerduty/incidents')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get PagerDuty incidents' })
  @ApiResponse({ status: 200, description: 'PagerDuty incidents retrieved successfully' })
  async getPagerDutyIncidents(
    @Request() req,
    @Query('status') status?: 'triggered' | 'acknowledged' | 'resolved',
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const organizationId = req.user.organizationId;
    return this.pagerDutyService.getIncidents(organizationId, status, limit, offset);
  }

  @Get('pagerduty/incidents/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get PagerDuty incident details' })
  @ApiResponse({ status: 200, description: 'PagerDuty incident details retrieved successfully' })
  async getPagerDutyIncidentDetails(
    @Request() req,
    @Param('id') id: string,
  ) {
    const organizationId = req.user.organizationId;
    return this.pagerDutyService.getIncidentDetails(organizationId, id);
  }

  @Post('pagerduty/incidents/:id/acknowledge')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Acknowledge a PagerDuty incident' })
  @ApiResponse({ status: 200, description: 'PagerDuty incident acknowledged successfully' })
  async acknowledgePagerDutyIncident(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { note?: string },
  ): Promise<void> {
    const organizationId = req.user.organizationId;
    const userId = req.user.id;
    await this.pagerDutyService.acknowledgeIncident(organizationId, id, userId, body.note);
  }

  @Post('pagerduty/incidents/:id/resolve')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Resolve a PagerDuty incident' })
  @ApiResponse({ status: 200, description: 'PagerDuty incident resolved successfully' })
  async resolvePagerDutyIncident(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { resolution?: string },
  ): Promise<void> {
    const organizationId = req.user.organizationId;
    const userId = req.user.id;
    await this.pagerDutyService.resolveIncident(organizationId, id, userId, body.resolution);
  }

  @Get('pagerduty/services')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get PagerDuty services' })
  @ApiResponse({ status: 200, description: 'PagerDuty services retrieved successfully' })
  async getPagerDutyServices(@Request() req) {
    const organizationId = req.user.organizationId;
    return this.pagerDutyService.getServices(organizationId);
  }

  @Get('pagerduty/oncall')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get PagerDuty on-call users' })
  @ApiResponse({ status: 200, description: 'PagerDuty on-call users retrieved successfully' })
  async getPagerDutyOnCallUsers(
    @Request() req,
    @Query('serviceId') serviceId?: string,
  ) {
    const organizationId = req.user.organizationId;
    return this.pagerDutyService.getOnCallUsers(organizationId, serviceId);
  }

  @Get('pagerduty/stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get PagerDuty incident statistics' })
  @ApiResponse({ status: 200, description: 'PagerDuty incident statistics retrieved successfully' })
  async getPagerDutyStats(
    @Request() req,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const organizationId = req.user.organizationId;
    const timeRange = {
      start: new Date(start || Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(end || Date.now()),
    };
    return this.pagerDutyService.getIncidentStats(organizationId, timeRange);
  }

  // Slack Integration
  @Get('slack/channels')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get Slack channels' })
  @ApiResponse({ status: 200, description: 'Slack channels retrieved successfully' })
  async getSlackChannels(@Request() req) {
    const organizationId = req.user.organizationId;
    return this.slackService.getChannels(organizationId);
  }

  @Get('slack/users')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get Slack users' })
  @ApiResponse({ status: 200, description: 'Slack users retrieved successfully' })
  async getSlackUsers(@Request() req) {
    const organizationId = req.user.organizationId;
    return this.slackService.getUsers(organizationId);
  }

  @Post('slack/send')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Send a Slack message' })
  @ApiResponse({ status: 201, description: 'Slack message sent successfully' })
  async sendSlackMessage(
    @Request() req,
    @Body() body: {
      channel?: string;
      text: string;
      blocks?: any[];
      attachments?: any[];
    },
  ) {
    const organizationId = req.user.organizationId;
    return this.slackService.sendMessage(organizationId, body);
  }

  @Post('slack/test')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Test Slack integration' })
  @ApiResponse({ status: 200, description: 'Slack integration tested successfully' })
  async testSlackIntegration(@Request() req) {
    const organizationId = req.user.organizationId;
    
    try {
      await this.slackService.sendNotification(
        organizationId,
        {
          type: 'info',
          title: '🧪 Slack Integration Test',
          message: 'This is a test message to verify Slack integration is working correctly.',
          fields: [
            { title: 'Test Time', value: new Date().toISOString(), short: true },
            { title: 'Status', value: '✅ Success', short: true },
          ],
          footer: 'AI Content Generator - Integration Test',
          timestamp: new Date(),
        },
      );
      
      return { success: true, message: 'Slack integration test completed successfully' };
    } catch (error) {
      throw new HttpException(
        { success: false, message: 'Slack integration test failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
