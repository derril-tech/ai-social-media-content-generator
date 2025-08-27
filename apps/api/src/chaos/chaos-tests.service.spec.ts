import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChaosTestsService } from './chaos-tests.service';
import { Post } from '../posts/entities/post.entity';
import { Connector } from '../connectors/entities/connector.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user.entity';
import { PostStatus } from '../posts/entities/post.entity';
import { Platform } from '../shared/enums/platform.enum';

describe('ChaosTestsService', () => {
  let service: ChaosTestsService;
  let postRepo: Repository<Post>;
  let connectorRepo: Repository<Connector>;

  const mockPostRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
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

  const mockConnectorRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
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
        ChaosTestsService,
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepo,
        },
        {
          provide: getRepositoryToken(Connector),
          useValue: mockConnectorRepo,
        },
      ],
    }).compile();

    service = module.get<ChaosTestsService>(ChaosTestsService);
    postRepo = module.get<Repository<Post>>(getRepositoryToken(Post));
    connectorRepo = module.get<Repository<Connector>>(getRepositoryToken(Connector));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('testConnectorFailures', () => {
    it('should test 429 rate limit errors with retries and backoff', async () => {
      const posts = [
        {
          id: 1,
          content: 'Test post 1',
          platform: Platform.LINKEDIN,
          organizationId: 1,
          createdBy: mockUser.id,
          status: PostStatus.SCHEDULED,
        },
        {
          id: 2,
          content: 'Test post 2',
          platform: Platform.TWITTER,
          organizationId: 1,
          createdBy: mockUser.id,
          status: PostStatus.SCHEDULED,
        },
      ];

      mockPostRepo.find.mockResolvedValue(posts);

      // Mock 429 errors with eventual success
      let attemptCount = 0;
      mockPostRepo.update.mockImplementation(() => {
        attemptCount++;
        if (attemptCount <= 3) {
          return Promise.reject(new Error('429 Too Many Requests'));
        }
        return Promise.resolve({ affected: 1 });
      });

      const result = await service.testConnectorFailures('rate-limit', posts, mockUser);

      expect(result.totalPosts).toBe(2);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(result.retryCount).toBe(6); // 3 retries per post
      expect(result.backoffApplied).toBe(true);
      expect(result.averageRetriesPerPost).toBe(3);
      expect(result.totalDuration).toBeDefined();
    });

    it('should test 5xx server errors with circuit breaker', async () => {
      const posts = [
        {
          id: 1,
          content: 'Test post 1',
          platform: Platform.LINKEDIN,
          organizationId: 1,
          createdBy: mockUser.id,
          status: PostStatus.SCHEDULED,
        },
      ];

      mockPostRepo.find.mockResolvedValue(posts);

      // Mock 5xx errors to trigger circuit breaker
      mockPostRepo.update.mockRejectedValue(new Error('500 Internal Server Error'));

      const result = await service.testConnectorFailures('server-error', posts, mockUser);

      expect(result.totalPosts).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(1);
      expect(result.circuitBreakerTriggered).toBe(true);
      expect(result.circuitBreakerState).toBe('open');
      expect(result.fallbackApplied).toBe(true);
      expect(result.dlqEnabled).toBe(true);
    });

    it('should test network timeouts with graceful degradation', async () => {
      const posts = [
        {
          id: 1,
          content: 'Test post 1',
          platform: Platform.LINKEDIN,
          organizationId: 1,
          createdBy: mockUser.id,
          status: PostStatus.SCHEDULED,
        },
        {
          id: 2,
          content: 'Test post 2',
          platform: Platform.TWITTER,
          organizationId: 1,
          createdBy: mockUser.id,
          status: PostStatus.SCHEDULED,
        },
      ];

      mockPostRepo.find.mockResolvedValue(posts);

      // Mock timeout errors
      mockPostRepo.update.mockRejectedValue(new Error('Request timeout'));

      const result = await service.testConnectorFailures('timeout', posts, mockUser);

      expect(result.totalPosts).toBe(2);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(2);
      expect(result.timeoutErrors).toBe(2);
      expect(result.gracefulDegradation).toBe(true);
      expect(result.fallbackStrategy).toBe('queue-for-retry');
      expect(result.alertTriggered).toBe(true);
    });

    it('should test partial failures with mixed success/failure', async () => {
      const posts = [
        {
          id: 1,
          content: 'Test post 1',
          platform: Platform.LINKEDIN,
          organizationId: 1,
          createdBy: mockUser.id,
          status: PostStatus.SCHEDULED,
        },
        {
          id: 2,
          content: 'Test post 2',
          platform: Platform.TWITTER,
          organizationId: 1,
          createdBy: mockUser.id,
          status: PostStatus.SCHEDULED,
        },
        {
          id: 3,
          content: 'Test post 3',
          platform: Platform.INSTAGRAM,
          organizationId: 1,
          createdBy: mockUser.id,
          status: PostStatus.SCHEDULED,
        },
      ];

      mockPostRepo.find.mockResolvedValue(posts);

      // Mock mixed results
      let callCount = 0;
      mockPostRepo.update.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ affected: 1 }); // Success
        } else if (callCount === 2) {
          return Promise.reject(new Error('429 Too Many Requests')); // Rate limit
        } else {
          return Promise.reject(new Error('500 Internal Server Error')); // Server error
        }
      });

      const result = await service.testConnectorFailures('mixed-failures', posts, mockUser);

      expect(result.totalPosts).toBe(3);
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(2);
      expect(result.rateLimitErrors).toBe(1);
      expect(result.serverErrors).toBe(1);
      expect(result.partialSuccess).toBe(true);
      expect(result.healthCheckTriggered).toBe(true);
    });
  });

  describe('testTokenExpiry', () => {
    it('should test token expiry detection and refresh', async () => {
      const connectors = [
        {
          id: 1,
          platform: Platform.LINKEDIN,
          organizationId: 1,
          accessToken: 'expired-token',
          refreshToken: 'valid-refresh-token',
          expiresAt: new Date(Date.now() - 3600000), // Expired 1 hour ago
          isActive: true,
        },
        {
          id: 2,
          platform: Platform.TWITTER,
          organizationId: 1,
          accessToken: 'expired-token-2',
          refreshToken: 'valid-refresh-token-2',
          expiresAt: new Date(Date.now() - 7200000), // Expired 2 hours ago
          isActive: true,
        },
      ];

      mockConnectorRepo.find.mockResolvedValue(connectors);

      // Mock token refresh
      mockConnectorRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.testTokenExpiry(1, mockUser);

      expect(result.totalConnectors).toBe(2);
      expect(result.expiredTokens).toBe(2);
      expect(result.refreshAttempts).toBe(2);
      expect(result.refreshSuccessCount).toBe(2);
      expect(result.refreshFailureCount).toBe(0);
      expect(result.newTokensGenerated).toBe(2);
      expect(result.alertTriggered).toBe(false);
    });

    it('should test token refresh failures', async () => {
      const connectors = [
        {
          id: 1,
          platform: Platform.LINKEDIN,
          organizationId: 1,
          accessToken: 'expired-token',
          refreshToken: 'invalid-refresh-token',
          expiresAt: new Date(Date.now() - 3600000),
          isActive: true,
        },
      ];

      mockConnectorRepo.find.mockResolvedValue(connectors);

      // Mock refresh failure
      mockConnectorRepo.update.mockRejectedValue(new Error('Invalid refresh token'));

      const result = await service.testTokenExpiry(1, mockUser);

      expect(result.totalConnectors).toBe(1);
      expect(result.expiredTokens).toBe(1);
      expect(result.refreshAttempts).toBe(1);
      expect(result.refreshSuccessCount).toBe(0);
      expect(result.refreshFailureCount).toBe(1);
      expect(result.alertTriggered).toBe(true);
      expect(result.manualInterventionRequired).toBe(true);
      expect(result.fallbackStrategy).toBe('disable-connector');
    });

    it('should test token expiry with different platforms', async () => {
      const connectors = [
        {
          id: 1,
          platform: Platform.LINKEDIN,
          organizationId: 1,
          accessToken: 'expired-token',
          refreshToken: 'valid-refresh-token',
          expiresAt: new Date(Date.now() - 3600000),
          isActive: true,
        },
        {
          id: 2,
          platform: Platform.TWITTER,
          organizationId: 1,
          accessToken: 'valid-token',
          refreshToken: 'valid-refresh-token',
          expiresAt: new Date(Date.now() + 3600000), // Valid for 1 hour
          isActive: true,
        },
        {
          id: 3,
          platform: Platform.INSTAGRAM,
          organizationId: 1,
          accessToken: 'expired-token',
          refreshToken: 'invalid-refresh-token',
          expiresAt: new Date(Date.now() - 7200000),
          isActive: true,
        },
      ];

      mockConnectorRepo.find.mockResolvedValue(connectors);

      // Mock mixed refresh results
      let callCount = 0;
      mockConnectorRepo.update.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ affected: 1 }); // LinkedIn success
        } else if (callCount === 2) {
          return Promise.reject(new Error('Invalid refresh token')); // Instagram failure
        }
        return Promise.resolve({ affected: 1 });
      });

      const result = await service.testTokenExpiry(1, mockUser);

      expect(result.totalConnectors).toBe(3);
      expect(result.expiredTokens).toBe(2);
      expect(result.validTokens).toBe(1);
      expect(result.refreshAttempts).toBe(2);
      expect(result.refreshSuccessCount).toBe(1);
      expect(result.refreshFailureCount).toBe(1);
      expect(result.platformBreakdown).toBeDefined();
      expect(result.platformBreakdown[Platform.LINKEDIN]).toBe('refreshed');
      expect(result.platformBreakdown[Platform.TWITTER]).toBe('valid');
      expect(result.platformBreakdown[Platform.INSTAGRAM]).toBe('failed');
    });

    it('should test token expiry with automatic retry logic', async () => {
      const connectors = [
        {
          id: 1,
          platform: Platform.LINKEDIN,
          organizationId: 1,
          accessToken: 'expired-token',
          refreshToken: 'valid-refresh-token',
          expiresAt: new Date(Date.now() - 3600000),
          isActive: true,
        },
      ];

      mockConnectorRepo.find.mockResolvedValue(connectors);

      // Mock retry logic with eventual success
      let attemptCount = 0;
      mockConnectorRepo.update.mockImplementation(() => {
        attemptCount++;
        if (attemptCount <= 2) {
          return Promise.reject(new Error('Temporary refresh failure'));
        }
        return Promise.resolve({ affected: 1 });
      });

      const result = await service.testTokenExpiry(1, mockUser, { maxRetries: 3 });

      expect(result.totalConnectors).toBe(1);
      expect(result.expiredTokens).toBe(1);
      expect(result.refreshAttempts).toBe(1);
      expect(result.retryAttempts).toBe(2);
      expect(result.refreshSuccessCount).toBe(1);
      expect(result.refreshFailureCount).toBe(0);
      expect(result.retryLogicApplied).toBe(true);
      expect(result.backoffStrategy).toBe('exponential');
    });
  });

  describe('testGracefulDegradation', () => {
    it('should test graceful degradation with fallback strategies', async () => {
      const failureScenario = {
        type: 'connector-failure',
        platforms: [Platform.LINKEDIN, Platform.TWITTER],
        failureRate: 0.8,
        duration: 300, // 5 minutes
      };

      const result = await service.testGracefulDegradation(failureScenario, mockUser);

      expect(result.scenario).toBe(failureScenario.type);
      expect(result.duration).toBe(failureScenario.duration);
      expect(result.fallbackStrategies).toBeDefined();
      expect(result.fallbackStrategies.queueForRetry).toBeDefined();
      expect(result.fallbackStrategies.dlqEnabled).toBe(true);
      expect(result.fallbackStrategies.manualOverride).toBeDefined();
      expect(result.serviceAvailability).toBeGreaterThan(0.9);
      expect(result.userExperienceImpact).toBe('minimal');
      expect(result.alertingTriggered).toBe(true);
    });

    it('should test graceful degradation with multiple failure types', async () => {
      const failureScenarios = [
        {
          type: 'rate-limit',
          platforms: [Platform.LINKEDIN],
          failureRate: 0.5,
          duration: 120,
        },
        {
          type: 'token-expiry',
          platforms: [Platform.TWITTER],
          failureRate: 0.3,
          duration: 180,
        },
        {
          type: 'network-timeout',
          platforms: [Platform.INSTAGRAM],
          failureRate: 0.7,
          duration: 240,
        },
      ];

      const result = await service.testGracefulDegradation(failureScenarios, mockUser);

      expect(result.scenarios).toHaveLength(failureScenarios.length);
      expect(result.overallServiceAvailability).toBeGreaterThan(0.8);
      expect(result.criticalPathMaintained).toBe(true);
      expect(result.fallbackChain).toBeDefined();
      expect(result.recoveryTime).toBeDefined();
      expect(result.impactAssessment).toBeDefined();
    });

    it('should test graceful degradation with resource constraints', async () => {
      const failureScenario = {
        type: 'resource-exhaustion',
        platforms: [Platform.LINKEDIN, Platform.TWITTER, Platform.INSTAGRAM],
        failureRate: 0.9,
        duration: 600,
        constraints: {
          maxMemory: 512, // MB
          maxCPU: 80, // percentage
          maxConnections: 100,
        },
      };

      const result = await service.testGracefulDegradation(failureScenario, mockUser);

      expect(result.scenario).toBe(failureScenario.type);
      expect(result.resourceConstraints).toBeDefined();
      expect(result.resourceConstraints.memoryLimit).toBe(512);
      expect(result.resourceConstraints.cpuLimit).toBe(80);
      expect(result.resourceConstraints.connectionLimit).toBe(100);
      expect(result.throttlingApplied).toBe(true);
      expect(result.priorityQueueEnabled).toBe(true);
      expect(result.criticalOperationsMaintained).toBe(true);
      expect(result.nonCriticalOperationsDeferred).toBe(true);
    });
  });

  describe('testRecoveryMechanisms', () => {
    it('should test automatic recovery from failures', async () => {
      const recoveryScenario = {
        type: 'connector-recovery',
        platforms: [Platform.LINKEDIN],
        failureDuration: 300, // 5 minutes
        recoveryTriggers: ['health-check', 'manual-intervention'],
      };

      const result = await service.testRecoveryMechanisms(recoveryScenario, mockUser);

      expect(result.scenario).toBe(recoveryScenario.type);
      expect(result.failureDuration).toBe(recoveryScenario.failureDuration);
      expect(result.recoveryTriggers).toHaveLength(2);
      expect(result.recoveryTime).toBeDefined();
      expect(result.recoverySuccess).toBe(true);
      expect(result.healthCheckInterval).toBeDefined();
      expect(result.manualInterventionRequired).toBe(false);
      expect(result.serviceRestored).toBe(true);
    });

    it('should test recovery with different failure types', async () => {
      const recoveryScenarios = [
        {
          type: 'rate-limit-recovery',
          platforms: [Platform.TWITTER],
          failureDuration: 120,
          recoveryMethod: 'automatic',
        },
        {
          type: 'token-refresh-recovery',
          platforms: [Platform.INSTAGRAM],
          failureDuration: 180,
          recoveryMethod: 'manual',
        },
        {
          type: 'network-recovery',
          platforms: [Platform.FACEBOOK],
          failureDuration: 240,
          recoveryMethod: 'automatic',
        },
      ];

      const result = await service.testRecoveryMechanisms(recoveryScenarios, mockUser);

      expect(result.scenarios).toHaveLength(recoveryScenarios.length);
      expect(result.overallRecoveryTime).toBeDefined();
      expect(result.automaticRecoveries).toBe(2);
      expect(result.manualRecoveries).toBe(1);
      expect(result.recoverySuccessRate).toBeGreaterThan(0.8);
      expect(result.meanTimeToRecovery).toBeDefined();
      expect(result.recoveryProcedures).toBeDefined();
    });
  });

  describe('runFullChaosTestSuite', () => {
    it('should run complete chaos test suite', async () => {
      const testConfig = {
        connectorFailures: {
          scenarios: ['rate-limit', 'server-error', 'timeout'],
          duration: 600, // 10 minutes
        },
        tokenExpiry: {
          platforms: [Platform.LINKEDIN, Platform.TWITTER],
          refreshAttempts: 3,
        },
        gracefulDegradation: {
          failureTypes: ['connector-failure', 'resource-exhaustion'],
          duration: 300,
        },
        recoveryMechanisms: {
          scenarios: ['connector-recovery', 'token-refresh-recovery'],
          maxRecoveryTime: 300,
        },
      };

      const result = await service.runFullChaosTestSuite(testConfig, mockUser);

      expect(result.connectorFailures).toBeDefined();
      expect(result.tokenExpiry).toBeDefined();
      expect(result.gracefulDegradation).toBeDefined();
      expect(result.recoveryMechanisms).toBeDefined();
      expect(result.overallResilience).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.report).toBeDefined();
    });

    it('should generate chaos test report', async () => {
      const testConfig = {
        connectorFailures: {
          scenarios: ['rate-limit'],
          duration: 120,
        },
        tokenExpiry: {
          platforms: [Platform.LINKEDIN],
          refreshAttempts: 2,
        },
        gracefulDegradation: {
          failureTypes: ['connector-failure'],
          duration: 60,
        },
        recoveryMechanisms: {
          scenarios: ['connector-recovery'],
          maxRecoveryTime: 120,
        },
      };

      const result = await service.runFullChaosTestSuite(testConfig, mockUser);

      expect(result.report).toBeDefined();
      expect(result.report.summary).toBeDefined();
      expect(result.report.scenarios).toBeDefined();
      expect(result.report.metrics).toBeDefined();
      expect(result.report.thresholds).toBeDefined();
      expect(result.report.recommendations).toBeDefined();
      expect(result.report.timestamp).toBeDefined();
      expect(result.report.version).toBeDefined();
    });
  });
});
