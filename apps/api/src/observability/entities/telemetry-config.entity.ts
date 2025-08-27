import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';

export enum TelemetryProvider {
  JAEGER = 'jaeger',
  ZIPKIN = 'zipkin',
  OTEL_COLLECTOR = 'otel_collector',
  CUSTOM_ENDPOINT = 'custom_endpoint',
}

export enum MetricsProvider {
  PROMETHEUS = 'prometheus',
  DATADOG = 'datadog',
  NEW_RELIC = 'new_relic',
  CUSTOM_METRICS = 'custom_metrics',
}

export enum LoggingProvider {
  ELASTICSEARCH = 'elasticsearch',
  LOKI = 'loki',
  SPLUNK = 'splunk',
  CUSTOM_LOGGING = 'custom_logging',
}

export enum AlertProvider {
  SENTRY = 'sentry',
  PAGERDUTY = 'pagerduty',
  SLACK = 'slack',
  EMAIL = 'email',
  CUSTOM_ALERT = 'custom_alert',
}

@Entity('telemetry_configs')
export class TelemetryConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  // Tracing Configuration
  @Column({
    type: 'enum',
    enum: TelemetryProvider,
    default: TelemetryProvider.OTEL_COLLECTOR,
  })
  tracingProvider: TelemetryProvider;

  @Column({ type: 'varchar', length: 500, nullable: true })
  tracingEndpoint: string;

  @Column({ type: 'jsonb', default: {} })
  tracingConfig: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  enableTracing: boolean;

  @Column({ type: 'float', default: 1.0 })
  samplingRate: number;

  // Metrics Configuration
  @Column({
    type: 'enum',
    enum: MetricsProvider,
    default: MetricsProvider.PROMETHEUS,
  })
  metricsProvider: MetricsProvider;

  @Column({ type: 'varchar', length: 500, nullable: true })
  metricsEndpoint: string;

  @Column({ type: 'jsonb', default: {} })
  metricsConfig: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  enableMetrics: boolean;

  @Column({ type: 'int', default: 60 })
  metricsInterval: number; // seconds

  // Logging Configuration
  @Column({
    type: 'enum',
    enum: LoggingProvider,
    default: LoggingProvider.ELASTICSEARCH,
  })
  loggingProvider: LoggingProvider;

  @Column({ type: 'varchar', length: 500, nullable: true })
  loggingEndpoint: string;

  @Column({ type: 'jsonb', default: {} })
  loggingConfig: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  enableLogging: boolean;

  @Column({ type: 'varchar', length: 50, default: 'info' })
  logLevel: string;

  // Alerting Configuration
  @Column({
    type: 'enum',
    enum: AlertProvider,
    default: AlertProvider.SENTRY,
  })
  alertProvider: AlertProvider;

  @Column({ type: 'varchar', length: 500, nullable: true })
  alertEndpoint: string;

  @Column({ type: 'jsonb', default: {} })
  alertConfig: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  enableAlerting: boolean;

  // Grafana Configuration
  @Column({ type: 'varchar', length: 500, nullable: true })
  grafanaUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  grafanaApiKey: string;

  @Column({ type: 'jsonb', default: {} })
  grafanaDashboards: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  enableGrafanaIntegration: boolean;

  // Custom Dashboards
  @Column({ type: 'jsonb', default: [] })
  customDashboards: Array<{
    id: string;
    name: string;
    description: string;
    type: 'metrics' | 'logs' | 'traces';
    config: Record<string, any>;
    isActive: boolean;
  }>;

  // Alert Rules
  @Column({ type: 'jsonb', default: [] })
  alertRules: Array<{
    id: string;
    name: string;
    description: string;
    condition: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    channels: string[];
    isActive: boolean;
  }>;

  // Service-specific Configuration
  @Column({ type: 'jsonb', default: {} })
  serviceConfig: {
    generation?: {
      enableSpans: boolean;
      enableMetrics: boolean;
      customAttributes: Record<string, any>;
    };
    policy?: {
      enableSpans: boolean;
      enableMetrics: boolean;
      customAttributes: Record<string, any>;
    };
    publish?: {
      enableSpans: boolean;
      enableMetrics: boolean;
      customAttributes: Record<string, any>;
    };
    metrics?: {
      enableSpans: boolean;
      enableMetrics: boolean;
      customAttributes: Record<string, any>;
    };
  };

  @Column({ type: 'varchar', length: 36 })
  organizationId: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;
}
