import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { RateLimitConfig, RateLimitRule } from '../middleware/rate-limit.middleware';

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface BurstControlConfig {
  maxBurst: number;
  burstWindowMs: number;
  recoveryRate: number; // tokens per second
  bucketSize: number;
}

@Injectable()
export class RateLimitService {
  private readonly burstConfigs: Map<string, BurstControlConfig> = new Map([
    ['publish', {
      maxBurst: 50,
      burstWindowMs: 5 * 1000, // 5 seconds
      recoveryRate: 1, // 1 token per second
      bucketSize: 10,
    }],
    ['generate', {
      maxBurst: 100,
      burstWindowMs: 10 * 1000, // 10 seconds
      recoveryRate: 2, // 2 tokens per second
      bucketSize: 20,
    }],
  ]);

  constructor(
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async checkRateLimit(
    key: string,
    config: RateLimitConfig,
    increment: boolean = true
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Check main rate limit
    const mainKey = `${key}:main`;
    const mainCount = await this.redis.zcount(mainKey, windowStart, '+inf');
    
    if (mainCount >= config.maxRequests) {
      const resetTime = this.getResetTime(config.windowMs);
      const retryAfter = Math.ceil((resetTime * 1000 - now) / 1000);
      
      return {
        allowed: false,
        current: mainCount,
        limit: config.maxRequests,
        remaining: 0,
        reset: resetTime,
        retryAfter: Math.max(1, retryAfter),
      };
    }
    
    // Check burst limit if configured
    if (config.burstLimit && config.burstWindowMs) {
      const burstWindowStart = now - config.burstWindowMs;
      const burstKey = `${key}:burst`;
      const burstCount = await this.redis.zcount(burstKey, burstWindowStart, '+inf');
      
      if (burstCount >= config.burstLimit) {
        const resetTime = this.getResetTime(config.burstWindowMs);
        const retryAfter = Math.ceil((resetTime * 1000 - now) / 1000);
        
        return {
          allowed: false,
          current: burstCount,
          limit: config.burstLimit,
          remaining: 0,
          reset: resetTime,
          retryAfter: Math.max(1, retryAfter),
        };
      }
    }
    
    // Increment counters if requested
    if (increment) {
      await this.redis.zadd(mainKey, now, `${now}-${Math.random()}`);
      await this.redis.expire(mainKey, Math.ceil(config.windowMs / 1000));
      
      if (config.burstLimit && config.burstWindowMs) {
        const burstKey = `${key}:burst`;
        await this.redis.zadd(burstKey, now, `${now}-${Math.random()}`);
        await this.redis.expire(burstKey, Math.ceil(config.burstWindowMs / 1000));
      }
    }
    
    return {
      allowed: true,
      current: mainCount + (increment ? 1 : 0),
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - (mainCount + (increment ? 1 : 0))),
      reset: this.getResetTime(config.windowMs),
    };
  }

  async checkBurstControl(
    operationType: string,
    organizationId: string,
    channelId?: string
  ): Promise<RateLimitResult> {
    const config = this.burstConfigs.get(operationType);
    if (!config) {
      return { allowed: true, current: 0, limit: 0, remaining: 0, reset: 0 };
    }

    const key = channelId 
      ? `burst:${operationType}:org:${organizationId}:channel:${channelId}`
      : `burst:${operationType}:org:${organizationId}`;

    return await this.checkTokenBucket(key, config);
  }

  private async checkTokenBucket(
    key: string,
    config: BurstControlConfig
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const lastRefillKey = `${key}:last_refill`;
    const tokensKey = `${key}:tokens`;
    
    // Get last refill time and current tokens
    const [lastRefillStr, tokensStr] = await Promise.all([
      this.redis.get(lastRefillKey),
      this.redis.get(tokensKey),
    ]);
    
    const lastRefill = lastRefillStr ? parseInt(lastRefillStr) : now;
    const currentTokens = tokensStr ? parseFloat(tokensStr) : config.bucketSize;
    
    // Calculate new tokens based on time passed
    const timePassed = (now - lastRefill) / 1000; // seconds
    const newTokens = Math.min(
      config.bucketSize,
      currentTokens + (timePassed * config.recoveryRate)
    );
    
    // Check if we have enough tokens
    if (newTokens < 1) {
      const timeToNextToken = (1 - newTokens) / config.recoveryRate;
      const resetTime = Math.ceil((now + timeToNextToken * 1000) / 1000);
      
      return {
        allowed: false,
        current: Math.ceil(newTokens),
        limit: config.bucketSize,
        remaining: 0,
        reset: resetTime,
        retryAfter: Math.ceil(timeToNextToken),
      };
    }
    
    // Consume one token
    const remainingTokens = newTokens - 1;
    
    // Update Redis atomically
    const pipeline = this.redis.pipeline();
    pipeline.set(lastRefillKey, now.toString());
    pipeline.set(tokensKey, remainingTokens.toString());
    pipeline.expire(lastRefillKey, Math.ceil(config.burstWindowMs / 1000));
    pipeline.expire(tokensKey, Math.ceil(config.burstWindowMs / 1000));
    await pipeline.exec();
    
    return {
      allowed: true,
      current: Math.ceil(remainingTokens),
      limit: config.bucketSize,
      remaining: Math.ceil(remainingTokens),
      reset: this.getResetTime(config.burstWindowMs),
    };
  }

  async getRateLimitStatus(
    key: string,
    config: RateLimitConfig
  ): Promise<{
    current: number;
    limit: number;
    remaining: number;
    reset: number;
    burst?: {
      current: number;
      limit: number;
      remaining: number;
    };
  }> {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    const mainKey = `${key}:main`;
    const current = await this.redis.zcount(mainKey, windowStart, '+inf');
    
    const result: any = {
      current,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - current),
      reset: this.getResetTime(config.windowMs),
    };
    
    // Add burst information if configured
    if (config.burstLimit && config.burstWindowMs) {
      const burstWindowStart = now - config.burstWindowMs;
      const burstKey = `${key}:burst`;
      const burstCurrent = await this.redis.zcount(burstKey, burstWindowStart, '+inf');
      
      result.burst = {
        current: burstCurrent,
        limit: config.burstLimit,
        remaining: Math.max(0, config.burstLimit - burstCurrent),
      };
    }
    
    return result;
  }

  async resetRateLimit(key: string): Promise<void> {
    const mainKey = `${key}:main`;
    const burstKey = `${key}:burst`;
    
    await Promise.all([
      this.redis.del(mainKey),
      this.redis.del(burstKey),
    ]);
  }

  async getRateLimitKeys(organizationId: string): Promise<string[]> {
    const pattern = `rate_limit:*:org:${organizationId}`;
    return await this.redis.keys(pattern);
  }

  async getRateLimitStats(organizationId: string): Promise<{
    totalKeys: number;
    activeLimits: Array<{
      key: string;
      current: number;
      limit: number;
      remaining: number;
      reset: number;
    }>;
  }> {
    const keys = await this.getRateLimitKeys(organizationId);
    const activeLimits = [];
    
    for (const key of keys) {
      try {
        const current = await this.redis.zcard(key);
        // Extract limit from key pattern (this is a simplified approach)
        const limit = this.extractLimitFromKey(key);
        
        activeLimits.push({
          key,
          current,
          limit,
          remaining: Math.max(0, limit - current),
          reset: this.getResetTime(60 * 1000), // Default 1 minute
        });
      } catch (error) {
        console.error(`Error getting stats for key ${key}:`, error);
      }
    }
    
    return {
      totalKeys: keys.length,
      activeLimits,
    };
  }

  private extractLimitFromKey(key: string): number {
    // Extract limit from key pattern
    // This is a simplified approach - in practice, you might store limits separately
    if (key.includes('generate')) return 10;
    if (key.includes('publish')) return 5;
    if (key.includes('connectors')) return 20;
    if (key.includes('auth')) return 5;
    return 10; // Default
  }

  private getResetTime(windowMs: number): number {
    return Math.ceil((Date.now() + windowMs) / 1000);
  }

  // Utility methods for testing and monitoring
  async simulateRateLimit(
    key: string,
    config: RateLimitConfig,
    requests: number
  ): Promise<{
    successful: number;
    blocked: number;
    results: RateLimitResult[];
  }> {
    const results: RateLimitResult[] = [];
    let successful = 0;
    let blocked = 0;
    
    for (let i = 0; i < requests; i++) {
      const result = await this.checkRateLimit(key, config, true);
      results.push(result);
      
      if (result.allowed) {
        successful++;
      } else {
        blocked++;
      }
      
      // Small delay to simulate real requests
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return { successful, blocked, results };
  }

  async getBurstControlStatus(
    operationType: string,
    organizationId: string,
    channelId?: string
  ): Promise<{
    operationType: string;
    organizationId: string;
    channelId?: string;
    config: BurstControlConfig;
    currentTokens: number;
    lastRefill: number;
    timeToNextToken: number;
  }> {
    const config = this.burstConfigs.get(operationType);
    if (!config) {
      throw new Error(`No burst control config found for operation type: ${operationType}`);
    }

    const key = channelId 
      ? `burst:${operationType}:org:${organizationId}:channel:${channelId}`
      : `burst:${operationType}:org:${organizationId}`;

    const lastRefillKey = `${key}:last_refill`;
    const tokensKey = `${key}:tokens`;
    
    const [lastRefillStr, tokensStr] = await Promise.all([
      this.redis.get(lastRefillKey),
      this.redis.get(tokensKey),
    ]);
    
    const lastRefill = lastRefillStr ? parseInt(lastRefillStr) : Date.now();
    const currentTokens = tokensStr ? parseFloat(tokensStr) : config.bucketSize;
    
    const now = Date.now();
    const timePassed = (now - lastRefill) / 1000;
    const newTokens = Math.min(
      config.bucketSize,
      currentTokens + (timePassed * config.recoveryRate)
    );
    
    const timeToNextToken = newTokens >= config.bucketSize ? 0 : (1 - newTokens) / config.recoveryRate;
    
    return {
      operationType,
      organizationId,
      channelId,
      config,
      currentTokens: newTokens,
      lastRefill,
      timeToNextToken: Math.max(0, timeToNextToken),
    };
  }
}
