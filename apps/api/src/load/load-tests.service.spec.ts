import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoadTestsService } from './load-tests.service';
import { Post } from '../posts/entities/post.entity';
import { Brief } from '../briefs/entities/brief.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user.entity';
import { PostStatus } from '../posts/entities/post.entity';
import { Platform } from '../shared/enums/platform.enum';

describe('LoadTestsService', () => {
  let service: LoadTestsService;
  let postRepo: Repository<Post>;
  let briefRepo: Repository<Brief>;

  const mockPostRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
      getMany: jest.fn(),
    })),
  };

  const mockBriefRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.ADMIN,
    organizationId: 1,
    isActive: true,
    emailVerified: true,
    password: 'hashed',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoadTestsService,
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepo,
        },
        {
          provide: getRepositoryToken(Brief),
          useValue: mockBriefRepo,
        },
      ],
    }).compile();

    service = module.get<LoadTestsService>(LoadTestsService);
    postRepo = module.get<Repository<Post>>(getRepositoryToken(Post));
    briefRepo = module.get<Repository<Brief>>(getRepositoryToken(Brief));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('testBatchGeneration', () => {
    it('should test batch generation of 500 variants', async () => {
      const briefId = 1;
      const batchSize = 500;
      const platforms = [Platform.LINKEDIN, Platform.TWITTER, Platform.INSTAGRAM];

      const mockGeneratedPosts = Array.from({ length: batchSize }, (_, i) => ({
        id: i + 1,
        content: `Generated post ${i + 1} for load testing`,
        platform: platforms[i % platforms.length],
        briefId,
        organizationId: 1,
        createdBy: mockUser.id,
        status: PostStatus.DRAFT,
        scores: {
          brandFit: 0.8 + Math.random() * 0.2,
          readability: 0.7 + Math.random() * 0.3,
          policyRisk: Math.random() * 0.1,
        },
      }));

      mockPostRepo.create.mockImplementation((data) => data);
      mockPostRepo.save.mockResolvedValue(mockGeneratedPosts);

      const startTime = Date.now();
      const result = await service.testBatchGeneration(briefId, batchSize, mockUser);
      const endTime = Date.now();

      expect(result.totalGenerated).toBe(batchSize);
      expect(result.successCount).toBe(batchSize);
      expect(result.failureCount).toBe(0);
      expect(result.duration).toBe(endTime - startTime);
      expect(result.averageTimePerPost).toBeDefined();
      expect(result.throughput).toBeDefined();
      expect(result.memoryUsage).toBeDefined();
      expect(result.cpuUsage).toBeDefined();
    });

    it('should handle batch generation failures gracefully', async () => {
      const briefId = 1;
      const batchSize = 100;

      // Mock some failures
      const mockGeneratedPosts = Array.from({ length: 80 }, (_, i) => ({
        id: i + 1,
        content: `Generated post ${i + 1}`,
        platform: Platform.LINKEDIN,
        briefId,
        organizationId: 1,
        createdBy: mockUser.id,
        status: PostStatus.DRAFT,
      }));

      mockPostRepo.create.mockImplementation((data) => data);
      mockPostRepo.save
        .mockResolvedValueOnce(mockGeneratedPosts.slice(0, 50))
        .mockRejectedValueOnce(new Error('Database connection failed'))
        .mockResolvedValueOnce(mockGeneratedPosts.slice(50));

      const result = await service.testBatchGeneration(briefId, batchSize, mockUser);

      expect(result.totalGenerated).toBe(100);
      expect(result.successCount).toBe(80);
      expect(result.failureCount).toBe(20);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Database connection failed');
    });

    it('should test batch generation with different platform distributions', async () => {
      const briefId = 1;
      const batchSize = 300;
      const platformDistribution = {
        [Platform.LINKEDIN]: 0.4,
        [Platform.TWITTER]: 0.3,
        [Platform.INSTAGRAM]: 0.2,
        [Platform.FACEBOOK]: 0.1,
      };

      const mockGeneratedPosts = Array.from({ length: batchSize }, (_, i) => ({
        id: i + 1,
        content: `Generated post ${i + 1}`,
        platform: Object.keys(platformDistribution)[i % Object.keys(platformDistribution).length],
        briefId,
        organizationId: 1,
        createdBy: mockUser.id,
        status: PostStatus.DRAFT,
      }));

      mockPostRepo.create.mockImplementation((data) => data);
      mockPostRepo.save.mockResolvedValue(mockGeneratedPosts);

      const result = await service.testBatchGeneration(briefId, batchSize, mockUser, platformDistribution);

      expect(result.totalGenerated).toBe(batchSize);
      expect(result.platformDistribution).toBeDefined();
      expect(result.platformDistribution[Platform.LINKEDIN]).toBeCloseTo(0.4, 1);
      expect(result.platformDistribution[Platform.TWITTER]).toBeCloseTo(0.3, 1);
      expect(result.platformDistribution[Platform.INSTAGRAM]).toBeCloseTo(0.2, 1);
      expect(result.platformDistribution[Platform.FACEBOOK]).toBeCloseTo(0.1, 1);
    });

    it('should test batch generation performance under load', async () => {
      const briefId = 1;
      const batchSizes = [10, 50, 100, 200, 500];
      const results = [];

      for (const batchSize of batchSizes) {
        const mockGeneratedPosts = Array.from({ length: batchSize }, (_, i) => ({
          id: i + 1,
          content: `Generated post ${i + 1}`,
          platform: Platform.LINKEDIN,
          briefId,
          organizationId: 1,
          createdBy: mockUser.id,
          status: PostStatus.DRAFT,
        }));

        mockPostRepo.create.mockImplementation((data) => data);
        mockPostRepo.save.mockResolvedValue(mockGeneratedPosts);

        const result = await service.testBatchGeneration(briefId, batchSize, mockUser);
        results.push(result);
      }

      // Verify performance scaling
      expect(results).toHaveLength(batchSizes.length);
      
      // Check that throughput increases with batch size (up to a point)
      const throughputs = results.map(r => r.throughput);
      expect(throughputs[0]).toBeLessThan(throughputs[2]); // 10 < 100
      expect(throughputs[1]).toBeLessThan(throughputs[3]); // 50 < 200
    });
  });

  describe('testPublishBursts', () => {
    it('should test publish burst with rate limiting', async () => {
      const burstSize = 50;
      const rateLimit = 10; // posts per second
      const platforms = [Platform.LINKEDIN, Platform.TWITTER];

      const mockPosts = Array.from({ length: burstSize }, (_, i) => ({
        id: i + 1,
        content: `Post ${i + 1} for publish burst test`,
        platform: platforms[i % platforms.length],
        organizationId: 1,
        createdBy: mockUser.id,
        status: PostStatus.SCHEDULED,
      }));

      mockPostRepo.find.mockResolvedValue(mockPosts);
      mockPostRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.testPublishBursts(burstSize, rateLimit, mockUser);

      expect(result.totalPublished).toBe(burstSize);
      expect(result.successCount).toBe(burstSize);
      expect(result.failureCount).toBe(0);
      expect(result.duration).toBeDefined();
      expect(result.actualRate).toBeCloseTo(rateLimit, 0);
      expect(result.rateLimitRespected).toBe(true);
      expect(result.burstHandling).toBeDefined();
    });

    it('should handle publish burst failures and retries', async () => {
      const burstSize = 30;
      const rateLimit = 5;

      const mockPosts = Array.from({ length: burstSize }, (_, i) => ({
        id: i + 1,
        content: `Post ${i + 1}`,
        platform: Platform.LINKEDIN,
        organizationId: 1,
        createdBy: mockUser.id,
        status: PostStatus.SCHEDULED,
      }));

      mockPostRepo.find.mockResolvedValue(mockPosts);
      
      // Mock some failures
      mockPostRepo.update
        .mockResolvedValueOnce({ affected: 1 }) // Success
        .mockRejectedValueOnce(new Error('API rate limit exceeded')) // Failure
        .mockResolvedValueOnce({ affected: 1 }) // Success after retry
        .mockResolvedValue({ affected: 1 }); // Rest succeed

      const result = await service.testPublishBursts(burstSize, rateLimit, mockUser);

      expect(result.totalPublished).toBe(burstSize);
      expect(result.successCount).toBe(burstSize - 1);
      expect(result.failureCount).toBe(1);
      expect(result.retryCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('API rate limit exceeded');
    });

    it('should test publish burst with different platforms', async () => {
      const burstSize = 100;
      const rateLimit = 20;
      const platformDistribution = {
        [Platform.LINKEDIN]: 0.5,
        [Platform.TWITTER]: 0.3,
        [Platform.INSTAGRAM]: 0.2,
      };

      const mockPosts = Array.from({ length: burstSize }, (_, i) => ({
        id: i + 1,
        content: `Post ${i + 1}`,
        platform: Object.keys(platformDistribution)[i % Object.keys(platformDistribution).length],
        organizationId: 1,
        createdBy: mockUser.id,
        status: PostStatus.SCHEDULED,
      }));

      mockPostRepo.find.mockResolvedValue(mockPosts);
      mockPostRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.testPublishBursts(burstSize, rateLimit, mockUser, platformDistribution);

      expect(result.totalPublished).toBe(burstSize);
      expect(result.platformBreakdown).toBeDefined();
      expect(result.platformBreakdown[Platform.LINKEDIN]).toBeCloseTo(0.5, 1);
      expect(result.platformBreakdown[Platform.TWITTER]).toBeCloseTo(0.3, 1);
      expect(result.platformBreakdown[Platform.INSTAGRAM]).toBeCloseTo(0.2, 1);
    });

    it('should test publish burst with circuit breaker', async () => {
      const burstSize = 50;
      const rateLimit = 10;
      const failureThreshold = 0.3; // 30% failure rate triggers circuit breaker

      const mockPosts = Array.from({ length: burstSize }, (_, i) => ({
        id: i + 1,
        content: `Post ${i + 1}`,
        platform: Platform.LINKEDIN,
        organizationId: 1,
        createdBy: mockUser.id,
        status: PostStatus.SCHEDULED,
      }));

      mockPostRepo.find.mockResolvedValue(mockPosts);
      
      // Mock failures to trigger circuit breaker
      let failureCount = 0;
      mockPostRepo.update.mockImplementation(() => {
        failureCount++;
        if (failureCount <= Math.floor(burstSize * failureThreshold)) {
          return Promise.reject(new Error('Service unavailable'));
        }
        return Promise.resolve({ affected: 1 });
      });

      const result = await service.testPublishBursts(burstSize, rateLimit, mockUser);

      expect(result.totalPublished).toBe(burstSize);
      expect(result.circuitBreakerTriggered).toBe(true);
      expect(result.circuitBreakerState).toBe('open');
      expect(result.failureRate).toBeCloseTo(failureThreshold, 1);
    });
  });

  describe('testRateLimitBehavior', () => {
    it('should test rate limit enforcement', async () => {
      const requests = 100;
      const rateLimit = 10; // requests per second
      const windowSize = 60; // seconds

      const result = await service.testRateLimitBehavior(requests, rateLimit, windowSize);

      expect(result.totalRequests).toBe(requests);
      expect(result.allowedRequests).toBeLessThanOrEqual(requests);
      expect(result.blockedRequests).toBeGreaterThanOrEqual(0);
      expect(result.rateLimitEnforced).toBe(true);
      expect(result.averageResponseTime).toBeDefined();
      expect(result.peakResponseTime).toBeDefined();
      expect(result.throughput).toBeDefined();
    });

    it('should test rate limit with different user tiers', async () => {
      const userTiers = [
        { tier: 'free', rateLimit: 5 },
        { tier: 'pro', rateLimit: 20 },
        { tier: 'enterprise', rateLimit: 100 },
      ];

      const results = [];

      for (const tier of userTiers) {
        const mockUserWithTier = { ...mockUser, subscription: { plan: tier.tier } };
        
        const result = await service.testRateLimitBehavior(50, tier.rateLimit, 60, mockUserWithTier);
        results.push({ tier: tier.tier, result });
      }

      expect(results).toHaveLength(userTiers.length);
      
      // Verify that higher tiers have higher allowed request counts
      const freeResult = results.find(r => r.tier === 'free').result;
      const proResult = results.find(r => r.tier === 'pro').result;
      const enterpriseResult = results.find(r => r.tier === 'enterprise').result;

      expect(freeResult.allowedRequests).toBeLessThan(proResult.allowedRequests);
      expect(proResult.allowedRequests).toBeLessThan(enterpriseResult.allowedRequests);
    });

    it('should test rate limit burst handling', async () => {
      const burstSize = 50;
      const rateLimit = 10;
      const burstWindow = 5; // seconds

      const result = await service.testRateLimitBehavior(burstSize, rateLimit, 60, mockUser, burstWindow);

      expect(result.totalRequests).toBe(burstSize);
      expect(result.burstHandling).toBeDefined();
      expect(result.burstHandling.peakRequests).toBeGreaterThan(rateLimit);
      expect(result.burstHandling.burstWindow).toBe(burstWindow);
      expect(result.burstHandling.throttlingApplied).toBe(true);
    });

    it('should test rate limit with retry logic', async () => {
      const requests = 30;
      const rateLimit = 5;
      const maxRetries = 3;

      const result = await service.testRateLimitBehavior(requests, rateLimit, 60, mockUser, undefined, maxRetries);

      expect(result.totalRequests).toBe(requests);
      expect(result.retryAttempts).toBeDefined();
      expect(result.retryAttempts.total).toBeGreaterThan(0);
      expect(result.retryAttempts.successful).toBeGreaterThan(0);
      expect(result.retryAttempts.failed).toBeGreaterThanOrEqual(0);
      expect(result.retryAttempts.maxRetries).toBe(maxRetries);
    });
  });

  describe('testConcurrentOperations', () => {
    it('should test concurrent batch generation', async () => {
      const concurrentBatches = 5;
      const batchSize = 50;

      const result = await service.testConcurrentOperations('batch-generation', concurrentBatches, batchSize);

      expect(result.totalOperations).toBe(concurrentBatches);
      expect(result.successfulOperations).toBe(concurrentBatches);
      expect(result.failedOperations).toBe(0);
      expect(result.totalGenerated).toBe(concurrentBatches * batchSize);
      expect(result.duration).toBeDefined();
      expect(result.concurrentThroughput).toBeDefined();
      expect(result.resourceUtilization).toBeDefined();
    });

    it('should test concurrent publish operations', async () => {
      const concurrentPublishes = 3;
      const publishSize = 20;

      const result = await service.testConcurrentOperations('publish', concurrentPublishes, publishSize);

      expect(result.totalOperations).toBe(concurrentPublishes);
      expect(result.successfulOperations).toBe(concurrentPublishes);
      expect(result.failedOperations).toBe(0);
      expect(result.totalPublished).toBe(concurrentPublishes * publishSize);
      expect(result.duration).toBeDefined();
      expect(result.concurrentThroughput).toBeDefined();
      expect(result.rateLimitRespected).toBe(true);
    });

    it('should test concurrent operations with resource constraints', async () => {
      const concurrentOperations = 10;
      const operationSize = 30;
      const maxMemory = 512; // MB
      const maxCPU = 80; // percentage

      const result = await service.testConcurrentOperations(
        'batch-generation',
        concurrentOperations,
        operationSize,
        { maxMemory, maxCPU }
      );

      expect(result.totalOperations).toBe(concurrentOperations);
      expect(result.resourceConstraints).toBeDefined();
      expect(result.resourceConstraints.memoryLimit).toBe(maxMemory);
      expect(result.resourceConstraints.cpuLimit).toBe(maxCPU);
      expect(result.resourceConstraints.violated).toBeDefined();
      expect(result.resourceConstraints.throttlingApplied).toBeDefined();
    });
  });

  describe('runFullLoadTestSuite', () => {
    it('should run complete load test suite', async () => {
      const testConfig = {
        batchGeneration: { size: 100, platforms: [Platform.LINKEDIN, Platform.TWITTER] },
        publishBursts: { size: 50, rateLimit: 10 },
        rateLimiting: { requests: 200, rateLimit: 20 },
        concurrency: { operations: 3, size: 30 },
      };

      const result = await service.runFullLoadTestSuite(testConfig, mockUser);

      expect(result.batchGeneration).toBeDefined();
      expect(result.publishBursts).toBeDefined();
      expect(result.rateLimiting).toBeDefined();
      expect(result.concurrency).toBeDefined();
      expect(result.overallPerformance).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.report).toBeDefined();
    });

    it('should generate load test report', async () => {
      const testConfig = {
        batchGeneration: { size: 50, platforms: [Platform.LINKEDIN] },
        publishBursts: { size: 20, rateLimit: 5 },
        rateLimiting: { requests: 100, rateLimit: 10 },
        concurrency: { operations: 2, size: 15 },
      };

      const result = await service.runFullLoadTestSuite(testConfig, mockUser);

      expect(result.report).toBeDefined();
      expect(result.report.summary).toBeDefined();
      expect(result.report.details).toBeDefined();
      expect(result.report.metrics).toBeDefined();
      expect(result.report.thresholds).toBeDefined();
      expect(result.report.recommendations).toBeDefined();
      expect(result.report.timestamp).toBeDefined();
      expect(result.report.version).toBeDefined();
    });
  });
});
