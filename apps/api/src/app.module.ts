import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { MembershipsModule } from './memberships/memberships.module';
import { BrandsModule } from './brands/brands.module';
import { VoiceModelsModule } from './voice-models/voice-models.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { BriefsModule } from './briefs/briefs.module';
import { PostsModule } from './posts/posts.module';
import { VariantsModule } from './variants/variants.module';
import { ConnectorsModule } from './connectors/connectors.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ExperimentsModule } from './experiments/experiments.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AssetsModule } from './assets/assets.module';
import { TemplatesModule } from './templates/templates.module';
import { CommentsModule } from './comments/comments.module';
import { AuditModule } from './audit/audit.module';
import { ApprovalsModule } from './approvals/approvals.module';

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { NatsModule } from './common/nats/nats.module';

import { User } from './users/entities/user.entity';
import { Organization } from './organizations/entities/organization.entity';
import { Membership } from './memberships/entities/membership.entity';
import { Brand } from './brands/entities/brand.entity';
import { VoiceModel } from './voice-models/entities/voice-model.entity';
import { Campaign } from './campaigns/entities/campaign.entity';
import { Brief } from './briefs/entities/brief.entity';
import { Post } from './posts/entities/post.entity';
import { Variant } from './variants/entities/variant.entity';
import { Connector } from './connectors/entities/connector.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'ai_social_media',
      entities: [
        User,
        Organization,
        Membership,
        Brand,
        VoiceModel,
        Campaign,
        Brief,
        Post,
        Variant,
        Connector,
      ],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
      },
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
    PassportModule,
    NatsModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    MembershipsModule,
    BrandsModule,
    VoiceModelsModule,
    CampaignsModule,
    BriefsModule,
    PostsModule,
    VariantsModule,
    ConnectorsModule,
    WebhooksModule,
    ExperimentsModule,
    AnalyticsModule,
    AssetsModule,
    TemplatesModule,
    CommentsModule,
    AuditModule,
    ApprovalsModule,
  ],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: JwtAuthGuard,
    },
    {
      provide: 'APP_GUARD',
      useClass: RolesGuard,
    },
    {
      provide: 'APP_INTERCEPTOR',
      useClass: RequestIdInterceptor,
    },
    {
      provide: 'APP_INTERCEPTOR',
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
