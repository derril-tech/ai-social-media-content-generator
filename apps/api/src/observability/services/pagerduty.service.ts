import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelemetryConfig } from '../entities/telemetry-config.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export interface PagerDutyIncident {
  id: string;
  title: string;
  description: string;
  status: 'triggered' | 'acknowledged' | 'resolved';
  urgency: 'high' | 'low';
  priority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  service: {
    id: string;
    name: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  tags: Record<string, string>;
  context: Record<string, any>;
}

export interface PagerDutyService {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'warning' | 'critical' | 'maintenance';
  escalationPolicy: {
    id: string;
    name: string;
  };
  teams: Array<{
    id: string;
    name: string;
  }>;
}

export interface PagerDutyUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'observer' | 'responder';
  teams: Array<{
    id: string;
    name: string;
  }>;
  contactMethods: Array<{
    type: 'email' | 'phone' | 'sms' | 'push';
    address: string;
  }>;
}

export interface PagerDutyConfig {
  apiKey: string;
  organizationId: string;
  defaultServiceId: string;
  escalationPolicyId: string;
  enableIncidentManagement: boolean;
  enableOnCallSchedules: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
}

@Injectable()
export class PagerDutyService {
  private readonly logger = new Logger(PagerDutyService.name);

  constructor(
    @InjectRepository(TelemetryConfig)
    private readonly telemetryConfigRepository: Repository<TelemetryConfig>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async getPagerDutyConfig(organizationId: string): Promise<PagerDutyConfig | null> {
    const config = await this.telemetryConfigRepository.findOne({
      where: { organizationId, isActive: true },
    });

    if (!config?.enableAlerting || config.alertProvider !== 'pagerduty') {
      return null;
    }

    return {
      apiKey: config.alertConfig.apiKey || process.env.PAGERDUTY_API_KEY,
      organizationId: config.alertConfig.organizationId || process.env.PAGERDUTY_ORG_ID,
      defaultServiceId: config.alertConfig.defaultServiceId,
      escalationPolicyId: config.alertConfig.escalationPolicyId,
      enableIncidentManagement: config.alertConfig.enableIncidentManagement || true,
      enableOnCallSchedules: config.alertConfig.enableOnCallSchedules || false,
      webhookUrl: config.alertConfig.webhookUrl,
      webhookSecret: config.alertConfig.webhookSecret,
    };
  }

  async createIncident(
    organizationId: string,
    incident: {
      title: string;
      description: string;
      urgency?: 'high' | 'low';
      priority?: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
      serviceId?: string;
      assigneeId?: string;
      tags?: Record<string, string>;
      context?: Record<string, any>;
    },
  ): Promise<PagerDutyIncident> {
    const pagerDutyConfig = await this.getPagerDutyConfig(organizationId);
    
    if (!pagerDutyConfig) {
      throw new Error('PagerDuty not configured for this organization');
    }

    // In a real implementation, you would use PagerDuty API
    // For now, create a mock incident
    const mockIncident: PagerDutyIncident = {
      id: `pd-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      title: incident.title,
      description: incident.description,
      status: 'triggered',
      urgency: incident.urgency || 'high',
      priority: incident.priority || 'P2',
      service: {
        id: incident.serviceId || pagerDutyConfig.defaultServiceId,
        name: 'AI Content Generator Service',
      },
      assignee: incident.assigneeId ? {
        id: incident.assigneeId,
        name: 'On-Call Engineer',
        email: 'oncall@example.com',
      } : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: {
        organization: organizationId,
        ...incident.tags,
      },
      context: incident.context || {},
    };

    this.logger.log('PagerDuty incident created', {
      organizationId,
      incidentId: mockIncident.id,
      title: mockIncident.title,
      urgency: mockIncident.urgency,
      priority: mockIncident.priority,
    });

    return mockIncident;
  }

  async getIncidents(
    organizationId: string,
    status?: 'triggered' | 'acknowledged' | 'resolved',
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ incidents: PagerDutyIncident[]; total: number }> {
    const pagerDutyConfig = await this.getPagerDutyConfig(organizationId);
    
    if (!pagerDutyConfig) {
      return { incidents: [], total: 0 };
    }

    // In a real implementation, you would query PagerDuty API
    // For now, return mock data
    const mockIncidents: PagerDutyIncident[] = [
      {
        id: 'pd-incident-1',
        title: 'High Error Rate in Content Generation',
        description: 'Error rate exceeded 5% threshold in content generation service',
        status: 'triggered',
        urgency: 'high',
        priority: 'P1',
        service: {
          id: pagerDutyConfig.defaultServiceId,
          name: 'AI Content Generator Service',
        },
        assignee: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(),
        tags: {
          service: 'content-generation',
          platform: 'twitter',
          organization: organizationId,
        },
        context: {
          errorRate: 0.067,
          threshold: 0.05,
          affectedUsers: 45,
        },
      },
      {
        id: 'pd-incident-2',
        title: 'Policy Check Service Timeout',
        description: 'Policy check service is taking longer than expected',
        status: 'acknowledged',
        urgency: 'low',
        priority: 'P3',
        service: {
          id: pagerDutyConfig.defaultServiceId,
          name: 'AI Content Generator Service',
        },
        assignee: {
          id: 'user-2',
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
        },
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        updatedAt: new Date(),
        tags: {
          service: 'policy-check',
          organization: organizationId,
        },
        context: {
          avgResponseTime: 8500,
          threshold: 5000,
        },
      },
      {
        id: 'pd-incident-3',
        title: 'Publish Service Unavailable',
        description: 'Publish service is returning 503 errors',
        status: 'resolved',
        urgency: 'high',
        priority: 'P1',
        service: {
          id: pagerDutyConfig.defaultServiceId,
          name: 'AI Content Generator Service',
        },
        assignee: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        updatedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        resolvedAt: new Date(Date.now() - 30 * 60 * 1000),
        tags: {
          service: 'publish',
          platform: 'linkedin',
          organization: organizationId,
        },
        context: {
          errorCode: 503,
          downtime: '2 hours 30 minutes',
        },
      },
    ];

    let filteredIncidents = mockIncidents;
    if (status) {
      filteredIncidents = mockIncidents.filter(incident => incident.status === status);
    }

    const paginatedIncidents = filteredIncidents.slice(offset, offset + limit);

    return {
      incidents: paginatedIncidents,
      total: filteredIncidents.length,
    };
  }

  async getIncidentDetails(
    organizationId: string,
    incidentId: string,
  ): Promise<PagerDutyIncident | null> {
    const pagerDutyConfig = await this.getPagerDutyConfig(organizationId);
    
    if (!pagerDutyConfig) {
      return null;
    }

    // In a real implementation, you would query PagerDuty API
    // For now, return mock data
    const mockIncident: PagerDutyIncident = {
      id: incidentId,
      title: 'High Error Rate in Content Generation',
      description: 'Error rate exceeded 5% threshold in content generation service',
      status: 'triggered',
      urgency: 'high',
      priority: 'P1',
      service: {
        id: pagerDutyConfig.defaultServiceId,
        name: 'AI Content Generator Service',
      },
      assignee: {
        id: 'user-1',
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(),
      tags: {
        service: 'content-generation',
        platform: 'twitter',
        organization: organizationId,
      },
      context: {
        errorRate: 0.067,
        threshold: 0.05,
        affectedUsers: 45,
        lastError: 'Content generation timeout after 30 seconds',
        stackTrace: 'Error: Timeout...',
      },
    };

    return mockIncident;
  }

  async acknowledgeIncident(
    organizationId: string,
    incidentId: string,
    userId: string,
    note?: string,
  ): Promise<void> {
    const pagerDutyConfig = await this.getPagerDutyConfig(organizationId);
    
    if (!pagerDutyConfig) {
      throw new Error('PagerDuty not configured for this organization');
    }

    // In a real implementation, you would update the incident via PagerDuty API
    this.logger.log('PagerDuty incident acknowledged', {
      organizationId,
      incidentId,
      userId,
      note,
    });
  }

  async resolveIncident(
    organizationId: string,
    incidentId: string,
    userId: string,
    resolution?: string,
  ): Promise<void> {
    const pagerDutyConfig = await this.getPagerDutyConfig(organizationId);
    
    if (!pagerDutyConfig) {
      throw new Error('PagerDuty not configured for this organization');
    }

    // In a real implementation, you would update the incident via PagerDuty API
    this.logger.log('PagerDuty incident resolved', {
      organizationId,
      incidentId,
      userId,
      resolution,
    });
  }

  async addIncidentNote(
    organizationId: string,
    incidentId: string,
    userId: string,
    note: string,
  ): Promise<void> {
    const pagerDutyConfig = await this.getPagerDutyConfig(organizationId);
    
    if (!pagerDutyConfig) {
      throw new Error('PagerDuty not configured for this organization');
    }

    // In a real implementation, you would add the note via PagerDuty API
    this.logger.log('PagerDuty incident note added', {
      organizationId,
      incidentId,
      userId,
      note,
    });
  }

  async getServices(
    organizationId: string,
  ): Promise<PagerDutyService[]> {
    const pagerDutyConfig = await this.getPagerDutyConfig(organizationId);
    
    if (!pagerDutyConfig) {
      return [];
    }

    // In a real implementation, you would query PagerDuty API
    // For now, return mock data
    return [
      {
        id: pagerDutyConfig.defaultServiceId,
        name: 'AI Content Generator Service',
        description: 'Main service for AI-powered content generation',
        status: 'active',
        escalationPolicy: {
          id: pagerDutyConfig.escalationPolicyId,
          name: 'Engineering On-Call',
        },
        teams: [
          {
            id: 'team-1',
            name: 'Engineering',
          },
          {
            id: 'team-2',
            name: 'DevOps',
          },
        ],
      },
      {
        id: 'service-2',
        name: 'Policy Check Service',
        description: 'Service for content policy validation',
        status: 'warning',
        escalationPolicy: {
          id: pagerDutyConfig.escalationPolicyId,
          name: 'Engineering On-Call',
        },
        teams: [
          {
            id: 'team-1',
            name: 'Engineering',
          },
        ],
      },
      {
        id: 'service-3',
        name: 'Publish Service',
        description: 'Service for publishing content to social media platforms',
        status: 'active',
        escalationPolicy: {
          id: pagerDutyConfig.escalationPolicyId,
          name: 'Engineering On-Call',
        },
        teams: [
          {
            id: 'team-1',
            name: 'Engineering',
          },
        ],
      },
    ];
  }

  async getOnCallUsers(
    organizationId: string,
    serviceId?: string,
  ): Promise<PagerDutyUser[]> {
    const pagerDutyConfig = await this.getPagerDutyConfig(organizationId);
    
    if (!pagerDutyConfig) {
      return [];
    }

    // In a real implementation, you would query PagerDuty API
    // For now, return mock data
    return [
      {
        id: 'user-1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'responder',
        teams: [
          {
            id: 'team-1',
            name: 'Engineering',
          },
        ],
        contactMethods: [
          {
            type: 'email',
            address: 'john.doe@example.com',
          },
          {
            type: 'phone',
            address: '+1-555-0123',
          },
        ],
      },
      {
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'responder',
        teams: [
          {
            id: 'team-1',
            name: 'Engineering',
          },
        ],
        contactMethods: [
          {
            type: 'email',
            address: 'jane.smith@example.com',
          },
          {
            type: 'sms',
            address: '+1-555-0456',
          },
        ],
      },
      {
        id: 'user-3',
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        role: 'manager',
        teams: [
          {
            id: 'team-1',
            name: 'Engineering',
          },
          {
            id: 'team-2',
            name: 'DevOps',
          },
        ],
        contactMethods: [
          {
            type: 'email',
            address: 'bob.johnson@example.com',
          },
          {
            type: 'phone',
            address: '+1-555-0789',
          },
        ],
      },
    ];
  }

  async getIncidentStats(
    organizationId: string,
    timeRange: { start: Date; end: Date },
  ): Promise<{
    totalIncidents: number;
    incidentsByStatus: Record<string, number>;
    incidentsByPriority: Record<string, number>;
    incidentsByService: Record<string, number>;
    averageResolutionTime: number;
    mtta: number; // Mean Time to Acknowledge
    mttr: number; // Mean Time to Resolve
  }> {
    const pagerDutyConfig = await this.getPagerDutyConfig(organizationId);
    
    if (!pagerDutyConfig) {
      return {
        totalIncidents: 0,
        incidentsByStatus: {},
        incidentsByPriority: {},
        incidentsByService: {},
        averageResolutionTime: 0,
        mtta: 0,
        mttr: 0,
      };
    }

    // In a real implementation, you would query PagerDuty API
    // For now, return mock data
    return {
      totalIncidents: 24,
      incidentsByStatus: {
        triggered: 3,
        acknowledged: 2,
        resolved: 19,
      },
      incidentsByPriority: {
        P1: 2,
        P2: 8,
        P3: 12,
        P4: 2,
        P5: 0,
      },
      incidentsByService: {
        'AI Content Generator Service': 15,
        'Policy Check Service': 6,
        'Publish Service': 3,
      },
      averageResolutionTime: 45, // minutes
      mtta: 8, // minutes
      mttr: 45, // minutes
    };
  }

  async createIncidentFromAlert(
    organizationId: string,
    alert: {
      title: string;
      message: string;
      severity: 'critical' | 'warning' | 'info';
      source: string;
      tags?: Record<string, string>;
      context?: Record<string, any>;
    },
  ): Promise<PagerDutyIncident> {
    const urgency = alert.severity === 'critical' ? 'high' : 'low';
    const priority = alert.severity === 'critical' ? 'P1' : alert.severity === 'warning' ? 'P2' : 'P3';

    return this.createIncident(organizationId, {
      title: alert.title,
      description: alert.message,
      urgency,
      priority,
      tags: {
        source: alert.source,
        ...alert.tags,
      },
      context: alert.context,
    });
  }
}
