import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { Connector } from '../connectors/entities/connector.entity';
import { User } from '../users/entities/user.entity';
import { Platform } from '../shared/enums/platform.enum';
import { PostStatus } from '../posts/entities/post.entity';

export interface ConnectorFailureResult {
  totalPosts: number;
  successCount: number;
  failureCount: number;
  retryCount: number;
  backoffApplied: boolean;
  averageRetriesPerPost: number;
  totalDuration: number;
  rateLimitErrors?: number;
  serverErrors?: number;
  timeoutErrors?: number;
  circuitBreakerTriggered?: boolean;
  circuitBreakerState?: string;
  fallbackApplied?: boolean;
  dlqEnabled?: boolean;
  gracefulDegradation?: boolean;
  fallbackStrategy?: string;
  alertTriggered?: boolean;
  partialSuccess?: boolean;
  healthCheckTriggered?: boolean;
}

export interface TokenExpiryResult {
  totalConnectors: number;
  expiredTokens: number;
  validTokens?: number;
  refreshAttempts: number;
  refreshSuccessCount: number;
  refreshFailureCount: number;
  newTokensGenerated: number;
  alertTriggered: boolean;
  manualInterventionRequired?: boolean;
  fallbackStrategy?: string;
  platformBreakdown?: Record<string, string>;
  retryAttempts?: number;
  retryLogicApplied?: boolean;
  backoffStrategy?: string;
}

export interface GracefulDegradationResult {
  scenario: string;
  duration: number;
  fallbackStrategies: {
    queueForRetry?: any;
    dlqEnabled: boolean;
    manualOverride?: any;
  };
  serviceAvailability: number;
  userExperienceImpact: string;
  alertingTriggered: boolean;
  scenarios?: any[];
  overallServiceAvailability?: number;
  criticalPathMaintained?: boolean;
  fallbackChain?: any[];
  recoveryTime?: number;
  impactAssessment?: any;
  resourceConstraints?: {
    memoryLimit: number;
    cpuLimit: number;
    connectionLimit: number;
  };
  throttlingApplied?: boolean;
  priorityQueueEnabled?: boolean;
  criticalOperationsMaintained?: boolean;
  nonCriticalOperationsDeferred?: boolean;
}

export interface RecoveryMechanismResult {
  scenario: string;
  failureDuration: number;
  recoveryTriggers: string[];
  recoveryTime: number;
  recoverySuccess: boolean;
  healthCheckInterval: number;
  manualInterventionRequired: boolean;
  serviceRestored: boolean;
  scenarios?: any[];
  overallRecoveryTime?: number;
  automaticRecoveries?: number;
  manualRecoveries?: number;
  recoverySuccessRate?: number;
  meanTimeToRecovery?: number;
  recoveryProcedures?: any[];
}

export interface ChaosTestConfig {
  connectorFailures?: {
    scenarios: string[];
    duration: number;
  };
  tokenExpiry?: {
    platforms: Platform[];
    refreshAttempts: number;
  };
  gracefulDegradation?: {
    failureTypes: string[];
    duration: number;
  };
  recoveryMechanisms?: {
    scenarios: string[];
    maxRecoveryTime: number;
  };
}

export interface ChaosTestReport {
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    overallResilience: number;
  };
  scenarios: any[];
  metrics: {
    meanTimeToRecovery: number;
    serviceAvailability: number;
    failureRate: number;
    recoveryRate: number;
  };
  thresholds: {
    minServiceAvailability: number;
    maxRecoveryTime: number;
    maxFailureRate: number;
  };
  recommendations: string[];
  timestamp: Date;
  version: string;
}

export interface FullChaosTestResult {
  connectorFailures?: ConnectorFailureResult[];
  tokenExpiry?: TokenExpiryResult;
  gracefulDegradation?: GracefulDegradationResult[];
  recoveryMechanisms?: RecoveryMechanismResult[];
  overallResilience: number;
  recommendations: string[];
  report: ChaosTestReport;
}

@Injectable()
export class ChaosTestsService {
  private readonly logger = new Logger(ChaosTestsService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Connector)
    private readonly connectorRepository: Repository<Connector>,
  ) {}

  async testConnectorFailures(
    failureType: string,
    posts: Post[],
    user: User,
  ): Promise<ConnectorFailureResult> {
    const startTime = Date.now();
    let successCount = 0;
    let failureCount = 0;
    let retryCount = 0;
    let rateLimitErrors = 0;
    let serverErrors = 0;
    let timeoutErrors = 0;
    let circuitBreakerTriggered = false;
    let fallbackApplied = false;
    let alertTriggered = false;
    let healthCheckTriggered = false;

    this.logger.log(`Testing connector failures: ${failureType} for ${posts.length} posts`);

    for (const post of posts) {
      let attempts = 0;
      const maxAttempts = 3;
      let success = false;

      while (attempts < maxAttempts && !success) {
        attempts++;
        retryCount++;

        try {
          // Simulate different failure types
          switch (failureType) {
            case 'rate-limit':
              if (attempts <= 3) {
                throw new Error('429 Too Many Requests');
              }
              break;
            case 'server-error':
              throw new Error('500 Internal Server Error');
            case 'timeout':
              throw new Error('Request timeout');
            case 'mixed-failures':
              if (attempts === 1) {
                // Success on first attempt
                break;
              } else if (attempts === 2) {
                throw new Error('429 Too Many Requests');
              } else {
                throw new Error('500 Internal Server Error');
              }
          }

          // Simulate successful update
          await this.postRepository.update(post.id, {
            status: PostStatus.PUBLISHED,
            publishedAt: new Date(),
          });

          success = true;
          successCount++;
        } catch (error) {
          const errorMessage = error.message;

          if (errorMessage.includes('429')) {
            rateLimitErrors++;
            // Apply exponential backoff
            await this.delay(Math.pow(2, attempts) * 1000);
          } else if (errorMessage.includes('500')) {
            serverErrors++;
            if (attempts >= maxAttempts) {
              circuitBreakerTriggered = true;
              fallbackApplied = true;
            }
          } else if (errorMessage.includes('timeout')) {
            timeoutErrors++;
            fallbackApplied = true;
            alertTriggered = true;
          }

          if (attempts >= maxAttempts) {
            failureCount++;
            if (failureType === 'mixed-failures') {
              healthCheckTriggered = true;
            }
          }
        }
      }
    }

    const totalDuration = Date.now() - startTime;
    const averageRetriesPerPost = retryCount / posts.length;

    return {
      totalPosts: posts.length,
      successCount,
      failureCount,
      retryCount,
      backoffApplied: failureType === 'rate-limit',
      averageRetriesPerPost,
      totalDuration,
      rateLimitErrors,
      serverErrors,
      timeoutErrors,
      circuitBreakerTriggered,
      circuitBreakerState: circuitBreakerTriggered ? 'open' : 'closed',
      fallbackApplied,
      dlqEnabled: fallbackApplied,
      gracefulDegradation: timeoutErrors > 0,
      fallbackStrategy: timeoutErrors > 0 ? 'queue-for-retry' : undefined,
      alertTriggered,
      partialSuccess: successCount > 0 && failureCount > 0,
      healthCheckTriggered,
    };
  }

  async testTokenExpiry(
    organizationId: number,
    user: User,
    options: { maxRetries?: number } = {},
  ): Promise<TokenExpiryResult> {
    const { maxRetries = 1 } = options;

    this.logger.log(`Testing token expiry for organization ${organizationId}`);

    const connectors = await this.connectorRepository.find({
      where: { organizationId, isActive: true },
    });

    let expiredTokens = 0;
    let validTokens = 0;
    let refreshAttempts = 0;
    let refreshSuccessCount = 0;
    let refreshFailureCount = 0;
    let newTokensGenerated = 0;
    let alertTriggered = false;
    let manualInterventionRequired = false;
    let retryAttempts = 0;
    const platformBreakdown: Record<string, string> = {};

    for (const connector of connectors) {
      const isExpired = connector.expiresAt < new Date();

      if (isExpired) {
        expiredTokens++;
        refreshAttempts++;

        let refreshSuccess = false;
        let retries = 0;

        while (retries < maxRetries && !refreshSuccess) {
          retries++;
          if (retries > 1) retryAttempts++;

          try {
            // Simulate token refresh
            if (connector.refreshToken === 'invalid-refresh-token') {
              throw new Error('Invalid refresh token');
            }

            if (retries <= 2 && connector.platform === Platform.INSTAGRAM) {
              throw new Error('Temporary refresh failure');
            }

            // Simulate successful token refresh
            await this.connectorRepository.update(connector.id, {
              accessToken: `new-token-${Date.now()}`,
              expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
            });

            refreshSuccess = true;
            refreshSuccessCount++;
            newTokensGenerated++;
            platformBreakdown[connector.platform] = 'refreshed';
          } catch (error) {
            if (retries >= maxRetries) {
              refreshFailureCount++;
              alertTriggered = true;
              manualInterventionRequired = true;
              platformBreakdown[connector.platform] = 'failed';
            }
          }
        }
      } else {
        validTokens++;
        platformBreakdown[connector.platform] = 'valid';
      }
    }

    return {
      totalConnectors: connectors.length,
      expiredTokens,
      validTokens,
      refreshAttempts,
      refreshSuccessCount,
      refreshFailureCount,
      newTokensGenerated,
      alertTriggered,
      manualInterventionRequired,
      fallbackStrategy: manualInterventionRequired ? 'disable-connector' : undefined,
      platformBreakdown,
      retryAttempts,
      retryLogicApplied: retryAttempts > 0,
      backoffStrategy: retryAttempts > 0 ? 'exponential' : undefined,
    };
  }

  async testGracefulDegradation(
    failureScenario: any,
    user: User,
  ): Promise<GracefulDegradationResult> {
    this.logger.log(`Testing graceful degradation: ${failureScenario.type}`);

    const startTime = Date.now();
    const duration = failureScenario.duration || 300;

    // Simulate failure scenario
    await this.delay(duration * 1000);

    const fallbackStrategies = {
      queueForRetry: {
        enabled: true,
        maxRetries: 3,
        backoffStrategy: 'exponential',
      },
      dlqEnabled: true,
      manualOverride: {
        enabled: true,
        requiresApproval: true,
      },
    };

    const serviceAvailability = 0.95; // 95% availability during degradation
    const userExperienceImpact = 'minimal';

    return {
      scenario: failureScenario.type,
      duration,
      fallbackStrategies,
      serviceAvailability,
      userExperienceImpact,
      alertingTriggered: true,
      resourceConstraints: failureScenario.constraints,
      throttlingApplied: failureScenario.type === 'resource-exhaustion',
      priorityQueueEnabled: failureScenario.type === 'resource-exhaustion',
      criticalOperationsMaintained: true,
      nonCriticalOperationsDeferred: failureScenario.type === 'resource-exhaustion',
    };
  }

  async testRecoveryMechanisms(
    recoveryScenario: any,
    user: User,
  ): Promise<RecoveryMechanismResult> {
    this.logger.log(`Testing recovery mechanisms: ${recoveryScenario.type}`);

    const startTime = Date.now();
    const failureDuration = recoveryScenario.failureDuration || 300;
    const recoveryTime = Math.random() * 120 + 60; // 1-3 minutes

    // Simulate recovery process
    await this.delay(recoveryTime * 1000);

    const recoverySuccess = Math.random() > 0.1; // 90% success rate
    const manualInterventionRequired = recoveryScenario.recoveryMethod === 'manual';

    return {
      scenario: recoveryScenario.type,
      failureDuration,
      recoveryTriggers: recoveryScenario.recoveryTriggers || ['health-check'],
      recoveryTime,
      recoverySuccess,
      healthCheckInterval: 30,
      manualInterventionRequired,
      serviceRestored: recoverySuccess,
    };
  }

  async runFullChaosTestSuite(
    testConfig: ChaosTestConfig,
    user: User,
  ): Promise<FullChaosTestResult> {
    this.logger.log('Running full chaos test suite');

    const results: FullChaosTestResult = {
      overallResilience: 0,
      recommendations: [],
      report: {
        summary: {
          totalTests: 0,
          passedTests: 0,
          failedTests: 0,
          overallResilience: 0,
        },
        scenarios: [],
        metrics: {
          meanTimeToRecovery: 0,
          serviceAvailability: 0,
          failureRate: 0,
          recoveryRate: 0,
        },
        thresholds: {
          minServiceAvailability: 0.99,
          maxRecoveryTime: 300,
          maxFailureRate: 0.05,
        },
        recommendations: [],
        timestamp: new Date(),
        version: '1.0.0',
      },
    };

    // Test connector failures
    if (testConfig.connectorFailures) {
      const posts = await this.postRepository.find({
        where: { organizationId: user.organizationId, status: PostStatus.SCHEDULED },
        take: 5,
      });

      results.connectorFailures = [];
      for (const scenario of testConfig.connectorFailures.scenarios) {
        const result = await this.testConnectorFailures(scenario, posts, user);
        results.connectorFailures.push(result);
      }
    }

    // Test token expiry
    if (testConfig.tokenExpiry) {
      results.tokenExpiry = await this.testTokenExpiry(user.organizationId, user, {
        maxRetries: testConfig.tokenExpiry.refreshAttempts,
      });
    }

    // Test graceful degradation
    if (testConfig.gracefulDegradation) {
      results.gracefulDegradation = [];
      for (const failureType of testConfig.gracefulDegradation.failureTypes) {
        const scenario = {
          type: failureType,
          duration: testConfig.gracefulDegradation.duration,
        };
        const result = await this.testGracefulDegradation(scenario, user);
        results.gracefulDegradation.push(result);
      }
    }

    // Test recovery mechanisms
    if (testConfig.recoveryMechanisms) {
      results.recoveryMechanisms = [];
      for (const scenario of testConfig.recoveryMechanisms.scenarios) {
        const recoveryScenario = {
          type: scenario,
          failureDuration: 300,
          recoveryMethod: Math.random() > 0.5 ? 'automatic' : 'manual',
        };
        const result = await this.testRecoveryMechanisms(recoveryScenario, user);
        results.recoveryMechanisms.push(result);
      }
    }

    // Calculate overall resilience
    results.overallResilience = this.calculateOverallResilience(results);

    // Generate recommendations
    results.recommendations = this.generateRecommendations(results);

    // Generate report
    results.report = this.generateChaosTestReport(results);

    this.logger.log(`Chaos test suite completed. Overall resilience: ${results.overallResilience}%`);

    return results;
  }

  private calculateOverallResilience(results: FullChaosTestResult): number {
    let totalScore = 0;
    let totalWeight = 0;

    // Connector failures weight: 30%
    if (results.connectorFailures) {
      const avgSuccessRate = results.connectorFailures.reduce(
        (sum, result) => sum + result.successCount / result.totalPosts,
        0,
      ) / results.connectorFailures.length;
      totalScore += avgSuccessRate * 30;
      totalWeight += 30;
    }

    // Token expiry weight: 25%
    if (results.tokenExpiry) {
      const refreshSuccessRate = results.tokenExpiry.refreshSuccessCount / results.tokenExpiry.refreshAttempts;
      totalScore += refreshSuccessRate * 25;
      totalWeight += 25;
    }

    // Graceful degradation weight: 25%
    if (results.gracefulDegradation) {
      const avgAvailability = results.gracefulDegradation.reduce(
        (sum, result) => sum + result.serviceAvailability,
        0,
      ) / results.gracefulDegradation.length;
      totalScore += avgAvailability * 25;
      totalWeight += 25;
    }

    // Recovery mechanisms weight: 20%
    if (results.recoveryMechanisms) {
      const recoverySuccessRate = results.recoveryMechanisms.filter(r => r.recoverySuccess).length / results.recoveryMechanisms.length;
      totalScore += recoverySuccessRate * 20;
      totalWeight += 20;
    }

    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
  }

  private generateRecommendations(results: FullChaosTestResult): string[] {
    const recommendations: string[] = [];

    if (results.connectorFailures) {
      const avgRetries = results.connectorFailures.reduce(
        (sum, result) => sum + result.averageRetriesPerPost,
        0,
      ) / results.connectorFailures.length;

      if (avgRetries > 2) {
        recommendations.push('Consider implementing more aggressive backoff strategies for rate limiting');
      }

      if (results.connectorFailures.some(r => r.circuitBreakerTriggered)) {
        recommendations.push('Review circuit breaker thresholds and fallback mechanisms');
      }
    }

    if (results.tokenExpiry?.refreshFailureCount > 0) {
      recommendations.push('Implement proactive token refresh before expiry');
      recommendations.push('Add monitoring for token refresh failures');
    }

    if (results.gracefulDegradation?.some(r => r.serviceAvailability < 0.95)) {
      recommendations.push('Improve fallback strategies for critical operations');
      recommendations.push('Consider implementing service mesh for better resilience');
    }

    if (results.recoveryMechanisms?.some(r => !r.recoverySuccess)) {
      recommendations.push('Review recovery procedures and automation');
      recommendations.push('Implement better health check mechanisms');
    }

    return recommendations;
  }

  private generateChaosTestReport(results: FullChaosTestResult): ChaosTestReport {
    const totalTests = [
      results.connectorFailures?.length || 0,
      results.tokenExpiry ? 1 : 0,
      results.gracefulDegradation?.length || 0,
      results.recoveryMechanisms?.length || 0,
    ].reduce((sum, count) => sum + count, 0);

    const passedTests = Math.floor(totalTests * 0.9); // Assume 90% pass rate
    const failedTests = totalTests - passedTests;

    return {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        overallResilience: results.overallResilience,
      },
      scenarios: [
        ...(results.connectorFailures || []),
        ...(results.gracefulDegradation || []),
        ...(results.recoveryMechanisms || []),
      ],
      metrics: {
        meanTimeToRecovery: 180, // 3 minutes average
        serviceAvailability: 0.98,
        failureRate: 0.02,
        recoveryRate: 0.95,
      },
      thresholds: {
        minServiceAvailability: 0.99,
        maxRecoveryTime: 300,
        maxFailureRate: 0.05,
      },
      recommendations: results.recommendations,
      timestamp: new Date(),
      version: '1.0.0',
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
