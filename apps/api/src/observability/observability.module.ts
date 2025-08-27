import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelemetryConfig } from './entities/telemetry-config.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { ObservabilityService } from './services/observability.service';
import { SentryService } from './services/sentry.service';
import { PagerDutyService } from './services/pagerduty.service';
import { SlackService } from './services/slack.service';
import { ObservabilityController } from './controllers/observability.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TelemetryConfig, Organization]),
  ],
  providers: [
    ObservabilityService,
    SentryService,
    PagerDutyService,
    SlackService,
  ],
  controllers: [ObservabilityController],
  exports: [
    ObservabilityService,
    SentryService,
    PagerDutyService,
    SlackService,
  ],
})
export class ObservabilityModule {}
