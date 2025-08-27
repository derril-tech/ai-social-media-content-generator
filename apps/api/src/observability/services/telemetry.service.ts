import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelemetryConfig, TelemetryProvider, MetricsProvider, LoggingProvider, AlertProvider } from '../entities/telemetry-config.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { trace, metrics, SpanStatusCode, SpanKind, context, propagation } from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export interface SpanContext {
  name: string;
  kind: SpanKind;
  attributes?: Record<string, any>;
  events?: Array<{ name: string; attributes?: Record<string, any> }>;
  links?: Array<{ context: any; attributes?: Record<string, any> }>;
}

export interface MetricContext {
  name: string;
  value: number;
  unit?: string;
  attributes?: Record<string, any>;
  description?: string;
}

export interface AlertContext {
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  metadata?: Record<string, any>;
}

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);
  private readonly tracer = trace.getTracer('ai-social-media-generator');
  private readonly meter = metrics.getMeter('ai-social-media-generator');

  constructor(
    @InjectRepository(TelemetryConfig)
    private readonly telemetryConfigRepository: Repository<TelemetryConfig>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async getTelemetryConfig(organizationId: string): Promise<TelemetryConfig | null> {
    return await this.telemetryConfigRepository.findOne({
      where: { organizationId, isActive: true },
    });
  }

  async createTelemetryConfig(
    organizationId: string,
    config: Partial<TelemetryConfig>,
  ): Promise<TelemetryConfig> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`);
    }

    const telemetryConfig = this.telemetryConfigRepository.create({
      ...config,
      organizationId,
    });

    return await this.telemetryConfigRepository.save(telemetryConfig);
  }

  async updateTelemetryConfig(
    configId: string,
    organizationId: string,
    updates: Partial<TelemetryConfig>,
  ): Promise<TelemetryConfig> {
    const config = await this.telemetryConfigRepository.findOne({
      where: { id: configId, organizationId },
    });

    if (!config) {
      throw new Error('Telemetry configuration not found');
    }

    Object.assign(config, updates);
    return await this.telemetryConfigRepository.save(config);
  }

  // OpenTelemetry Span Management
  async createSpan(
    organizationId: string,
    spanContext: SpanContext,
    operation?: () => Promise<any>,
  ): Promise<any> {
    const config = await this.getTelemetryConfig(organizationId);
    
    if (!config?.enableTracing) {
      return operation ? await operation() : undefined;
    }

    const span = this.tracer.startSpan(spanContext.name, {
      kind: spanContext.kind,
      attributes: {
        'organization.id': organizationId,
        'service.name': 'ai-social-media-generator',
        'service.version': process.env.APP_VERSION || '1.0.0',
        ...spanContext.attributes,
      },
    });

    // Add events if provided
    if (spanContext.events) {
      spanContext.events.forEach(event => {
        span.addEvent(event.name, event.attributes);
      });
    }

    // Add links if provided
    if (spanContext.links) {
      spanContext.links.forEach(link => {
        span.addLink(link.context, link.attributes);
      });
    }

    try {
      const result = operation ? await operation() : undefined;
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  }

  // Generation Service Spans
  async createGenerationSpan(
    organizationId: string,
    briefId: string,
    platform: string,
    operation: () => Promise<any>,
  ): Promise<any> {
    return await this.createSpan(organizationId, {
      name: 'content.generation',
      kind: SpanKind.INTERNAL,
      attributes: {
        'brief.id': briefId,
        'platform': platform,
        'operation.type': 'generation',
      },
    }, operation);
  }

  async createPolicyCheckSpan(
    organizationId: string,
    contentId: string,
    platform: string,
    operation: () => Promise<any>,
  ): Promise<any> {
    return await this.createSpan(organizationId, {
      name: 'content.policy_check',
      kind: SpanKind.INTERNAL,
      attributes: {
        'content.id': contentId,
        'platform': platform,
        'operation.type': 'policy_check',
      },
    }, operation);
  }

  async createPublishSpan(
    organizationId: string,
    contentId: string,
    platform: string,
    operation: () => Promise<any>,
  ): Promise<any> {
    return await this.createSpan(organizationId, {
      name: 'content.publish',
      kind: SpanKind.CLIENT,
      attributes: {
        'content.id': contentId,
        'platform': platform,
        'operation.type': 'publish',
      },
    }, operation);
  }

  async createMetricsIngestionSpan(
    organizationId: string,
    platform: string,
    operation: () => Promise<any>,
  ): Promise<any> {
    return await this.createSpan(organizationId, {
      name: 'metrics.ingestion',
      kind: SpanKind.INTERNAL,
      attributes: {
        'platform': platform,
        'operation.type': 'metrics_ingestion',
      },
    }, operation);
  }

  // Metrics Management
  async recordMetric(
    organizationId: string,
    metricContext: MetricContext,
  ): Promise<void> {
    const config = await this.getTelemetryConfig(organizationId);
    
    if (!config?.enableMetrics) {
      return;
    }

    const counter = this.meter.createCounter(metricContext.name, {
      description: metricContext.description,
      unit: metricContext.unit,
    });

    counter.add(metricContext.value, {
      'organization.id': organizationId,
      ...metricContext.attributes,
    });
  }

  // Generation Metrics
  async recordGenerationMetric(
    organizationId: string,
    platform: string,
    success: boolean,
    duration: number,
    variantCount: number,
  ): Promise<void> {
    await this.recordMetric(organizationId, {
      name: 'content.generation.total',
      value: 1,
      attributes: {
        'platform': platform,
        'success': success,
        'variant_count': variantCount,
      },
    });

    await this.recordMetric(organizationId, {
      name: 'content.generation.duration',
      value: duration,
      unit: 'ms',
      attributes: {
        'platform': platform,
        'success': success,
      },
    });
  }

  // Policy Check Metrics
  async recordPolicyCheckMetric(
    organizationId: string,
    platform: string,
    passed: boolean,
    duration: number,
    riskScore: number,
  ): Promise<void> {
    await this.recordMetric(organizationId, {
      name: 'content.policy_check.total',
      value: 1,
      attributes: {
        'platform': platform,
        'passed': passed,
        'risk_score': riskScore,
      },
    });

    await this.recordMetric(organizationId, {
      name: 'content.policy_check.duration',
      value: duration,
      unit: 'ms',
      attributes: {
        'platform': platform,
        'passed': passed,
      },
    });
  }

  // Publish Metrics
  async recordPublishMetric(
    organizationId: string,
    platform: string,
    success: boolean,
    duration: number,
    retryCount: number,
  ): Promise<void> {
    await this.recordMetric(organizationId, {
      name: 'content.publish.total',
      value: 1,
      attributes: {
        'platform': platform,
        'success': success,
        'retry_count': retryCount,
      },
    });

    await this.recordMetric(organizationId, {
      name: 'content.publish.duration',
      value: duration,
      unit: 'ms',
      attributes: {
        'platform': platform,
        'success': success,
      },
    });
  }

  // Metrics Ingestion
  async recordMetricsIngestionMetric(
    organizationId: string,
    platform: string,
    success: boolean,
    recordCount: number,
    duration: number,
  ): Promise<void> {
    await this.recordMetric(organizationId, {
      name: 'metrics.ingestion.total',
      value: 1,
      attributes: {
        'platform': platform,
        'success': success,
        'record_count': recordCount,
      },
    });

    await this.recordMetric(organizationId, {
      name: 'metrics.ingestion.duration',
      value: duration,
      unit: 'ms',
      attributes: {
        'platform': platform,
        'success': success,
      },
    });
  }

  // Error Tracking
  async recordError(
    organizationId: string,
    error: Error,
    context: Record<string, any> = {},
  ): Promise<void> {
    const config = await this.getTelemetryConfig(organizationId);
    
    if (!config?.enableAlerting) {
      return;
    }

    // Record error metric
    await this.recordMetric(organizationId, {
      name: 'errors.total',
      value: 1,
      attributes: {
        'error.type': error.constructor.name,
        'error.message': error.message,
        ...context,
      },
    });

    // Log error with structured logging
    this.logger.error('Application error', {
      organizationId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
    });
  }

  // Performance Monitoring
  async recordPerformanceMetric(
    organizationId: string,
    operation: string,
    duration: number,
    success: boolean,
    attributes: Record<string, any> = {},
  ): Promise<void> {
    await this.recordMetric(organizationId, {
      name: `performance.${operation}`,
      value: duration,
      unit: 'ms',
      attributes: {
        'success': success,
        ...attributes,
      },
    });
  }

  // Business Metrics
  async recordBusinessMetric(
    organizationId: string,
    metricName: string,
    value: number,
    attributes: Record<string, any> = {},
  ): Promise<void> {
    await this.recordMetric(organizationId, {
      name: `business.${metricName}`,
      value,
      attributes: {
        ...attributes,
      },
    });
  }

  // Health Check Metrics
  async recordHealthCheckMetric(
    organizationId: string,
    service: string,
    healthy: boolean,
    responseTime: number,
  ): Promise<void> {
    await this.recordMetric(organizationId, {
      name: 'health.check',
      value: healthy ? 1 : 0,
      attributes: {
        'service': service,
        'healthy': healthy,
        'response_time': responseTime,
      },
    });
  }

  // Custom Event Tracking
  async recordCustomEvent(
    organizationId: string,
    eventName: string,
    attributes: Record<string, any> = {},
  ): Promise<void> {
    await this.recordMetric(organizationId, {
      name: `event.${eventName}`,
      value: 1,
      attributes,
    });
  }

  // Get Telemetry Statistics
  async getTelemetryStats(organizationId: string): Promise<{
    totalSpans: number;
    totalMetrics: number;
    errorRate: number;
    averageResponseTime: number;
    activeConfigurations: number;
  }> {
    // This would typically query your telemetry backend
    // For now, return mock data
    return {
      totalSpans: 15420,
      totalMetrics: 8920,
      errorRate: 0.02, // 2%
      averageResponseTime: 245, // ms
      activeConfigurations: 1,
    };
  }

  // Export Telemetry Data
  async exportTelemetryData(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    dataType: 'spans' | 'metrics' | 'logs',
  ): Promise<any> {
    // This would typically query your telemetry backend
    // For now, return mock data
    return {
      organizationId,
      dataType,
      startDate,
      endDate,
      records: [],
      totalRecords: 0,
    };
  }
}
