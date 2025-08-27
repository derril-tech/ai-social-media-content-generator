import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelemetryConfig } from '../entities/telemetry-config.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { SentryService } from './sentry.service';
import { PagerDutyService } from './pagerduty.service';
import { SlackService } from './slack.service';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
    threshold: number;
    duration: number; // seconds
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
  createdAt: Date;
  updatedAt: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'acknowledged' | 'resolved';
  source: string;
  tags: Record<string, string>;
  context: Record<string, any>;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  resolvedBy?: string;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'slack' | 'email' | 'webhook' | 'pagerduty';
  config: Record<string, any>;
  enabled: boolean;
  recipients?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ObservabilityConfig {
  organizationId: string;
  enableAlerting: boolean;
  enableNotifications: boolean;
  enableMetrics: boolean;
  enableTracing: boolean;
  alertProvider: 'sentry' | 'pagerduty' | 'custom';
  notificationProvider: 'slack' | 'email' | 'webhook';
  alertRules: AlertRule[];
  notificationChannels: NotificationChannel[];
  retentionDays: number;
  samplingRate: number;
}

@Injectable()
export class ObservabilityService {
  private readonly logger = new Logger(ObservabilityService.name);

  constructor(
    @InjectRepository(TelemetryConfig)
    private readonly telemetryConfigRepository: Repository<TelemetryConfig>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly sentryService: SentryService,
    private readonly pagerDutyService: PagerDutyService,
    private readonly slackService: SlackService,
  ) {}

  async getConfig(organizationId: string): Promise<ObservabilityConfig | null> {
    const config = await this.telemetryConfigRepository.findOne({
      where: { organizationId, isActive: true },
    });

    if (!config) {
      return null;
    }

    return {
      organizationId,
      enableAlerting: config.enableAlerting,
      enableNotifications: config.enableNotifications,
      enableMetrics: config.enableMetrics,
      enableTracing: config.enableTracing,
      alertProvider: config.alertProvider,
      notificationProvider: config.notificationProvider,
      alertRules: config.alertRules || [],
      notificationChannels: config.notificationChannels || [],
      retentionDays: config.retentionDays || 30,
      samplingRate: config.samplingRate || 1.0,
    };
  }

  async updateConfig(
    organizationId: string,
    updates: Partial<ObservabilityConfig>,
  ): Promise<ObservabilityConfig> {
    let config = await this.telemetryConfigRepository.findOne({
      where: { organizationId, isActive: true },
    });

    if (!config) {
      config = this.telemetryConfigRepository.create({
        organizationId,
        isActive: true,
        ...updates,
      });
    } else {
      Object.assign(config, updates);
    }

    await this.telemetryConfigRepository.save(config);
    return this.getConfig(organizationId);
  }

  async createAlertRule(
    organizationId: string,
    rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<AlertRule> {
    const config = await this.getConfig(organizationId);
    if (!config) {
      throw new Error('Observability not configured for this organization');
    }

    const newRule: AlertRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    config.alertRules.push(newRule);
    await this.updateConfig(organizationId, { alertRules: config.alertRules });

    this.logger.log('Alert rule created', {
      organizationId,
      ruleId: newRule.id,
      name: newRule.name,
      severity: newRule.severity,
    });

    return newRule;
  }

  async updateAlertRule(
    organizationId: string,
    ruleId: string,
    updates: Partial<AlertRule>,
  ): Promise<AlertRule> {
    const config = await this.getConfig(organizationId);
    if (!config) {
      throw new Error('Observability not configured for this organization');
    }

    const ruleIndex = config.alertRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) {
      throw new Error('Alert rule not found');
    }

    config.alertRules[ruleIndex] = {
      ...config.alertRules[ruleIndex],
      ...updates,
      updatedAt: new Date(),
    };

    await this.updateConfig(organizationId, { alertRules: config.alertRules });

    this.logger.log('Alert rule updated', {
      organizationId,
      ruleId,
      name: config.alertRules[ruleIndex].name,
    });

    return config.alertRules[ruleIndex];
  }

  async deleteAlertRule(organizationId: string, ruleId: string): Promise<void> {
    const config = await this.getConfig(organizationId);
    if (!config) {
      throw new Error('Observability not configured for this organization');
    }

    const ruleIndex = config.alertRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) {
      throw new Error('Alert rule not found');
    }

    config.alertRules.splice(ruleIndex, 1);
    await this.updateConfig(organizationId, { alertRules: config.alertRules });

    this.logger.log('Alert rule deleted', {
      organizationId,
      ruleId,
    });
  }

  async getAlertRules(organizationId: string): Promise<AlertRule[]> {
    const config = await this.getConfig(organizationId);
    return config?.alertRules || [];
  }

  async createNotificationChannel(
    organizationId: string,
    channel: Omit<NotificationChannel, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<NotificationChannel> {
    const config = await this.getConfig(organizationId);
    if (!config) {
      throw new Error('Observability not configured for this organization');
    }

    const newChannel: NotificationChannel = {
      ...channel,
      id: `channel-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    config.notificationChannels.push(newChannel);
    await this.updateConfig(organizationId, { notificationChannels: config.notificationChannels });

    this.logger.log('Notification channel created', {
      organizationId,
      channelId: newChannel.id,
      name: newChannel.name,
      type: newChannel.type,
    });

    return newChannel;
  }

  async updateNotificationChannel(
    organizationId: string,
    channelId: string,
    updates: Partial<NotificationChannel>,
  ): Promise<NotificationChannel> {
    const config = await this.getConfig(organizationId);
    if (!config) {
      throw new Error('Observability not configured for this organization');
    }

    const channelIndex = config.notificationChannels.findIndex(channel => channel.id === channelId);
    if (channelIndex === -1) {
      throw new Error('Notification channel not found');
    }

    config.notificationChannels[channelIndex] = {
      ...config.notificationChannels[channelIndex],
      ...updates,
      updatedAt: new Date(),
    };

    await this.updateConfig(organizationId, { notificationChannels: config.notificationChannels });

    this.logger.log('Notification channel updated', {
      organizationId,
      channelId,
      name: config.notificationChannels[channelIndex].name,
    });

    return config.notificationChannels[channelIndex];
  }

  async deleteNotificationChannel(organizationId: string, channelId: string): Promise<void> {
    const config = await this.getConfig(organizationId);
    if (!config) {
      throw new Error('Observability not configured for this organization');
    }

    const channelIndex = config.notificationChannels.findIndex(channel => channel.id === channelId);
    if (channelIndex === -1) {
      throw new Error('Notification channel not found');
    }

    config.notificationChannels.splice(channelIndex, 1);
    await this.updateConfig(organizationId, { notificationChannels: config.notificationChannels });

    this.logger.log('Notification channel deleted', {
      organizationId,
      channelId,
    });
  }

  async getNotificationChannels(organizationId: string): Promise<NotificationChannel[]> {
    const config = await this.getConfig(organizationId);
    return config?.notificationChannels || [];
  }

  async triggerAlert(
    organizationId: string,
    alert: {
      ruleId?: string;
      title: string;
      message: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      source: string;
      tags?: Record<string, string>;
      context?: Record<string, any>;
    },
  ): Promise<Alert> {
    const config = await this.getConfig(organizationId);
    if (!config?.enableAlerting) {
      this.logger.warn('Alerting disabled for organization', { organizationId });
      return null;
    }

    const newAlert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      ruleId: alert.ruleId,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      status: 'active',
      source: alert.source,
      tags: alert.tags || {},
      context: alert.context || {},
      triggeredAt: new Date(),
    };

    this.logger.log('Alert triggered', {
      organizationId,
      alertId: newAlert.id,
      title: newAlert.title,
      severity: newAlert.severity,
      source: newAlert.source,
    });

    // Send to alert providers
    await this.sendToAlertProviders(organizationId, newAlert);

    // Send notifications
    await this.sendNotifications(organizationId, newAlert);

    return newAlert;
  }

  private async sendToAlertProviders(organizationId: string, alert: Alert): Promise<void> {
    const config = await this.getConfig(organizationId);
    if (!config) return;

    try {
      // Send to Sentry if configured
      if (config.alertProvider === 'sentry') {
        await this.sentryService.captureMessage(
          organizationId,
          alert.message,
          this.mapSeverityToSentryLevel(alert.severity),
          {
            alertId: alert.id,
            ruleId: alert.ruleId,
            source: alert.source,
            tags: alert.tags,
            context: alert.context,
          },
        );
      }

      // Send to PagerDuty if configured
      if (config.alertProvider === 'pagerduty') {
        await this.pagerDutyService.createIncidentFromAlert(organizationId, {
          title: alert.title,
          message: alert.message,
          severity: this.mapSeverityToPagerDutySeverity(alert.severity),
          source: alert.source,
          tags: alert.tags,
          context: alert.context,
        });
      }
    } catch (error) {
      this.logger.error('Failed to send alert to providers', {
        organizationId,
        alertId: alert.id,
        error: error.message,
      });
    }
  }

  private async sendNotifications(organizationId: string, alert: Alert): Promise<void> {
    const config = await this.getConfig(organizationId);
    if (!config?.enableNotifications) return;

    const channels = config.notificationChannels.filter(channel => channel.enabled);

    for (const channel of channels) {
      try {
        await this.sendToNotificationChannel(organizationId, alert, channel);
      } catch (error) {
        this.logger.error('Failed to send notification to channel', {
          organizationId,
          alertId: alert.id,
          channelId: channel.id,
          channelType: channel.type,
          error: error.message,
        });
      }
    }
  }

  private async sendToNotificationChannel(
    organizationId: string,
    alert: Alert,
    channel: NotificationChannel,
  ): Promise<void> {
    const config = await this.getConfig(organizationId);
    switch (channel.type) {
      case 'slack':
        if (config.notificationProvider === 'slack') {
          await this.slackService.sendAlertNotification(
            organizationId,
            {
              title: alert.title,
              message: alert.message,
              level: this.mapSeverityToSentryLevel(alert.severity),
              source: alert.source,
              tags: alert.tags,
              context: alert.context,
            },
            channel.config.channel,
            channel.recipients,
          );
        }
        break;

      case 'email':
        // Email service would be implemented here
        this.logger.log('Email notification would be sent', {
          organizationId,
          alertId: alert.id,
          recipients: channel.recipients,
        });
        break;

      case 'webhook':
        // Webhook service would be implemented here
        this.logger.log('Webhook notification would be sent', {
          organizationId,
          alertId: alert.id,
          webhookUrl: channel.config.webhookUrl,
        });
        break;

      case 'pagerduty':
        if (config.alertProvider === 'pagerduty') {
          await this.pagerDutyService.createIncidentFromAlert(organizationId, {
            title: alert.title,
            message: alert.message,
            severity: this.mapSeverityToPagerDutySeverity(alert.severity),
            source: alert.source,
            tags: alert.tags,
            context: alert.context,
          });
        }
        break;
    }
  }

  async captureException(
    organizationId: string,
    error: Error,
    context: Record<string, any> = {},
  ): Promise<void> {
    const config = await this.getConfig(organizationId);
    if (!config?.enableAlerting) return;

    try {
      // Send to Sentry
      if (config.alertProvider === 'sentry') {
        await this.sentryService.captureException(organizationId, error, context);
      }

      // Send to PagerDuty if critical
      if (config.alertProvider === 'pagerduty' && this.isCriticalError(error)) {
        await this.pagerDutyService.createIncident(organizationId, {
          title: `Critical Error: ${error.name}`,
          description: error.message,
          urgency: 'high',
          priority: 'P1',
          tags: {
            errorType: error.name,
            source: 'exception-capture',
          },
          context: {
            stack: error.stack,
            ...context,
          },
        });
      }

      // Send Slack notification
      if (config.notificationProvider === 'slack') {
        await this.slackService.sendErrorNotification(
          organizationId,
          {
            title: error.name,
            message: error.message,
            stack: error.stack,
            context,
            severity: this.isCriticalError(error) ? 'critical' : 'high',
          },
        );
      }
    } catch (sendError) {
      this.logger.error('Failed to capture exception', {
        organizationId,
        originalError: error.message,
        sendError: sendError.message,
      });
    }
  }

  async captureMetric(
    organizationId: string,
    metric: {
      name: string;
      value: number;
      unit?: string;
      tags?: Record<string, string>;
      timestamp?: Date;
    },
  ): Promise<void> {
    const config = await this.getConfig(organizationId);
    if (!config?.enableMetrics) return;

    // Check alert rules
    const rules = config.alertRules.filter(rule => rule.enabled);
    
    for (const rule of rules) {
      if (rule.condition.metric === metric.name) {
        const shouldTrigger = this.evaluateAlertCondition(
          metric.value,
          rule.condition.operator,
          rule.condition.threshold,
        );

        if (shouldTrigger) {
          await this.triggerAlert(organizationId, {
            ruleId: rule.id,
            title: `Alert: ${rule.name}`,
            message: `${metric.name} (${metric.value}${metric.unit || ''}) ${rule.condition.operator} ${rule.condition.threshold}${metric.unit || ''}`,
            severity: rule.severity,
            source: 'metric-threshold',
            tags: {
              ...rule.tags,
              metric: metric.name,
              value: metric.value.toString(),
              threshold: rule.condition.threshold.toString(),
            },
            context: {
              rule: rule,
              metric: metric,
            },
          });
        }
      }
    }
  }

  private evaluateAlertCondition(
    value: number,
    operator: string,
    threshold: number,
  ): boolean {
    switch (operator) {
      case 'gt':
        return value > threshold;
      case 'lt':
        return value < threshold;
      case 'eq':
        return value === threshold;
      case 'gte':
        return value >= threshold;
      case 'lte':
        return value <= threshold;
      case 'ne':
        return value !== threshold;
      default:
        return false;
    }
  }

  private mapSeverityToSentryLevel(severity: string): 'fatal' | 'error' | 'warning' | 'info' | 'debug' {
    switch (severity) {
      case 'critical':
        return 'fatal';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  }

  private mapSeverityToPagerDutySeverity(severity: string): 'critical' | 'warning' | 'info' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'critical';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'warning';
    }
  }

  private isCriticalError(error: Error): boolean {
    // Define what constitutes a critical error
    const criticalErrorTypes = [
      'DatabaseConnectionError',
      'AuthenticationError',
      'AuthorizationError',
      'RateLimitError',
      'TimeoutError',
    ];

    return criticalErrorTypes.some(type => error.name.includes(type));
  }

  async getAlertStats(
    organizationId: string,
    timeRange: { start: Date; end: Date },
  ): Promise<{
    totalAlerts: number;
    alertsBySeverity: Record<string, number>;
    alertsByStatus: Record<string, number>;
    alertsBySource: Record<string, number>;
    averageResolutionTime: number;
  }> {
    // In a real implementation, you would query the database
    // For now, return mock data
    return {
      totalAlerts: 45,
      alertsBySeverity: {
        critical: 5,
        high: 12,
        medium: 18,
        low: 10,
      },
      alertsByStatus: {
        active: 8,
        acknowledged: 5,
        resolved: 32,
      },
      alertsBySource: {
        'metric-threshold': 25,
        'exception-capture': 12,
        'manual': 8,
      },
      averageResolutionTime: 25, // minutes
    };
  }

  async acknowledgeAlert(
    organizationId: string,
    alertId: string,
    userId: string,
    note?: string,
  ): Promise<void> {
    // In a real implementation, you would update the alert in the database
    this.logger.log('Alert acknowledged', {
      organizationId,
      alertId,
      userId,
      note,
    });
  }

  async resolveAlert(
    organizationId: string,
    alertId: string,
    userId: string,
    resolution?: string,
  ): Promise<void> {
    // In a real implementation, you would update the alert in the database
    this.logger.log('Alert resolved', {
      organizationId,
      alertId,
      userId,
      resolution,
    });
  }
}
