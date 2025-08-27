import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelemetryConfig } from '../entities/telemetry-config.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  type: 'metrics' | 'logs' | 'traces' | 'mixed';
  panels: Array<{
    id: string;
    title: string;
    type: 'graph' | 'stat' | 'table' | 'heatmap' | 'pie';
    query: string;
    datasource: string;
    position: { x: number; y: number; w: number; h: number };
  }>;
  variables: Array<{
    name: string;
    type: 'query' | 'custom' | 'constant';
    value: string;
  }>;
  refresh: string;
  timeRange: { from: string; to: string };
}

export interface GrafanaDashboard {
  id: string;
  uid: string;
  title: string;
  url: string;
  version: number;
  panels: any[];
  templating: any;
  time: any;
  timepicker: any;
  refresh: string;
  schemaVersion: number;
  style: string;
  tags: string[];
  folderId: number;
  folderTitle: string;
  folderUrl: string;
  overwrite: boolean;
}

@Injectable()
export class GrafanaService {
  private readonly logger = new Logger(GrafanaService.name);

  constructor(
    @InjectRepository(TelemetryConfig)
    private readonly telemetryConfigRepository: Repository<TelemetryConfig>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async getGrafanaConfig(organizationId: string): Promise<{
    url: string;
    apiKey: string;
    enabled: boolean;
  } | null> {
    const config = await this.telemetryConfigRepository.findOne({
      where: { organizationId, isActive: true },
    });

    if (!config?.enableGrafanaIntegration) {
      return null;
    }

    return {
      url: config.grafanaUrl,
      apiKey: config.grafanaApiKey,
      enabled: config.enableGrafanaIntegration,
    };
  }

  async createDashboard(
    organizationId: string,
    dashboardConfig: DashboardConfig,
  ): Promise<GrafanaDashboard> {
    const grafanaConfig = await this.getGrafanaConfig(organizationId);
    
    if (!grafanaConfig) {
      throw new Error('Grafana integration not enabled for this organization');
    }

    const dashboard: GrafanaDashboard = {
      id: null,
      uid: dashboardConfig.id,
      title: dashboardConfig.name,
      url: '',
      version: 1,
      panels: dashboardConfig.panels.map(panel => ({
        id: panel.id,
        title: panel.title,
        type: panel.type,
        targets: [{
          expr: panel.query,
          datasource: panel.datasource,
        }],
        gridPos: panel.position,
        fieldConfig: {
          defaults: {},
          overrides: [],
        },
      })),
      templating: {
        list: dashboardConfig.variables.map(variable => ({
          name: variable.name,
          type: variable.type,
          query: variable.value,
          current: { value: variable.value },
        })),
      },
      time: dashboardConfig.timeRange,
      timepicker: {},
      refresh: dashboardConfig.refresh,
      schemaVersion: 30,
      style: 'dark',
      tags: ['ai-social-media-generator', organizationId],
      folderId: 0,
      folderTitle: 'General',
      folderUrl: '',
      overwrite: false,
    };

    // In a real implementation, you would make an API call to Grafana
    // For now, return the dashboard configuration
    return dashboard;
  }

  async getDefaultDashboards(organizationId: string): Promise<DashboardConfig[]> {
    return [
      {
        id: 'content-generation-overview',
        name: 'Content Generation Overview',
        description: 'Overview of content generation performance and metrics',
        type: 'metrics',
        panels: [
          {
            id: 'generation-rate',
            title: 'Generation Rate',
            type: 'graph',
            query: 'rate(content_generation_total[5m])',
            datasource: 'Prometheus',
            position: { x: 0, y: 0, w: 12, h: 8 },
          },
          {
            id: 'generation-duration',
            title: 'Generation Duration',
            type: 'graph',
            query: 'histogram_quantile(0.95, rate(content_generation_duration_bucket[5m]))',
            datasource: 'Prometheus',
            position: { x: 12, y: 0, w: 12, h: 8 },
          },
          {
            id: 'platform-breakdown',
            title: 'Generation by Platform',
            type: 'pie',
            query: 'sum by (platform) (content_generation_total)',
            datasource: 'Prometheus',
            position: { x: 0, y: 8, w: 8, h: 8 },
          },
          {
            id: 'success-rate',
            title: 'Success Rate',
            type: 'stat',
            query: 'sum(rate(content_generation_total{success="true"}[5m])) / sum(rate(content_generation_total[5m])) * 100',
            datasource: 'Prometheus',
            position: { x: 8, y: 8, w: 8, h: 8 },
          },
        ],
        variables: [
          {
            name: 'platform',
            type: 'query',
            value: 'label_values(content_generation_total, platform)',
          },
        ],
        refresh: '30s',
        timeRange: { from: 'now-1h', to: 'now' },
      },
      {
        id: 'policy-check-monitoring',
        name: 'Policy Check Monitoring',
        description: 'Monitor policy check performance and compliance',
        type: 'metrics',
        panels: [
          {
            id: 'policy-check-rate',
            title: 'Policy Check Rate',
            type: 'graph',
            query: 'rate(content_policy_check_total[5m])',
            datasource: 'Prometheus',
            position: { x: 0, y: 0, w: 12, h: 8 },
          },
          {
            id: 'policy-violations',
            title: 'Policy Violations',
            type: 'graph',
            query: 'rate(content_policy_check_total{passed="false"}[5m])',
            datasource: 'Prometheus',
            position: { x: 12, y: 0, w: 12, h: 8 },
          },
          {
            id: 'risk-score-distribution',
            title: 'Risk Score Distribution',
            type: 'heatmap',
            query: 'histogram_quantile(0.5, rate(content_policy_check_risk_score_bucket[5m]))',
            datasource: 'Prometheus',
            position: { x: 0, y: 8, w: 12, h: 8 },
          },
          {
            id: 'compliance-rate',
            title: 'Compliance Rate',
            type: 'stat',
            query: 'sum(rate(content_policy_check_total{passed="true"}[5m])) / sum(rate(content_policy_check_total[5m])) * 100',
            datasource: 'Prometheus',
            position: { x: 12, y: 8, w: 12, h: 8 },
          },
        ],
        variables: [
          {
            name: 'platform',
            type: 'query',
            value: 'label_values(content_policy_check_total, platform)',
          },
        ],
        refresh: '30s',
        timeRange: { from: 'now-1h', to: 'now' },
      },
      {
        id: 'publish-performance',
        name: 'Publish Performance',
        description: 'Monitor content publishing performance and success rates',
        type: 'metrics',
        panels: [
          {
            id: 'publish-rate',
            title: 'Publish Rate',
            type: 'graph',
            query: 'rate(content_publish_total[5m])',
            datasource: 'Prometheus',
            position: { x: 0, y: 0, w: 12, h: 8 },
          },
          {
            id: 'publish-duration',
            title: 'Publish Duration',
            type: 'graph',
            query: 'histogram_quantile(0.95, rate(content_publish_duration_bucket[5m]))',
            datasource: 'Prometheus',
            position: { x: 12, y: 0, w: 12, h: 8 },
          },
          {
            id: 'retry-count',
            title: 'Retry Count',
            type: 'graph',
            query: 'sum by (platform) (content_publish_retry_count)',
            datasource: 'Prometheus',
            position: { x: 0, y: 8, w: 12, h: 8 },
          },
          {
            id: 'success-rate',
            title: 'Publish Success Rate',
            type: 'stat',
            query: 'sum(rate(content_publish_total{success="true"}[5m])) / sum(rate(content_publish_total[5m])) * 100',
            datasource: 'Prometheus',
            position: { x: 12, y: 8, w: 12, h: 8 },
          },
        ],
        variables: [
          {
            name: 'platform',
            type: 'query',
            value: 'label_values(content_publish_total, platform)',
          },
        ],
        refresh: '30s',
        timeRange: { from: 'now-1h', to: 'now' },
      },
      {
        id: 'error-monitoring',
        name: 'Error Monitoring',
        description: 'Monitor application errors and performance issues',
        type: 'mixed',
        panels: [
          {
            id: 'error-rate',
            title: 'Error Rate',
            type: 'graph',
            query: 'rate(errors_total[5m])',
            datasource: 'Prometheus',
            position: { x: 0, y: 0, w: 12, h: 8 },
          },
          {
            id: 'error-types',
            title: 'Error Types',
            type: 'pie',
            query: 'sum by (error_type) (errors_total)',
            datasource: 'Prometheus',
            position: { x: 12, y: 0, w: 12, h: 8 },
          },
          {
            id: 'response-time',
            title: 'Response Time',
            type: 'graph',
            query: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
            datasource: 'Prometheus',
            position: { x: 0, y: 8, w: 12, h: 8 },
          },
          {
            id: 'health-status',
            title: 'Service Health',
            type: 'stat',
            query: 'sum(rate(health_check{healthy="true"}[5m])) / sum(rate(health_check[5m])) * 100',
            datasource: 'Prometheus',
            position: { x: 12, y: 8, w: 12, h: 8 },
          },
        ],
        variables: [
          {
            name: 'error_type',
            type: 'query',
            value: 'label_values(errors_total, error_type)',
          },
        ],
        refresh: '30s',
        timeRange: { from: 'now-1h', to: 'now' },
      },
    ];
  }

  async createCustomDashboard(
    organizationId: string,
    name: string,
    description: string,
    panels: Array<{
      title: string;
      type: 'graph' | 'stat' | 'table' | 'heatmap' | 'pie';
      query: string;
      datasource: string;
    }>,
  ): Promise<GrafanaDashboard> {
    const dashboardConfig: DashboardConfig = {
      id: `custom-${Date.now()}`,
      name,
      description,
      type: 'metrics',
      panels: panels.map((panel, index) => ({
        id: `panel-${index}`,
        ...panel,
        position: { x: (index % 2) * 12, y: Math.floor(index / 2) * 8, w: 12, h: 8 },
      })),
      variables: [],
      refresh: '30s',
      timeRange: { from: 'now-1h', to: 'now' },
    };

    return await this.createDashboard(organizationId, dashboardConfig);
  }

  async getDashboardUrl(
    organizationId: string,
    dashboardUid: string,
  ): Promise<string> {
    const grafanaConfig = await this.getGrafanaConfig(organizationId);
    
    if (!grafanaConfig) {
      throw new Error('Grafana integration not enabled');
    }

    return `${grafanaConfig.url}/d/${dashboardUid}`;
  }

  async listDashboards(organizationId: string): Promise<Array<{
    id: string;
    title: string;
    url: string;
    type: string;
    tags: string[];
  }>> {
    const grafanaConfig = await this.getGrafanaConfig(organizationId);
    
    if (!grafanaConfig) {
      return [];
    }

    // In a real implementation, you would query Grafana API
    // For now, return mock data
    return [
      {
        id: 'content-generation-overview',
        title: 'Content Generation Overview',
        url: `${grafanaConfig.url}/d/content-generation-overview`,
        type: 'metrics',
        tags: ['ai-social-media-generator', organizationId],
      },
      {
        id: 'policy-check-monitoring',
        title: 'Policy Check Monitoring',
        url: `${grafanaConfig.url}/d/policy-check-monitoring`,
        type: 'metrics',
        tags: ['ai-social-media-generator', organizationId],
      },
      {
        id: 'publish-performance',
        title: 'Publish Performance',
        url: `${grafanaConfig.url}/d/publish-performance`,
        type: 'metrics',
        tags: ['ai-social-media-generator', organizationId],
      },
      {
        id: 'error-monitoring',
        title: 'Error Monitoring',
        url: `${grafanaConfig.url}/d/error-monitoring`,
        type: 'mixed',
        tags: ['ai-social-media-generator', organizationId],
      },
    ];
  }

  async updateDashboard(
    organizationId: string,
    dashboardUid: string,
    updates: Partial<DashboardConfig>,
  ): Promise<GrafanaDashboard> {
    const grafanaConfig = await this.getGrafanaConfig(organizationId);
    
    if (!grafanaConfig) {
      throw new Error('Grafana integration not enabled');
    }

    // In a real implementation, you would update the dashboard via Grafana API
    // For now, return a mock updated dashboard
    return {
      id: '1',
      uid: dashboardUid,
      title: updates.name || 'Updated Dashboard',
      url: `${grafanaConfig.url}/d/${dashboardUid}`,
      version: 2,
      panels: [],
      templating: { list: [] },
      time: { from: 'now-1h', to: 'now' },
      timepicker: {},
      refresh: '30s',
      schemaVersion: 30,
      style: 'dark',
      tags: ['ai-social-media-generator', organizationId],
      folderId: 0,
      folderTitle: 'General',
      folderUrl: '',
      overwrite: true,
    };
  }

  async deleteDashboard(
    organizationId: string,
    dashboardUid: string,
  ): Promise<void> {
    const grafanaConfig = await this.getGrafanaConfig(organizationId);
    
    if (!grafanaConfig) {
      throw new Error('Grafana integration not enabled');
    }

    // In a real implementation, you would delete the dashboard via Grafana API
    this.logger.log(`Dashboard ${dashboardUid} deleted for organization ${organizationId}`);
  }
}
