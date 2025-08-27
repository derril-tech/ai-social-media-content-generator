import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Organization } from '../../organizations/entities/organization.entity';
import { Connector } from '../../connectors/entities/connector.entity';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  burstLimit?: number; // Burst limit (higher than maxRequests for short spikes)
  burstWindowMs?: number; // Burst window (shorter than main window)
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean; // Skip counting failed requests
  keyGenerator?: (req: Request) => string; // Custom key generator
  handler?: (req: Request, res: Response) => void; // Custom error handler
}

export interface RateLimitRule {
  path: string;
  method?: string;
  config: RateLimitConfig;
  scope: 'global' | 'organization' | 'channel' | 'user';
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly rules: RateLimitRule[] = [
    // Global rate limits
    {
      path: '/api/generate',
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10,
        burstLimit: 20,
        burstWindowMs: 10 * 1000, // 10 seconds
      },
      scope: 'organization',
    },
    {
      path: '/api/publish',
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 5,
        burstLimit: 15,
        burstWindowMs: 5 * 1000, // 5 seconds
      },
      scope: 'organization',
    },
    {
      path: '/api/connectors',
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 20,
        burstLimit: 50,
        burstWindowMs: 10 * 1000, // 10 seconds
      },
      scope: 'organization',
    },
    // Channel-specific rate limits (for publishing to specific platforms)
    {
      path: '/api/publish/twitter',
      config: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 25, // Twitter's rate limit
        burstLimit: 50,
        burstWindowMs: 60 * 1000, // 1 minute
      },
      scope: 'channel',
    },
    {
      path: '/api/publish/linkedin',
      config: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 100, // LinkedIn's rate limit
        burstLimit: 200,
        burstWindowMs: 5 * 60 * 1000, // 5 minutes
      },
      scope: 'channel',
    },
    {
      path: '/api/publish/facebook',
      config: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 200, // Facebook's rate limit
        burstLimit: 400,
        burstWindowMs: 5 * 60 * 1000, // 5 minutes
      },
      scope: 'channel',
    },
    {
      path: '/api/publish/instagram',
      config: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 100, // Instagram's rate limit
        burstLimit: 200,
        burstWindowMs: 5 * 60 * 1000, // 5 minutes
      },
      scope: 'channel',
    },
    // User-specific rate limits
    {
      path: '/api/auth',
      config: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
        burstLimit: 10,
        burstWindowMs: 60 * 1000, // 1 minute
      },
      scope: 'user',
    },
  ];

  constructor(
    @InjectRedis() private readonly redis: Redis,
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,
    @InjectRepository(Connector)
    private readonly connectorsRepository: Repository<Connector>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rule = this.findMatchingRule(req.path, req.method);
      if (!rule) {
        return next();
      }

      const key = await this.generateKey(req, rule);
      const isAllowed = await this.checkRateLimit(key, rule.config);

      if (!isAllowed) {
        const handler = rule.config.handler || this.defaultHandler;
        return handler(req, res);
      }

      // Add rate limit headers
      const currentUsage = await this.getCurrentUsage(key, rule.config);
      res.setHeader('X-RateLimit-Limit', rule.config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, rule.config.maxRequests - currentUsage));
      res.setHeader('X-RateLimit-Reset', this.getResetTime(rule.config.windowMs));

      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // Continue without rate limiting if there's an error
      next();
    }
  }

  private findMatchingRule(path: string, method: string): RateLimitRule | null {
    return this.rules.find(rule => {
      const pathMatch = path.startsWith(rule.path);
      const methodMatch = !rule.method || rule.method === method;
      return pathMatch && methodMatch;
    }) || null;
  }

  private async generateKey(req: Request, rule: RateLimitRule): Promise<string> {
    const baseKey = `rate_limit:${rule.scope}:${rule.path}`;
    
    switch (rule.scope) {
      case 'global':
        return baseKey;
      
      case 'organization':
        const orgId = this.extractOrganizationId(req);
        return `${baseKey}:org:${orgId}`;
      
      case 'channel':
        const channelId = this.extractChannelId(req);
        const orgIdForChannel = this.extractOrganizationId(req);
        return `${baseKey}:org:${orgIdForChannel}:channel:${channelId}`;
      
      case 'user':
        const userId = this.extractUserId(req);
        return `${baseKey}:user:${userId}`;
      
      default:
        return baseKey;
    }
  }

  private extractOrganizationId(req: Request): string {
    // Try to get from user context (set by auth middleware)
    if (req.user?.organizationId) {
      return req.user.organizationId;
    }
    
    // Try to get from query params
    if (req.query.organizationId) {
      return req.query.organizationId as string;
    }
    
    // Try to get from headers
    if (req.headers['x-organization-id']) {
      return req.headers['x-organization-id'] as string;
    }
    
    // Fallback to 'unknown' if we can't determine
    return 'unknown';
  }

  private extractChannelId(req: Request): string {
    // Try to get from path params
    if (req.params.channelId) {
      return req.params.channelId;
    }
    
    // Try to get from query params
    if (req.query.channelId) {
      return req.query.channelId as string;
    }
    
    // Try to get from body
    if (req.body?.channelId) {
      return req.body.channelId;
    }
    
    // Try to get from headers
    if (req.headers['x-channel-id']) {
      return req.headers['x-channel-id'] as string;
    }
    
    // Fallback to 'unknown' if we can't determine
    return 'unknown';
  }

  private extractUserId(req: Request): string {
    // Try to get from user context (set by auth middleware)
    if (req.user?.id) {
      return req.user.id;
    }
    
    // Try to get from query params
    if (req.query.userId) {
      return req.query.userId as string;
    }
    
    // Try to get from headers
    if (req.headers['x-user-id']) {
      return req.headers['x-user-id'] as string;
    }
    
    // Fallback to IP address for unauthenticated requests
    return req.ip || 'unknown';
  }

  private async checkRateLimit(key: string, config: RateLimitConfig): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Check main rate limit
    const mainKey = `${key}:main`;
    const mainCount = await this.redis.zcount(mainKey, windowStart, '+inf');
    
    if (mainCount >= config.maxRequests) {
      return false;
    }
    
    // Check burst limit if configured
    if (config.burstLimit && config.burstWindowMs) {
      const burstWindowStart = now - config.burstWindowMs;
      const burstKey = `${key}:burst`;
      const burstCount = await this.redis.zcount(burstKey, burstWindowStart, '+inf');
      
      if (burstCount >= config.burstLimit) {
        return false;
      }
    }
    
    // Add current request to counters
    await this.redis.zadd(mainKey, now, `${now}-${Math.random()}`);
    await this.redis.expire(mainKey, Math.ceil(config.windowMs / 1000));
    
    if (config.burstLimit && config.burstWindowMs) {
      const burstKey = `${key}:burst`;
      await this.redis.zadd(burstKey, now, `${now}-${Math.random()}`);
      await this.redis.expire(burstKey, Math.ceil(config.burstWindowMs / 1000));
    }
    
    return true;
  }

  private async getCurrentUsage(key: string, config: RateLimitConfig): Promise<number> {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const mainKey = `${key}:main`;
    return await this.redis.zcount(mainKey, windowStart, '+inf');
  }

  private getResetTime(windowMs: number): number {
    return Math.ceil((Date.now() + windowMs) / 1000);
  }

  private defaultHandler(req: Request, res: Response): void {
    const retryAfter = Math.ceil(60); // 1 minute default
    res.setHeader('Retry-After', retryAfter);
    res.setHeader('X-RateLimit-Reset', this.getResetTime(60 * 1000));
    
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Rate limit exceeded. Please try again later.',
        error: 'Too Many Requests',
        retryAfter,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  // Public methods for external rate limit checking
  async checkOrganizationRateLimit(organizationId: string, path: string, method: string = 'POST'): Promise<boolean> {
    const rule = this.findMatchingRule(path, method);
    if (!rule || rule.scope !== 'organization') {
      return true;
    }

    const key = `rate_limit:organization:${path}:org:${organizationId}`;
    return await this.checkRateLimit(key, rule.config);
  }

  async checkChannelRateLimit(organizationId: string, channelId: string, path: string, method: string = 'POST'): Promise<boolean> {
    const rule = this.findMatchingRule(path, method);
    if (!rule || rule.scope !== 'channel') {
      return true;
    }

    const key = `rate_limit:channel:${path}:org:${organizationId}:channel:${channelId}`;
    return await this.checkRateLimit(key, rule.config);
  }

  async getRateLimitStatus(organizationId: string, path: string, method: string = 'POST'): Promise<{
    current: number;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const rule = this.findMatchingRule(path, method);
    if (!rule) {
      return { current: 0, limit: 0, remaining: 0, reset: 0 };
    }

    const key = `rate_limit:${rule.scope}:${path}:org:${organizationId}`;
    const current = await this.getCurrentUsage(key, rule.config);
    
    return {
      current,
      limit: rule.config.maxRequests,
      remaining: Math.max(0, rule.config.maxRequests - current),
      reset: this.getResetTime(rule.config.windowMs),
    };
  }
}
