import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelemetryConfig } from '../entities/telemetry-config.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export interface SlackMessage {
  id: string;
  channel: string;
  text: string;
  blocks?: any[];
  attachments?: any[];
  threadTs?: string;
  timestamp: Date;
  status: 'sent' | 'failed' | 'pending';
}

export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  isArchived: boolean;
  memberCount: number;
  topic?: string;
  purpose?: string;
}

export interface SlackUser {
  id: string;
  name: string;
  realName: string;
  email: string;
  isBot: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isPrimaryOwner: boolean;
  isRestricted: boolean;
  isUltraRestricted: boolean;
  tz?: string;
  tzLabel?: string;
  tzOffset?: number;
  profile: {
    avatarHash: string;
    statusText: string;
    statusEmoji: string;
    realName: string;
    displayName: string;
    realNameNormalized: string;
    displayNameNormalized: string;
    email: string;
    imageOriginal: string;
    image24: string;
    image32: string;
    image48: string;
    image72: string;
    image192: string;
    image512: string;
    team: string;
  };
}

export interface SlackConfig {
  botToken: string;
  appToken?: string;
  signingSecret: string;
  defaultChannel: string;
  enableNotifications: boolean;
  enableThreading: boolean;
  enableMentions: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
}

export interface SlackNotificationTemplate {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  fields?: Array<{ title: string; value: string; short?: boolean }>;
  actions?: Array<{ text: string; url: string; style?: 'primary' | 'danger' }>;
  color?: string;
  footer?: string;
  timestamp?: Date;
}

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);

  constructor(
    @InjectRepository(TelemetryConfig)
    private readonly telemetryConfigRepository: Repository<TelemetryConfig>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async getSlackConfig(organizationId: string): Promise<SlackConfig | null> {
    const config = await this.telemetryConfigRepository.findOne({
      where: { organizationId, isActive: true },
    });

    if (!config?.enableNotifications || config.notificationProvider !== 'slack') {
      return null;
    }

    return {
      botToken: config.notificationConfig.botToken || process.env.SLACK_BOT_TOKEN,
      appToken: config.notificationConfig.appToken || process.env.SLACK_APP_TOKEN,
      signingSecret: config.notificationConfig.signingSecret || process.env.SLACK_SIGNING_SECRET,
      defaultChannel: config.notificationConfig.defaultChannel || '#alerts',
      enableNotifications: config.notificationConfig.enableNotifications || true,
      enableThreading: config.notificationConfig.enableThreading || false,
      enableMentions: config.notificationConfig.enableMentions || true,
      webhookUrl: config.notificationConfig.webhookUrl,
      webhookSecret: config.notificationConfig.webhookSecret,
    };
  }

  async sendMessage(
    organizationId: string,
    message: {
      channel?: string;
      text: string;
      blocks?: any[];
      attachments?: any[];
      threadTs?: string;
      username?: string;
      iconEmoji?: string;
    },
  ): Promise<SlackMessage> {
    const slackConfig = await this.getSlackConfig(organizationId);
    
    if (!slackConfig) {
      throw new Error('Slack not configured for this organization');
    }

    // In a real implementation, you would use Slack Web API
    // For now, create a mock message
    const mockMessage: SlackMessage = {
      id: `slack-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      channel: message.channel || slackConfig.defaultChannel,
      text: message.text,
      blocks: message.blocks,
      attachments: message.attachments,
      threadTs: message.threadTs,
      timestamp: new Date(),
      status: 'sent',
    };

    this.logger.log('Slack message sent', {
      organizationId,
      messageId: mockMessage.id,
      channel: mockMessage.channel,
      text: mockMessage.text.substring(0, 100) + (mockMessage.text.length > 100 ? '...' : ''),
    });

    return mockMessage;
  }

  async sendNotification(
    organizationId: string,
    template: SlackNotificationTemplate,
    channel?: string,
    mentions?: string[],
  ): Promise<SlackMessage> {
    const slackConfig = await this.getSlackConfig(organizationId);
    
    if (!slackConfig) {
      throw new Error('Slack not configured for this organization');
    }

    // Build message text with mentions
    let text = template.title;
    if (mentions && mentions.length > 0 && slackConfig.enableMentions) {
      text = mentions.map(mention => `<@${mention}>`).join(' ') + ' ' + text;
    }

    // Build blocks for rich formatting
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: template.title,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: template.message,
        },
      },
    ];

    // Add fields if provided
    if (template.fields && template.fields.length > 0) {
      blocks.push({
        type: 'section',
        fields: template.fields.map(field => ({
          type: 'mrkdwn',
          text: `*${field.title}*\n${field.value}`,
        })),
      });
    }

    // Add actions if provided
    if (template.actions && template.actions.length > 0) {
      blocks.push({
        type: 'actions',
        elements: template.actions.map(action => ({
          type: 'button',
          text: {
            type: 'plain_text',
            text: action.text,
            emoji: true,
          },
          url: action.url,
          style: action.style,
        })),
      });
    }

    // Add context block with timestamp and footer
    const contextElements = [];
    if (template.timestamp) {
      contextElements.push({
        type: 'mrkdwn',
        text: `*Timestamp:* <!date^${Math.floor(template.timestamp.getTime() / 1000)}^{date_pretty} at {time}|${template.timestamp.toISOString()}>`,
      });
    }
    if (template.footer) {
      contextElements.push({
        type: 'mrkdwn',
        text: template.footer,
      });
    }

    if (contextElements.length > 0) {
      blocks.push({
        type: 'context',
        elements: contextElements,
      });
    }

    // Build attachments for color coding
    const attachments = template.color ? [
      {
        color: template.color,
        blocks: blocks,
      },
    ] : undefined;

    return this.sendMessage(organizationId, {
      channel: channel || slackConfig.defaultChannel,
      text,
      blocks: attachments ? undefined : blocks,
      attachments,
    });
  }

  async sendErrorNotification(
    organizationId: string,
    error: {
      title: string;
      message: string;
      stack?: string;
      context?: Record<string, any>;
      severity?: 'critical' | 'high' | 'medium' | 'low';
    },
    channel?: string,
    mentions?: string[],
  ): Promise<SlackMessage> {
    const severityColors = {
      critical: '#ff0000',
      high: '#ff6b35',
      medium: '#f7931e',
      low: '#ffd23f',
    };

    const fields = [
      { title: 'Severity', value: error.severity || 'medium', short: true },
      { title: 'Timestamp', value: new Date().toISOString(), short: true },
    ];

    if (error.context) {
      Object.entries(error.context).forEach(([key, value]) => {
        fields.push({
          title: key.charAt(0).toUpperCase() + key.slice(1),
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          short: true,
        });
      });
    }

    return this.sendNotification(organizationId, {
      type: 'error',
      title: `🚨 ${error.title}`,
      message: error.message,
      fields,
      color: severityColors[error.severity || 'medium'],
      footer: 'AI Content Generator Error Alert',
      timestamp: new Date(),
    }, channel, mentions);
  }

  async sendAlertNotification(
    organizationId: string,
    alert: {
      title: string;
      message: string;
      level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
      source: string;
      tags?: Record<string, string>;
      context?: Record<string, any>;
      url?: string;
    },
    channel?: string,
    mentions?: string[],
  ): Promise<SlackMessage> {
    const levelEmojis = {
      fatal: '💀',
      error: '🚨',
      warning: '⚠️',
      info: 'ℹ️',
      debug: '🐛',
    };

    const levelColors = {
      fatal: '#ff0000',
      error: '#ff6b35',
      warning: '#f7931e',
      info: '#36a64f',
      debug: '#8b5cf6',
    };

    const fields = [
      { title: 'Level', value: alert.level.toUpperCase(), short: true },
      { title: 'Source', value: alert.source, short: true },
    ];

    if (alert.tags) {
      Object.entries(alert.tags).forEach(([key, value]) => {
        fields.push({
          title: key.charAt(0).toUpperCase() + key.slice(1),
          value: String(value),
          short: true,
        });
      });
    }

    const actions = alert.url ? [
      { text: 'View Details', url: alert.url, style: 'primary' as const },
    ] : undefined;

    return this.sendNotification(organizationId, {
      type: alert.level === 'fatal' || alert.level === 'error' ? 'error' : 
            alert.level === 'warning' ? 'warning' : 'info',
      title: `${levelEmojis[alert.level]} ${alert.title}`,
      message: alert.message,
      fields,
      actions,
      color: levelColors[alert.level],
      footer: 'AI Content Generator Alert',
      timestamp: new Date(),
    }, channel, mentions);
  }

  async sendIncidentNotification(
    organizationId: string,
    incident: {
      id: string;
      title: string;
      description: string;
      status: 'triggered' | 'acknowledged' | 'resolved';
      urgency: 'high' | 'low';
      priority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
      service: string;
      assignee?: string;
      url?: string;
    },
    channel?: string,
    mentions?: string[],
  ): Promise<SlackMessage> {
    const statusEmojis = {
      triggered: '🚨',
      acknowledged: '👁️',
      resolved: '✅',
    };

    const urgencyColors = {
      high: '#ff0000',
      low: '#f7931e',
    };

    const fields = [
      { title: 'Status', value: incident.status.toUpperCase(), short: true },
      { title: 'Urgency', value: incident.urgency.toUpperCase(), short: true },
      { title: 'Priority', value: incident.priority, short: true },
      { title: 'Service', value: incident.service, short: true },
    ];

    if (incident.assignee) {
      fields.push({ title: 'Assignee', value: `<@${incident.assignee}>`, short: true });
    }

    const actions = incident.url ? [
      { text: 'View Incident', url: incident.url, style: 'primary' as const },
    ] : undefined;

    return this.sendNotification(organizationId, {
      type: incident.urgency === 'high' ? 'error' : 'warning',
      title: `${statusEmojis[incident.status]} Incident: ${incident.title}`,
      message: incident.description,
      fields,
      actions,
      color: urgencyColors[incident.urgency],
      footer: 'PagerDuty Incident Alert',
      timestamp: new Date(),
    }, channel, mentions);
  }

  async sendMetricsNotification(
    organizationId: string,
    metrics: {
      title: string;
      summary: string;
      data: Array<{ name: string; value: number; unit?: string; trend?: 'up' | 'down' | 'stable' }>;
      threshold?: { value: number; operator: 'gt' | 'lt' | 'eq' };
      url?: string;
    },
    channel?: string,
  ): Promise<SlackMessage> {
    const fields = metrics.data.map(item => {
      let value = `${item.value}${item.unit || ''}`;
      if (item.trend) {
        const trendEmoji = item.trend === 'up' ? '📈' : item.trend === 'down' ? '📉' : '➡️';
        value = `${trendEmoji} ${value}`;
      }
      return { title: item.name, value, short: true };
    });

    const actions = metrics.url ? [
      { text: 'View Dashboard', url: metrics.url, style: 'primary' as const },
    ] : undefined;

    return this.sendNotification(organizationId, {
      type: 'info',
      title: `📊 ${metrics.title}`,
      message: metrics.summary,
      fields,
      actions,
      color: '#36a64f',
      footer: 'AI Content Generator Metrics',
      timestamp: new Date(),
    }, channel);
  }

  async getChannels(organizationId: string): Promise<SlackChannel[]> {
    const slackConfig = await this.getSlackConfig(organizationId);
    
    if (!slackConfig) {
      return [];
    }

    // In a real implementation, you would query Slack API
    // For now, return mock data
    return [
      {
        id: 'C1234567890',
        name: 'alerts',
        isPrivate: false,
        isArchived: false,
        memberCount: 15,
        topic: 'System alerts and notifications',
        purpose: 'Channel for receiving system alerts and important notifications',
      },
      {
        id: 'C1234567891',
        name: 'engineering',
        isPrivate: false,
        isArchived: false,
        memberCount: 8,
        topic: 'Engineering team discussions',
        purpose: 'General engineering discussions and updates',
      },
      {
        id: 'C1234567892',
        name: 'devops',
        isPrivate: false,
        isArchived: false,
        memberCount: 5,
        topic: 'DevOps and infrastructure',
        purpose: 'DevOps team discussions and infrastructure updates',
      },
      {
        id: 'C1234567893',
        name: 'incidents',
        isPrivate: false,
        isArchived: false,
        memberCount: 12,
        topic: 'Incident response and management',
        purpose: 'Channel for incident response and management discussions',
      },
    ];
  }

  async getUsers(organizationId: string): Promise<SlackUser[]> {
    const slackConfig = await this.getSlackConfig(organizationId);
    
    if (!slackConfig) {
      return [];
    }

    // In a real implementation, you would query Slack API
    // For now, return mock data
    return [
      {
        id: 'U1234567890',
        name: 'john.doe',
        realName: 'John Doe',
        email: 'john.doe@example.com',
        isBot: false,
        isAdmin: true,
        isOwner: false,
        isPrimaryOwner: false,
        isRestricted: false,
        isUltraRestricted: false,
        tz: 'America/New_York',
        tzLabel: 'Eastern Daylight Time',
        tzOffset: -14400,
        profile: {
          avatarHash: 'abc123',
          statusText: 'On call',
          statusEmoji: ':oncall:',
          realName: 'John Doe',
          displayName: 'John',
          realNameNormalized: 'John Doe',
          displayNameNormalized: 'John',
          email: 'john.doe@example.com',
          imageOriginal: 'https://example.com/avatar.jpg',
          image24: 'https://example.com/avatar-24.jpg',
          image32: 'https://example.com/avatar-32.jpg',
          image48: 'https://example.com/avatar-48.jpg',
          image72: 'https://example.com/avatar-72.jpg',
          image192: 'https://example.com/avatar-192.jpg',
          image512: 'https://example.com/avatar-512.jpg',
          team: 'T1234567890',
        },
      },
      {
        id: 'U1234567891',
        name: 'jane.smith',
        realName: 'Jane Smith',
        email: 'jane.smith@example.com',
        isBot: false,
        isAdmin: false,
        isOwner: false,
        isPrimaryOwner: false,
        isRestricted: false,
        isUltraRestricted: false,
        tz: 'America/Los_Angeles',
        tzLabel: 'Pacific Daylight Time',
        tzOffset: -25200,
        profile: {
          avatarHash: 'def456',
          statusText: 'Available',
          statusEmoji: ':white_check_mark:',
          realName: 'Jane Smith',
          displayName: 'Jane',
          realNameNormalized: 'Jane Smith',
          displayNameNormalized: 'Jane',
          email: 'jane.smith@example.com',
          imageOriginal: 'https://example.com/avatar2.jpg',
          image24: 'https://example.com/avatar2-24.jpg',
          image32: 'https://example.com/avatar2-32.jpg',
          image48: 'https://example.com/avatar2-48.jpg',
          image72: 'https://example.com/avatar2-72.jpg',
          image192: 'https://example.com/avatar2-192.jpg',
          image512: 'https://example.com/avatar2-512.jpg',
          team: 'T1234567890',
        },
      },
    ];
  }

  async createThread(
    organizationId: string,
    channel: string,
    message: string,
    threadTs: string,
  ): Promise<SlackMessage> {
    return this.sendMessage(organizationId, {
      channel,
      text: message,
      threadTs,
    });
  }

  async updateMessage(
    organizationId: string,
    messageId: string,
    updates: {
      text?: string;
      blocks?: any[];
      attachments?: any[];
    },
  ): Promise<SlackMessage> {
    const slackConfig = await this.getSlackConfig(organizationId);
    
    if (!slackConfig) {
      throw new Error('Slack not configured for this organization');
    }

    // In a real implementation, you would use Slack Web API to update the message
    // For now, return a mock updated message
    const updatedMessage: SlackMessage = {
      id: messageId,
      channel: '#alerts',
      text: updates.text || 'Updated message',
      blocks: updates.blocks,
      attachments: updates.attachments,
      timestamp: new Date(),
      status: 'sent',
    };

    this.logger.log('Slack message updated', {
      organizationId,
      messageId,
      text: updatedMessage.text.substring(0, 100) + (updatedMessage.text.length > 100 ? '...' : ''),
    });

    return updatedMessage;
  }
}
