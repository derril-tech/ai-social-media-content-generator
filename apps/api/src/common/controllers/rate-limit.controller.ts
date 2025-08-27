import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RateLimitService } from '../services/rate-limit.service';
import { RateLimitMiddleware, RateLimitConfig } from '../middleware/rate-limit.middleware';
import { RbacGuard, RequireAdmin } from '../../auth/guards/rbac.guard';

export interface RateLimitStatusResponse {
  organizationId: string;
  path: string;
  method: string;
  current: number;
  limit: number;
  remaining: number;
  reset: number;
  burst?: {
    current: number;
    limit: number;
    remaining: number;
  };
}

export interface RateLimitStatsResponse {
  organizationId: string;
  totalKeys: number;
  activeLimits: Array<{
    key: string;
    current: number;
    limit: number;
    remaining: number;
    reset: number;
  }>;
}

export interface BurstControlStatusResponse {
  operationType: string;
  organizationId: string;
  channelId?: string;
  config: {
    maxBurst: number;
    burstWindowMs: number;
    recoveryRate: number;
    bucketSize: number;
  };
  currentTokens: number;
  lastRefill: number;
  timeToNextToken: number;
}

export interface SimulateRateLimitRequest {
  key: string;
  config: RateLimitConfig;
  requests: number;
}

export interface SimulateRateLimitResponse {
  successful: number;
  blocked: number;
  results: Array<{
    allowed: boolean;
    current: number;
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
  }>;
}

@ApiTags('Rate Limits')
@Controller('rate-limits')
@UseGuards(RbacGuard)
@ApiBearerAuth()
export class RateLimitController {
  constructor(
    private readonly rateLimitService: RateLimitService,
  ) {}

  @Get('status/:organizationId')
  @RequireAdmin()
  @ApiOperation({ summary: 'Get rate limit status for an organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiQuery({ name: 'path', required: false, description: 'Specific path to check' })
  @ApiQuery({ name: 'method', required: false, description: 'HTTP method to check' })
  @ApiResponse({ status: 200, description: 'Rate limit status retrieved successfully', type: RateLimitStatusResponse })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getRateLimitStatus(
    @Param('organizationId') organizationId: string,
    @Query('path') path?: string,
    @Query('method') method: string = 'POST',
  ): Promise<RateLimitStatusResponse> {
    try {
      if (!path) {
        throw new HttpException('Path parameter is required', HttpStatus.BAD_REQUEST);
      }

      // Create a mock config for the requested path
      const config: RateLimitConfig = this.getConfigForPath(path);
      
      const key = `rate_limit:organization:${path}:org:${organizationId}`;
      const status = await this.rateLimitService.getRateLimitStatus(key, config);
      
      return {
        organizationId,
        path,
        method,
        ...status,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get rate limit status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats/:organizationId')
  @RequireAdmin()
  @ApiOperation({ summary: 'Get comprehensive rate limit statistics for an organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Rate limit stats retrieved successfully', type: RateLimitStatsResponse })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getRateLimitStats(
    @Param('organizationId') organizationId: string,
  ): Promise<RateLimitStatsResponse> {
    try {
      const stats = await this.rateLimitService.getRateLimitStats(organizationId);
      return {
        organizationId,
        ...stats,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get rate limit stats',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('burst/:organizationId/:operationType')
  @RequireAdmin()
  @ApiOperation({ summary: 'Get burst control status for an operation type' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiParam({ name: 'operationType', description: 'Operation type (publish, generate, etc.)' })
  @ApiQuery({ name: 'channelId', required: false, description: 'Channel ID for channel-specific burst control' })
  @ApiResponse({ status: 200, description: 'Burst control status retrieved successfully', type: BurstControlStatusResponse })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getBurstControlStatus(
    @Param('organizationId') organizationId: string,
    @Param('operationType') operationType: string,
    @Query('channelId') channelId?: string,
  ): Promise<BurstControlStatusResponse> {
    try {
      const status = await this.rateLimitService.getBurstControlStatus(
        operationType,
        organizationId,
        channelId,
      );
      return status;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get burst control status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('reset/:organizationId')
  @RequireAdmin()
  @ApiOperation({ summary: 'Reset all rate limits for an organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiQuery({ name: 'path', required: false, description: 'Specific path to reset (optional)' })
  @ApiResponse({ status: 200, description: 'Rate limits reset successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async resetRateLimits(
    @Param('organizationId') organizationId: string,
    @Query('path') path?: string,
  ): Promise<{ message: string; resetKeys: number }> {
    try {
      const keys = await this.rateLimitService.getRateLimitKeys(organizationId);
      let keysToReset = keys;
      
      if (path) {
        keysToReset = keys.filter(key => key.includes(path));
      }
      
      // Reset each key
      await Promise.all(
        keysToReset.map(key => this.rateLimitService.resetRateLimit(key))
      );
      
      return {
        message: 'Rate limits reset successfully',
        resetKeys: keysToReset.length,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to reset rate limits',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('simulate')
  @RequireAdmin()
  @ApiOperation({ summary: 'Simulate rate limiting with given parameters' })
  @ApiResponse({ status: 200, description: 'Simulation completed successfully', type: SimulateRateLimitResponse })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async simulateRateLimit(
    @Body() request: SimulateRateLimitRequest,
  ): Promise<SimulateRateLimitResponse> {
    try {
      const { key, config, requests } = request;
      
      if (requests > 1000) {
        throw new HttpException('Maximum 1000 requests allowed for simulation', HttpStatus.BAD_REQUEST);
      }
      
      const result = await this.rateLimitService.simulateRateLimit(key, config, requests);
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to simulate rate limit',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health/:organizationId')
  @RequireAdmin()
  @ApiOperation({ summary: 'Get rate limit health check for an organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Health check completed successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getRateLimitHealth(
    @Param('organizationId') organizationId: string,
  ): Promise<{
    organizationId: string;
    status: 'healthy' | 'warning' | 'critical';
    activeLimits: number;
    nearLimit: number;
    atLimit: number;
    recommendations: string[];
  }> {
    try {
      const stats = await this.rateLimitService.getRateLimitStats(organizationId);
      
      let nearLimit = 0;
      let atLimit = 0;
      const recommendations: string[] = [];
      
      for (const limit of stats.activeLimits) {
        const usagePercentage = (limit.current / limit.limit) * 100;
        
        if (usagePercentage >= 100) {
          atLimit++;
          recommendations.push(`Rate limit exceeded for ${limit.key}`);
        } else if (usagePercentage >= 80) {
          nearLimit++;
          recommendations.push(`Rate limit approaching limit for ${limit.key} (${usagePercentage.toFixed(1)}%)`);
        }
      }
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (atLimit > 0) {
        status = 'critical';
      } else if (nearLimit > 0) {
        status = 'warning';
      }
      
      if (stats.activeLimits.length === 0) {
        recommendations.push('No active rate limits found');
      }
      
      return {
        organizationId,
        status,
        activeLimits: stats.activeLimits.length,
        nearLimit,
        atLimit,
        recommendations,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get rate limit health',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('config')
  @RequireAdmin()
  @ApiOperation({ summary: 'Get current rate limit configuration' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getRateLimitConfig(): Promise<{
    rules: Array<{
      path: string;
      method?: string;
      scope: string;
      config: RateLimitConfig;
    }>;
    burstConfigs: Array<{
      operationType: string;
      config: {
        maxBurst: number;
        burstWindowMs: number;
        recoveryRate: number;
        bucketSize: number;
      };
    }>;
  }> {
    try {
      // This would typically come from a configuration service
      // For now, we'll return a static configuration
      const rules = [
        {
          path: '/api/generate',
          scope: 'organization',
          config: {
            windowMs: 60 * 1000,
            maxRequests: 10,
            burstLimit: 20,
            burstWindowMs: 10 * 1000,
          },
        },
        {
          path: '/api/publish',
          scope: 'organization',
          config: {
            windowMs: 60 * 1000,
            maxRequests: 5,
            burstLimit: 15,
            burstWindowMs: 5 * 1000,
          },
        },
        {
          path: '/api/connectors',
          scope: 'organization',
          config: {
            windowMs: 60 * 1000,
            maxRequests: 20,
            burstLimit: 50,
            burstWindowMs: 10 * 1000,
          },
        },
      ];
      
      const burstConfigs = [
        {
          operationType: 'publish',
          config: {
            maxBurst: 50,
            burstWindowMs: 5 * 1000,
            recoveryRate: 1,
            bucketSize: 10,
          },
        },
        {
          operationType: 'generate',
          config: {
            maxBurst: 100,
            burstWindowMs: 10 * 1000,
            recoveryRate: 2,
            bucketSize: 20,
          },
        },
      ];
      
      return { rules, burstConfigs };
    } catch (error) {
      throw new HttpException(
        'Failed to get rate limit configuration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getConfigForPath(path: string): RateLimitConfig {
    // Return appropriate config based on path
    if (path.includes('generate')) {
      return {
        windowMs: 60 * 1000,
        maxRequests: 10,
        burstLimit: 20,
        burstWindowMs: 10 * 1000,
      };
    }
    
    if (path.includes('publish')) {
      return {
        windowMs: 60 * 1000,
        maxRequests: 5,
        burstLimit: 15,
        burstWindowMs: 5 * 1000,
      };
    }
    
    if (path.includes('connectors')) {
      return {
        windowMs: 60 * 1000,
        maxRequests: 20,
        burstLimit: 50,
        burstWindowMs: 10 * 1000,
      };
    }
    
    // Default config
    return {
      windowMs: 60 * 1000,
      maxRequests: 10,
      burstLimit: 20,
      burstWindowMs: 10 * 1000,
    };
  }
}
