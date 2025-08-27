# Observability System

A comprehensive observability solution for the AI Social Media Content Generator that provides error tracking, alerting, incident management, and notifications across multiple platforms.

## Features

### 🔍 Error Tracking & Monitoring
- **Sentry Integration**: Real-time error tracking with stack traces, breadcrumbs, and performance monitoring
- **Custom Error Capture**: Built-in error capture with context and severity classification
- **Performance Monitoring**: Automatic performance span tracking and metrics collection

### 🚨 Alerting & Incident Management
- **PagerDuty Integration**: Full incident management with escalation policies and on-call schedules
- **Custom Alert Rules**: Configurable alert rules based on metrics, thresholds, and conditions
- **Multi-Severity Support**: Critical, high, medium, and low severity levels
- **Alert Lifecycle Management**: Acknowledge, resolve, and track alert status

### 📢 Notifications
- **Slack Integration**: Rich notifications with blocks, attachments, and threading
- **Multi-Channel Support**: Email, webhook, and custom notification channels
- **Templated Messages**: Pre-built templates for errors, alerts, incidents, and metrics
- **Mention Support**: User mentions and channel targeting

### 📊 Metrics & Analytics
- **Custom Metrics**: Capture and track custom metrics with tags and units
- **Threshold Monitoring**: Automatic alerting based on metric thresholds
- **Statistical Analysis**: Error rates, incident statistics, and performance metrics
- **Time-Series Data**: Historical data retention and trend analysis

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │  Observability  │    │   External      │
│     Layer       │───▶│     Service     │───▶│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Alert Rules   │
                       │   & Channels    │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Sentry        │
                       │   PagerDuty     │
                       │   Slack         │
                       └─────────────────┘
```

## Configuration

### Environment Variables

```bash
# Sentry Configuration
SENTRY_DSN=your_sentry_dsn
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0

# PagerDuty Configuration
PAGERDUTY_API_KEY=your_pagerduty_api_key
PAGERDUTY_ORG_ID=your_pagerduty_org_id

# Slack Configuration
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_APP_TOKEN=your_slack_app_token
SLACK_SIGNING_SECRET=your_slack_signing_secret
```

### Database Schema

The observability system uses the `TelemetryConfig` entity to store configuration:

```typescript
interface TelemetryConfig {
  id: string;
  organizationId: string;
  isActive: boolean;
  
  // Feature flags
  enableAlerting: boolean;
  enableNotifications: boolean;
  enableMetrics: boolean;
  enableTracing: boolean;
  
  // Provider configuration
  alertProvider: 'sentry' | 'pagerduty' | 'custom';
  notificationProvider: 'slack' | 'email' | 'webhook';
  
  // Provider-specific configs
  alertConfig: Record<string, any>;
  notificationConfig: Record<string, any>;
  
  // Alert rules and channels
  alertRules: AlertRule[];
  notificationChannels: NotificationChannel[];
  
  // Data retention
  retentionDays: number;
  samplingRate: number;
  
  createdAt: Date;
  updatedAt: Date;
}
```

## Usage

### Basic Setup

1. **Enable Observability for Organization**:
```typescript
await observabilityService.updateConfig(organizationId, {
  enableAlerting: true,
  enableNotifications: true,
  enableMetrics: true,
  alertProvider: 'sentry',
  notificationProvider: 'slack',
});
```

2. **Create Alert Rules**:
```typescript
await observabilityService.createAlertRule(organizationId, {
  name: 'High Error Rate',
  description: 'Alert when error rate exceeds 5%',
  condition: {
    metric: 'error_rate',
    operator: 'gt',
    threshold: 0.05,
    duration: 300, // 5 minutes
  },
  severity: 'high',
  enabled: true,
  actions: {
    sentry: true,
    pagerduty: true,
    slack: true,
  },
  tags: {
    service: 'content-generation',
    environment: 'production',
  },
});
```

3. **Create Notification Channels**:
```typescript
await observabilityService.createNotificationChannel(organizationId, {
  name: 'Engineering Alerts',
  type: 'slack',
  config: {
    channel: '#engineering-alerts',
  },
  enabled: true,
  recipients: ['U1234567890', 'U1234567891'],
});
```

### Error Tracking

```typescript
// Capture exceptions automatically
try {
  // Your code here
} catch (error) {
  await observabilityService.captureException(organizationId, error, {
    userId: user.id,
    requestId: request.id,
    additionalContext: 'custom data',
  });
}

// Manual error capture
await observabilityService.captureException(organizationId, new Error('Custom error'), {
  severity: 'critical',
  tags: { component: 'content-generator' },
});
```

### Metrics Collection

```typescript
// Capture custom metrics
await observabilityService.captureMetric(organizationId, {
  name: 'content_generation_duration',
  value: 2.5,
  unit: 'seconds',
  tags: {
    platform: 'twitter',
    content_type: 'post',
  },
});

// Metrics will automatically trigger alerts based on rules
```

### Manual Alerting

```typescript
// Trigger manual alerts
await observabilityService.triggerAlert(organizationId, {
  title: 'Service Degradation Detected',
  message: 'Content generation service is responding slowly',
  severity: 'medium',
  source: 'health-check',
  tags: {
    service: 'content-generation',
    region: 'us-east-1',
  },
  context: {
    responseTime: 5000,
    threshold: 2000,
  },
});
```

## API Endpoints

### Configuration
- `GET /observability/config` - Get observability configuration
- `PUT /observability/config` - Update observability configuration

### Alert Rules
- `GET /observability/alert-rules` - Get all alert rules
- `POST /observability/alert-rules` - Create new alert rule
- `PUT /observability/alert-rules/:id` - Update alert rule
- `DELETE /observability/alert-rules/:id` - Delete alert rule

### Notification Channels
- `GET /observability/notification-channels` - Get all notification channels
- `POST /observability/notification-channels` - Create new notification channel
- `PUT /observability/notification-channels/:id` - Update notification channel
- `DELETE /observability/notification-channels/:id` - Delete notification channel

### Alerts
- `POST /observability/alerts/trigger` - Trigger manual alert
- `POST /observability/alerts/:id/acknowledge` - Acknowledge alert
- `POST /observability/alerts/:id/resolve` - Resolve alert
- `GET /observability/alerts/stats` - Get alert statistics

### Metrics
- `POST /observability/metrics/capture` - Capture metric

### Sentry Integration
- `GET /observability/sentry/alerts` - Get Sentry alerts
- `GET /observability/sentry/alerts/:id` - Get Sentry alert details
- `POST /observability/sentry/alerts/:id/resolve` - Resolve Sentry alert
- `POST /observability/sentry/alerts/:id/ignore` - Ignore Sentry alert
- `GET /observability/sentry/stats` - Get Sentry error statistics

### PagerDuty Integration
- `GET /observability/pagerduty/incidents` - Get PagerDuty incidents
- `GET /observability/pagerduty/incidents/:id` - Get PagerDuty incident details
- `POST /observability/pagerduty/incidents/:id/acknowledge` - Acknowledge PagerDuty incident
- `POST /observability/pagerduty/incidents/:id/resolve` - Resolve PagerDuty incident
- `GET /observability/pagerduty/services` - Get PagerDuty services
- `GET /observability/pagerduty/oncall` - Get PagerDuty on-call users
- `GET /observability/pagerduty/stats` - Get PagerDuty incident statistics

### Slack Integration
- `GET /observability/slack/channels` - Get Slack channels
- `GET /observability/slack/users` - Get Slack users
- `POST /observability/slack/send` - Send Slack message
- `POST /observability/slack/test` - Test Slack integration

## Alert Rule Examples

### Error Rate Monitoring
```json
{
  "name": "High Error Rate",
  "description": "Alert when error rate exceeds 5%",
  "condition": {
    "metric": "error_rate",
    "operator": "gt",
    "threshold": 0.05,
    "duration": 300
  },
  "severity": "high",
  "enabled": true,
  "actions": {
    "sentry": true,
    "pagerduty": true,
    "slack": true
  },
  "tags": {
    "service": "content-generation",
    "environment": "production"
  }
}
```

### Response Time Monitoring
```json
{
  "name": "Slow Response Time",
  "description": "Alert when average response time exceeds 5 seconds",
  "condition": {
    "metric": "response_time_avg",
    "operator": "gt",
    "threshold": 5000,
    "duration": 600
  },
  "severity": "medium",
  "enabled": true,
  "actions": {
    "slack": true
  },
  "tags": {
    "service": "api",
    "endpoint": "content-generation"
  }
}
```

### Availability Monitoring
```json
{
  "name": "Service Unavailable",
  "description": "Alert when service availability drops below 99%",
  "condition": {
    "metric": "availability",
    "operator": "lt",
    "threshold": 0.99,
    "duration": 300
  },
  "severity": "critical",
  "enabled": true,
  "actions": {
    "sentry": true,
    "pagerduty": true,
    "slack": true
  },
  "tags": {
    "service": "content-generation",
    "critical": "true"
  }
}
```

## Notification Templates

### Error Notification
```typescript
await slackService.sendErrorNotification(organizationId, {
  title: 'Database Connection Failed',
  message: 'Unable to connect to primary database',
  stack: error.stack,
  context: {
    database: 'primary',
    retryCount: 3,
  },
  severity: 'critical',
}, '#alerts', ['U1234567890']);
```

### Alert Notification
```typescript
await slackService.sendAlertNotification(organizationId, {
  title: 'High Error Rate Detected',
  message: 'Error rate has exceeded 5% threshold',
  level: 'error',
  source: 'metric-threshold',
  tags: {
    service: 'content-generation',
    metric: 'error_rate',
  },
  url: 'https://sentry.io/alerts/123',
}, '#engineering-alerts');
```

### Incident Notification
```typescript
await slackService.sendIncidentNotification(organizationId, {
  id: 'incident-123',
  title: 'Service Degradation',
  description: 'Content generation service is responding slowly',
  status: 'triggered',
  urgency: 'high',
  priority: 'P1',
  service: 'AI Content Generator',
  assignee: 'U1234567890',
  url: 'https://pagerduty.com/incidents/123',
}, '#incidents');
```

### Metrics Notification
```typescript
await slackService.sendMetricsNotification(organizationId, {
  title: 'Performance Metrics',
  summary: 'Weekly performance summary',
  data: [
    { name: 'Avg Response Time', value: 2.5, unit: 's', trend: 'down' },
    { name: 'Error Rate', value: 0.02, unit: '%', trend: 'stable' },
    { name: 'Throughput', value: 1500, unit: 'req/min', trend: 'up' },
  ],
  url: 'https://grafana.com/dashboards/123',
}, '#metrics');
```

## Best Practices

### 1. Alert Rule Design
- **Avoid Alert Fatigue**: Set appropriate thresholds and durations
- **Use Meaningful Names**: Clear, descriptive alert rule names
- **Tag Everything**: Use tags for filtering and organization
- **Test Alerts**: Regularly test alert rules and notifications

### 2. Error Handling
- **Capture Context**: Include relevant context with errors
- **Classify Severity**: Use appropriate severity levels
- **Avoid Sensitive Data**: Never log passwords or tokens
- **Use Structured Logging**: Consistent log format and structure

### 3. Metrics Collection
- **Define Clear Metrics**: Well-defined metric names and units
- **Use Tags Wisely**: Tag metrics for filtering and grouping
- **Monitor Cardinality**: Avoid high-cardinality tags
- **Set Baselines**: Establish normal ranges for metrics

### 4. Notification Management
- **Right Channel, Right Time**: Use appropriate channels for different severities
- **Avoid Spam**: Implement rate limiting and deduplication
- **Include Context**: Provide enough context for quick resolution
- **Test Integrations**: Regularly test notification channels

### 5. Incident Response
- **Define Escalation**: Clear escalation policies and procedures
- **Document Runbooks**: Standard operating procedures for common issues
- **Post-Mortems**: Learn from incidents and improve processes
- **Automate Where Possible**: Automate routine tasks and responses

## Troubleshooting

### Common Issues

1. **Alerts Not Triggering**
   - Check if alerting is enabled for the organization
   - Verify alert rule conditions and thresholds
   - Ensure metrics are being captured correctly

2. **Notifications Not Sending**
   - Verify notification provider configuration
   - Check channel/recipient configuration
   - Test integration endpoints

3. **High Alert Volume**
   - Review and adjust alert thresholds
   - Implement alert deduplication
   - Use appropriate severity levels

4. **Integration Failures**
   - Check API keys and authentication
   - Verify network connectivity
   - Review rate limits and quotas

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
// In your application configuration
const config = await observabilityService.getConfig(organizationId);
if (config) {
  config.samplingRate = 1.0; // Capture all events
  await observabilityService.updateConfig(organizationId, config);
}
```

### Testing Integrations

Use the test endpoints to verify integrations:

```bash
# Test Slack integration
curl -X POST /observability/slack/test \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test alert triggering
curl -X POST /observability/alerts/trigger \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Alert",
    "message": "This is a test alert",
    "severity": "info",
    "source": "test"
  }'
```

## Security Considerations

1. **API Key Management**: Store API keys securely and rotate regularly
2. **Access Control**: Use role-based access control for observability features
3. **Data Privacy**: Ensure no sensitive data is logged or transmitted
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Audit Logging**: Log all configuration changes and access attempts

## Performance Considerations

1. **Async Processing**: Use async/await for all external API calls
2. **Batching**: Batch metrics and events where possible
3. **Caching**: Cache configuration and frequently accessed data
4. **Sampling**: Use sampling for high-volume metrics
5. **Retention**: Implement data retention policies

## Future Enhancements

1. **Grafana Integration**: Direct integration with Grafana dashboards
2. **Prometheus Metrics**: Export metrics in Prometheus format
3. **Custom Dashboards**: Built-in dashboard creation and management
4. **Machine Learning**: Anomaly detection and predictive alerting
5. **Workflow Automation**: Automated incident response workflows
6. **Multi-Region Support**: Cross-region observability and alerting
7. **Mobile Notifications**: Push notifications for critical alerts
8. **Voice Alerts**: Voice-based alerting for critical incidents
