import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppModule } from '../app.module';
import { BriefsService } from '../briefs/briefs.service';
import { PostsService } from '../posts/posts.service';
import { SchedulerService } from '../scheduler/scheduler.service';
import { PublisherService } from '../publisher/publisher.service';
import { MetricsService } from '../metrics/metrics.service';
import { Brief } from '../briefs/entities/brief.entity';
import { Post } from '../posts/entities/post.entity';
import { ScheduledPost } from '../scheduler/entities/scheduled-post.entity';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Brand } from '../brands/entities/brand.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { UserRole } from '../users/entities/user.entity';
import { PostStatus } from '../posts/entities/post.entity';
import { Platform } from '../shared/enums/platform.enum';

describe('Workflow Integration Tests', () => {
  let app: INestApplication;
  let briefsService: BriefsService;
  let postsService: PostsService;
  let schedulerService: SchedulerService;
  let publisherService: PublisherService;
  let metricsService: MetricsService;

  let testUser: User;
  let testOrganization: Organization;
  let testBrand: Brand;
  let testCampaign: Campaign;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.get('DB_PORT', 5432),
            username: configService.get('DB_USERNAME', 'test'),
            password: configService.get('DB_PASSWORD', 'test'),
            database: configService.get('DB_NAME', 'ai_social_media_test'),
            entities: [__dirname + '/../**/*.entity{.ts,.js}'],
            synchronize: true,
            logging: false,
          }),
          inject: [ConfigService],
        }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get('JWT_SECRET', 'test-secret'),
            signOptions: { expiresIn: '1h' },
          }),
          inject: [ConfigService],
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    briefsService = moduleFixture.get<BriefsService>(BriefsService);
    postsService = moduleFixture.get<PostsService>(PostsService);
    schedulerService = moduleFixture.get<SchedulerService>(SchedulerService);
    publisherService = moduleFixture.get<PublisherService>(PublisherService);
    metricsService = moduleFixture.get<MetricsService>(MetricsService);

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  describe('Complete Workflow: Brief → Generate → Rewrite → Schedule → Publish → Metrics', () => {
    it('should execute complete workflow successfully', async () => {
      // Step 1: Create a brief
      const briefData = {
        title: 'AI Analytics Platform Launch',
        description: 'Create engaging content to introduce our new AI-powered analytics platform',
        campaignId: testCampaign.id,
        brandId: testBrand.id,
        targetAudience: {
          role: 'Business Decision Makers',
          industry: 'Technology, Finance, Healthcare',
          painPoints: ['data complexity', 'manual reporting', 'lack of insights'],
        },
        contentRequirements: {
          tone: 'Professional and innovative',
          keyMessages: [
            'AI-powered insights in minutes, not hours',
            'No technical expertise required',
            'Real-time data visualization',
          ],
          callToAction: 'Start your free trial',
          hashtags: ['#AI', '#Analytics', '#BusinessIntelligence'],
        },
        platforms: [Platform.LINKEDIN, Platform.TWITTER],
        variantsPerPlatform: 2,
      };

      const brief = await briefsService.create(briefData, testUser);
      expect(brief).toBeDefined();
      expect(brief.title).toBe(briefData.title);
      expect(brief.status).toBe('draft');

      // Step 2: Generate posts from brief
      const generationResult = await postsService.generateFromBrief(brief.id, testUser);
      expect(generationResult).toBeDefined();
      expect(generationResult.posts).toHaveLength(4); // 2 platforms × 2 variants
      expect(generationResult.posts.every(post => post.status === PostStatus.DRAFT)).toBe(true);

      const generatedPosts = generationResult.posts;

      // Step 3: Rewrite/optimize posts
      const rewritePromises = generatedPosts.map(post =>
        postsService.rewritePost(post.id, {
          tone: 'more engaging',
          length: 'medium',
          style: 'professional',
        }, testUser)
      );

      const rewrittenPosts = await Promise.all(rewritePromises);
      expect(rewrittenPosts).toHaveLength(4);
      expect(rewrittenPosts.every(post => post.status === PostStatus.DRAFT)).toBe(true);

      // Step 4: Schedule posts
      const schedulePromises = rewrittenPosts.map((post, index) => {
        const scheduledAt = new Date();
        scheduledAt.setHours(10 + index, 0, 0, 0); // Schedule at different hours
        return schedulerService.schedulePost({
          postId: post.id,
          scheduledAt,
          platform: post.platform,
          organizationId: testOrganization.id,
          userId: testUser.id,
        });
      });

      const scheduledPosts = await Promise.all(schedulePromises);
      expect(scheduledPosts).toHaveLength(4);
      expect(scheduledPosts.every(scheduled => scheduled.status === 'scheduled')).toBe(true);

      // Step 5: Publish posts (simulate publishing)
      const publishPromises = scheduledPosts.map(scheduledPost =>
        publisherService.publishPost(scheduledPost.postId, {
          platform: scheduledPost.platform,
          publishNow: true,
          sandboxMode: true, // Use sandbox for testing
        }, testUser)
      );

      const publishedResults = await Promise.all(publishPromises);
      expect(publishedResults).toHaveLength(4);
      expect(publishedResults.every(result => result.success)).toBe(true);

      // Step 6: Ingest metrics
      const metricsPromises = publishedResults.map(result =>
        metricsService.ingestPostMetrics(result.postId, {
          platform: result.platform,
          likes: Math.floor(Math.random() * 100) + 10,
          comments: Math.floor(Math.random() * 20) + 2,
          shares: Math.floor(Math.random() * 30) + 1,
          reach: Math.floor(Math.random() * 1000) + 100,
          impressions: Math.floor(Math.random() * 2000) + 200,
          clicks: Math.floor(Math.random() * 50) + 5,
        })
      );

      const ingestedMetrics = await Promise.all(metricsPromises);
      expect(ingestedMetrics).toHaveLength(4);
      expect(ingestedMetrics.every(metric => metric.success)).toBe(true);

      // Step 7: Verify final state
      const finalPosts = await postsService.findAll(testUser, { briefId: brief.id });
      expect(finalPosts).toHaveLength(4);
      expect(finalPosts.every(post => post.status === PostStatus.PUBLISHED)).toBe(true);

      // Verify metrics were ingested
      const postMetrics = await Promise.all(
        finalPosts.map(post => metricsService.getPostMetrics(post.id))
      );
      expect(postMetrics).toHaveLength(4);
      expect(postMetrics.every(metrics => metrics && metrics.likes > 0)).toBe(true);
    }, 30000); // 30 second timeout for integration test

    it('should handle workflow with policy violations', async () => {
      // Create brief with potentially problematic content
      const briefData = {
        title: 'Get Rich Quick Scheme',
        description: 'Amazing opportunity to make money fast!',
        campaignId: testCampaign.id,
        brandId: testBrand.id,
        targetAudience: {
          role: 'General Audience',
          industry: 'Various',
          painPoints: ['lack of money'],
        },
        contentRequirements: {
          tone: 'Exciting and urgent',
          keyMessages: [
            'Limited time offer!',
            'Get rich quick!',
            'Amazing opportunity!',
          ],
          callToAction: 'Click now!',
          hashtags: ['#Money', '#Opportunity'],
        },
        platforms: [Platform.LINKEDIN],
        variantsPerPlatform: 1,
      };

      const brief = await briefsService.create(briefData, testUser);
      expect(brief).toBeDefined();

      // Generate posts
      const generationResult = await postsService.generateFromBrief(brief.id, testUser);
      expect(generationResult.posts).toHaveLength(1);

      const post = generationResult.posts[0];

      // Check policy compliance
      const policyCheck = await postsService.checkPolicyCompliance(post.id, testUser);
      expect(policyCheck.isCompliant).toBe(false);
      expect(policyCheck.violations.length).toBeGreaterThan(0);

      // Post should be flagged for review
      expect(post.status).toBe(PostStatus.REVIEW_REQUIRED);
    });

    it('should handle workflow with scheduling conflicts', async () => {
      // Create brief
      const briefData = {
        title: 'Test Scheduling Conflict',
        description: 'Testing scheduling conflict resolution',
        campaignId: testCampaign.id,
        brandId: testBrand.id,
        targetAudience: {
          role: 'Test Audience',
          industry: 'Technology',
          painPoints: ['testing'],
        },
        contentRequirements: {
          tone: 'Professional',
          keyMessages: ['Test message'],
          callToAction: 'Test CTA',
          hashtags: ['#Test'],
        },
        platforms: [Platform.LINKEDIN],
        variantsPerPlatform: 2,
      };

      const brief = await briefsService.create(briefData, testUser);
      const generationResult = await postsService.generateFromBrief(brief.id, testUser);
      const posts = generationResult.posts;

      // Try to schedule posts at the same time (conflict)
      const sameTime = new Date();
      sameTime.setHours(10, 0, 0, 0);

      const schedulePromises = posts.map(post =>
        schedulerService.schedulePost({
          postId: post.id,
          scheduledAt: sameTime,
          platform: post.platform,
          organizationId: testOrganization.id,
          userId: testUser.id,
        })
      );

      // First post should be scheduled, others should fail
      const results = await Promise.allSettled(schedulePromises);
      const successfulSchedules = results.filter(result => result.status === 'fulfilled');
      const failedSchedules = results.filter(result => result.status === 'rejected');

      expect(successfulSchedules).toHaveLength(1);
      expect(failedSchedules).toHaveLength(1);
    });

    it('should handle workflow with brand compliance issues', async () => {
      // Create brief that might violate brand guidelines
      const briefData = {
        title: 'Casual AI Platform',
        description: 'Our totally awesome AI thingy',
        campaignId: testCampaign.id,
        brandId: testBrand.id,
        targetAudience: {
          role: 'General Users',
          industry: 'Technology',
          painPoints: ['complexity'],
        },
        contentRequirements: {
          tone: 'Casual and fun',
          keyMessages: [
            'Our AI thingy is super cool',
            'You\'ll love it!',
            'It\'s totally amazing',
          ],
          callToAction: 'Try it out!',
          hashtags: ['#Cool', '#Awesome'],
        },
        platforms: [Platform.LINKEDIN],
        variantsPerPlatform: 1,
      };

      const brief = await briefsService.create(briefData, testUser);
      const generationResult = await postsService.generateFromBrief(brief.id, testUser);
      const post = generationResult.posts[0];

      // Check brand compliance
      const brandCompliance = await postsService.checkBrandCompliance(post.id, testUser);
      expect(brandCompliance.isCompliant).toBe(false);
      expect(brandCompliance.score).toBeLessThan(0.7);
      expect(brandCompliance.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Workflow Error Handling', () => {
    it('should handle brief generation failures gracefully', async () => {
      const invalidBriefData = {
        title: '',
        description: '',
        campaignId: 999999, // Non-existent campaign
        brandId: testBrand.id,
        targetAudience: {},
        contentRequirements: {},
        platforms: [],
        variantsPerPlatform: 0,
      };

      await expect(briefsService.create(invalidBriefData, testUser)).rejects.toThrow();
    });

    it('should handle post generation failures', async () => {
      const briefData = {
        title: 'Valid Brief',
        description: 'Valid description',
        campaignId: testCampaign.id,
        brandId: testBrand.id,
        targetAudience: {
          role: 'Test',
          industry: 'Test',
          painPoints: ['test'],
        },
        contentRequirements: {
          tone: 'Professional',
          keyMessages: ['Test'],
          callToAction: 'Test',
          hashtags: ['#Test'],
        },
        platforms: [Platform.LINKEDIN],
        variantsPerPlatform: 1,
      };

      const brief = await briefsService.create(briefData, testUser);

      // Mock AI service failure
      jest.spyOn(postsService, 'generateFromBrief').mockRejectedValueOnce(
        new Error('AI service unavailable')
      );

      await expect(postsService.generateFromBrief(brief.id, testUser)).rejects.toThrow(
        'AI service unavailable'
      );
    });

    it('should handle publishing failures', async () => {
      // Create a valid post
      const postData = {
        content: 'Test post content',
        platform: Platform.LINKEDIN,
        briefId: null,
        campaignId: testCampaign.id,
        brandId: testBrand.id,
        organizationId: testOrganization.id,
        createdBy: testUser.id,
      };

      const post = await postsService.create(postData, testUser);

      // Mock publisher service failure
      jest.spyOn(publisherService, 'publishPost').mockRejectedValueOnce(
        new Error('Platform API error')
      );

      await expect(
        publisherService.publishPost(post.id, {
          platform: post.platform,
          publishNow: true,
          sandboxMode: true,
        }, testUser)
      ).rejects.toThrow('Platform API error');
    });
  });

  describe('Workflow Performance', () => {
    it('should complete workflow within reasonable time', async () => {
      const startTime = Date.now();

      // Create brief
      const briefData = {
        title: 'Performance Test Brief',
        description: 'Testing workflow performance',
        campaignId: testCampaign.id,
        brandId: testBrand.id,
        targetAudience: {
          role: 'Test',
          industry: 'Test',
          painPoints: ['test'],
        },
        contentRequirements: {
          tone: 'Professional',
          keyMessages: ['Test'],
          callToAction: 'Test',
          hashtags: ['#Test'],
        },
        platforms: [Platform.LINKEDIN],
        variantsPerPlatform: 1,
      };

      const brief = await briefsService.create(briefData, testUser);
      const generationResult = await postsService.generateFromBrief(brief.id, testUser);
      const post = generationResult.posts[0];

      // Schedule and publish
      const scheduledPost = await schedulerService.schedulePost({
        postId: post.id,
        scheduledAt: new Date(),
        platform: post.platform,
        organizationId: testOrganization.id,
        userId: testUser.id,
      });

      await publisherService.publishPost(scheduledPost.postId, {
        platform: scheduledPost.platform,
        publishNow: true,
        sandboxMode: true,
      }, testUser);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
    });
  });

  // Helper functions
  async function setupTestData() {
    // Create test organization
    const organizationRepo = app.get('OrganizationRepository');
    testOrganization = await organizationRepo.save({
      name: 'Test Organization',
      slug: 'test-org',
      description: 'Test organization for integration tests',
      website: 'https://test.com',
      industry: 'Technology',
      size: '10-50',
      isActive: true,
      settings: {
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        currency: 'USD',
        language: 'en',
      },
    });

    // Create test user
    const userRepo = app.get('UserRepository');
    testUser = await userRepo.save({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.ADMIN,
      organizationId: testOrganization.id,
      isActive: true,
      emailVerified: true,
      password: 'hashed-password',
    });

    // Create test brand
    const brandRepo = app.get('BrandRepository');
    testBrand = await brandRepo.save({
      name: 'Test Brand',
      description: 'Test brand for integration tests',
      industry: 'Technology',
      organizationId: testOrganization.id,
      isActive: true,
      createdBy: testUser.id,
    });

    // Create test campaign
    const campaignRepo = app.get('CampaignRepository');
    testCampaign = await campaignRepo.save({
      name: 'Test Campaign',
      description: 'Test campaign for integration tests',
      brandId: testBrand.id,
      organizationId: testOrganization.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'active',
      createdBy: testUser.id,
    });
  }

  async function cleanupTestData() {
    // Clean up test data in reverse order
    const scheduledPostRepo = app.get('ScheduledPostRepository');
    const postRepo = app.get('PostRepository');
    const briefRepo = app.get('BriefRepository');
    const campaignRepo = app.get('CampaignRepository');
    const brandRepo = app.get('BrandRepository');
    const userRepo = app.get('UserRepository');
    const organizationRepo = app.get('OrganizationRepository');

    await scheduledPostRepo.delete({ organizationId: testOrganization.id });
    await postRepo.delete({ organizationId: testOrganization.id });
    await briefRepo.delete({ organizationId: testOrganization.id });
    await campaignRepo.delete({ organizationId: testOrganization.id });
    await brandRepo.delete({ organizationId: testOrganization.id });
    await userRepo.delete({ organizationId: testOrganization.id });
    await organizationRepo.delete({ id: testOrganization.id });
  }
});
