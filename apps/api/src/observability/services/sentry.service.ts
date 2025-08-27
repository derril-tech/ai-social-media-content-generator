import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelemetryConfig } from '../entities/telemetry-config.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export interface SentryEvent {
  id: string;
  title: string;
  message: string;
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  timestamp: Date;
  tags: Record<string, string>;
  context: Record<string, any>;
  user?: {
    id: string;
    email: string;
    username?: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

export interface SentryAlert {
  id: string;
  title: string;
  message: string;
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  status: 'active' | 'resolved' | 'ignored';
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  url: string;
  tags: Record<string, string>;
}

export interface SentryConfig {
  dsn: string;
  environment: string;
  release: string;
  tracesSampleRate: number;
  profilesSampleRate: number;
  enableTracing: boolean;
  enableProfiling: boolean;
  beforeSend?: (event: any) => any;
  beforeBreadcrumb?: (breadcrumb: any) => any;
}

@Injectable()
export class SentryService {
  private readonly logger = new Logger(SentryService.name);

  constructor(
    @InjectRepository(TelemetryConfig)
    private readonly telemetryConfigRepository: Repository<TelemetryConfig>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async getSentryConfig(organizationId: string): Promise<SentryConfig | null> {
    const config = await this.telemetryConfigRepository.findOne({
      where: { organizationId, isActive: true },
    });

    if (!config?.enableAlerting || config.alertProvider !== 'sentry') {
      return null;
    }

    return {
      dsn: config.alertConfig.dsn || process.env.SENTRY_DSN,
      environment: config.alertConfig.environment || process.env.NODE_ENV || 'development',
      release: config.alertConfig.release || process.env.APP_VERSION || '1.0.0',
      tracesSampleRate: config.alertConfig.tracesSampleRate || 0.1,
      profilesSampleRate: config.alertConfig.profilesSampleRate || 0.1,
      enableTracing: config.alertConfig.enableTracing || true,
      enableProfiling: config.alertConfig.enableProfiling || false,
      beforeSend: config.alertConfig.beforeSend,
      beforeBreadcrumb: config.alertConfig.beforeBreadcrumb,
    };
  }

  async captureException(
    organizationId: string,
    error: Error,
    context: Record<string, any> = {},
  ): Promise<string> {
    const sentryConfig = await this.getSentryConfig(organizationId);
    
    if (!sentryConfig) {
      this.logger.error('Sentry not configured for organization', { organizationId, error: error.message });
      return null;
    }

    // In a real implementation, you would use Sentry SDK
    // For now, log the error and return a mock event ID
    const eventId = `sentry-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    this.logger.error('Sentry event captured', {
      eventId,
      organizationId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
    });

    return eventId;
  }

  async captureMessage(
    organizationId: string,
    message: string,
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
    context: Record<string, any> = {},
  ): Promise<string> {
    const sentryConfig = await this.getSentryConfig(organizationId);
    
    if (!sentryConfig) {
      this.logger.log('Sentry not configured for organization', { organizationId, message, level });
      return null;
    }

    // In a real implementation, you would use Sentry SDK
    const eventId = `sentry-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    this.logger.log('Sentry message captured', {
      eventId,
      organizationId,
      message,
      level,
      context,
    });

    return eventId;
  }

  async addBreadcrumb(
    organizationId: string,
    breadcrumb: {
      message: string;
      category: string;
      level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
      data?: Record<string, any>;
    },
  ): Promise<void> {
    const sentryConfig = await this.getSentryConfig(organizationId);
    
    if (!sentryConfig) {
      return;
    }

    // In a real implementation, you would use Sentry SDK
    this.logger.debug('Sentry breadcrumb added', {
      organizationId,
      breadcrumb,
    });
  }

  async setUser(
    organizationId: string,
    user: {
      id: string;
      email: string;
      username?: string;
      organizationId?: string;
    },
  ): Promise<void> {
    const sentryConfig = await this.getSentryConfig(organizationId);
    
    if (!sentryConfig) {
      return;
    }

    // In a real implementation, you would use Sentry SDK
    this.logger.debug('Sentry user set', {
      organizationId,
      user,
    });
  }

  async setTag(
    organizationId: string,
    key: string,
    value: string,
  ): Promise<void> {
    const sentryConfig = await this.getSentryConfig(organizationId);
    
    if (!sentryConfig) {
      return;
    }

    // In a real implementation, you would use Sentry SDK
    this.logger.debug('Sentry tag set', {
      organizationId,
      key,
      value,
    });
  }

  async setContext(
    organizationId: string,
    name: string,
    context: Record<string, any>,
  ): Promise<void> {
    const sentryConfig = await this.getSentryConfig(organizationId);
    
    if (!sentryConfig) {
      return;
    }

    // In a real implementation, you would use Sentry SDK
    this.logger.debug('Sentry context set', {
      organizationId,
      name,
      context,
    });
  }

  async getAlerts(
    organizationId: string,
    status?: 'active' | 'resolved' | 'ignored',
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ alerts: SentryAlert[]; total: number }> {
    const sentryConfig = await this.getSentryConfig(organizationId);
    
    if (!sentryConfig) {
      return { alerts: [], total: 0 };
    }

    // In a real implementation, you would query Sentry API
    // For now, return mock data
    const mockAlerts: SentryAlert[] = [
      {
        id: 'alert-1',
        title: 'High Error Rate in Content Generation',
        message: 'Error rate exceeded 5% threshold in content generation service',
        level: 'error',
        status: 'active',
        count: 45,
        firstSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        lastSeen: new Date(),
        url: `https://sentry.io/organizations/${organizationId}/alerts/alert-1`,
        tags: {
          service: 'content-generation',
          platform: 'twitter',
          organization: organizationId,
        },
      },
      {
        id: 'alert-2',
        title: 'Policy Check Timeout',
        message: 'Policy check service is taking longer than expected',
        level: 'warning',
        status: 'active',
        count: 12,
        firstSeen: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        lastSeen: new Date(),
        url: `https://sentry.io/organizations/${organizationId}/alerts/alert-2`,
        tags: {
          service: 'policy-check',
          organization: organizationId,
        },
      },
      {
        id: 'alert-3',
        title: 'Publish Service Unavailable',
        message: 'Publish service is returning 503 errors',
        level: 'fatal',
        status: 'resolved',
        count: 8,
        firstSeen: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        url: `https://sentry.io/organizations/${organizationId}/alerts/alert-3`,
        tags: {
          service: 'publish',
          platform: 'linkedin',
          organization: organizationId,
        },
      },
    ];

    let filteredAlerts = mockAlerts;
    if (status) {
      filteredAlerts = mockAlerts.filter(alert => alert.status === status);
    }

    const paginatedAlerts = filteredAlerts.slice(offset, offset + limit);

    return {
      alerts: paginatedAlerts,
      total: filteredAlerts.length,
    };
  }

  async getAlertDetails(
    organizationId: string,
    alertId: string,
  ): Promise<SentryAlert | null> {
    const sentryConfig = await this.getSentryConfig(organizationId);
    
    if (!sentryConfig) {
      return null;
    }

    // In a real implementation, you would query Sentry API
    // For now, return mock data
    const mockAlert: SentryAlert = {
      id: alertId,
      title: 'High Error Rate in Content Generation',
      message: 'Error rate exceeded 5% threshold in content generation service',
      level: 'error',
      status: 'active',
      count: 45,
      firstSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
      lastSeen: new Date(),
      url: `https://sentry.io/organizations/${organizationId}/alerts/${alertId}`,
      tags: {
        service: 'content-generation',
        platform: 'twitter',
        organization: organizationId,
      },
    };

    return mockAlert;
  }

  async resolveAlert(
    organizationId: string,
    alertId: string,
    reason?: string,
  ): Promise<void> {
    const sentryConfig = await this.getSentryConfig(organizationId);
    
    if (!sentryConfig) {
      throw new Error('Sentry not configured for this organization');
    }

    // In a real implementation, you would update the alert via Sentry API
    this.logger.log('Sentry alert resolved', {
      organizationId,
      alertId,
      reason,
    });
  }

  async ignoreAlert(
    organizationId: string,
    alertId: string,
    reason?: string,
  ): Promise<void> {
    const sentryConfig = await this.getSentryConfig(organizationId);
    
    if (!sentryConfig) {
      throw new Error('Sentry not configured for this organization');
    }

    // In a real implementation, you would update the alert via Sentry API
    this.logger.log('Sentry alert ignored', {
      organizationId,
      alertId,
      reason,
    });
  }

  async getErrorStats(
    organizationId: string,
    timeRange: { start: Date; end: Date },
  ): Promise<{
    totalErrors: number;
    errorRate: number;
    topErrors: Array<{ error: string; count: number; percentage: number }>;
    errorsByLevel: Record<string, number>;
    errorsByService: Record<string, number>;
  }> {
    const sentryConfig = await this.getSentryConfig(organizationId);
    
    if (!sentryConfig) {
      return {
        totalErrors: 0,
        errorRate: 0,
        topErrors: [],
        errorsByLevel: {},
        errorsByService: {},
      };
    }

    // In a real implementation, you would query Sentry API
    // For now, return mock data
    return {
      totalErrors: 156,
      errorRate: 0.023, // 2.3%
      topErrors: [
        { error: 'Content generation timeout', count: 45, percentage: 28.8 },
        { error: 'Policy check failed', count: 32, percentage: 20.5 },
        { error: 'Publish service unavailable', count: 28, percentage: 17.9 },
        { error: 'Invalid API credentials', count: 18, percentage: 11.5 },
        { error: 'Rate limit exceeded', count: 15, percentage: 9.6 },
      ],
      errorsByLevel: {
        fatal: 8,
        error: 89,
        warning: 45,
        info: 14,
      },
      errorsByService: {
        'content-generation': 67,
        'policy-check': 45,
        'publish': 28,
        'metrics-ingestion': 16,
      },
    };
  }

  async createPerformanceSpan(
    organizationId: string,
    operation: string,
    operationFn: () => Promise<any>,
  ): Promise<any> {
    const sentryConfig = await this.getSentryConfig(organizationId);
    
    if (!sentryConfig?.enableTracing) {
      return await operationFn();
    }

    const startTime = Date.now();
    
    try {
      const result = await operationFn();
      const duration = Date.now() - startTime;
      
      // In a real implementation, you would use Sentry performance monitoring
      this.logger.debug('Performance span recorded', {
        organizationId,
        operation,
        duration,
        success: true,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.debug('Performance span recorded', {
        organizationId,
        operation,
        duration,
        success: false,
        error: error.message,
      });
      
      throw error;
    }
  }
}
