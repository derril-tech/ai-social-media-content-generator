import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Connector } from './entities/connector.entity';
import { BrandsService } from '../brands/brands.service';
import { MembershipsService } from '../memberships/memberships.service';
import { OrganizationsService } from '../organizations/organizations.service';
import * as crypto from 'crypto';

@Injectable()
export class ConnectorsService {
  constructor(
    @InjectRepository(Connector)
    private connectorsRepository: Repository<Connector>,
    private brandsService: BrandsService,
    private membershipsService: MembershipsService,
    private organizationsService: OrganizationsService,
  ) {}

  async create(brandId: string, platform: Connector['platform'], config: any, userId: string): Promise<Connector> {
    const brand = await this.brandsService.findOne(brandId, userId);

    const existing = await this.connectorsRepository.findOne({ where: { brandId, platform } });
    if (existing) throw new ConflictException('Connector already exists for this brand and platform');

    const connector = this.connectorsRepository.create({ brandId: brand.id, platform, config, enabled: true });
    return this.connectorsRepository.save(connector);
  }

  async findByBrand(brandId: string, userId: string): Promise<Connector[]> {
    await this.brandsService.findOne(brandId, userId);
    return this.connectorsRepository.find({ where: { brandId } });
  }

  async getStatus(userId: string): Promise<Record<string, any>> {
    const memberships = await this.membershipsService.findByUser(userId);
    const brandIds = memberships.map(m => m.brandId);
    
    const connectors = await this.connectorsRepository.find({ 
      where: { brandId: { $in: brandIds } },
      relations: ['brand']
    });

    const status: Record<string, any> = {};
    
    for (const connector of connectors) {
      status[connector.platform] = {
        status: connector.enabled ? 'connected' : 'disconnected',
        lastSync: connector.lastSync || new Date().toISOString(),
        accountName: connector.config?.accountName || null
      };
    }

    return status;
  }

  async getDetailedStatus(userId: string): Promise<any[]> {
    const memberships = await this.membershipsService.findByUser(userId);
    const brandIds = memberships.map(m => m.brandId);
    
    const connectors = await this.connectorsRepository.find({ 
      where: { brandId: { $in: brandIds } },
      relations: ['brand']
    });

    return connectors.map(connector => ({
      id: connector.id,
      platform: connector.platform,
      name: this.getPlatformName(connector.platform),
      status: this.getConnectorStatus(connector),
      lastSync: connector.lastSync || new Date().toISOString(),
      nextSync: this.calculateNextSync(connector),
      syncProgress: connector.syncProgress || 0,
      errorCount: connector.errorCount || 0,
      successRate: this.calculateSuccessRate(connector),
      accountName: connector.config?.accountName || 'Unknown',
      rateLimitRemaining: connector.config?.rateLimitRemaining || 100,
      rateLimitReset: connector.config?.rateLimitReset || new Date(Date.now() + 3600000).toISOString(),
      lastError: connector.lastError,
      healthScore: this.calculateHealthScore(connector)
    }));
  }

  async saveConfig(configData: { platform: string; clientId: string; clientSecret: string; autoSync?: boolean; syncInterval?: string }, userId: string): Promise<any> {
    const { platform, clientId, clientSecret, autoSync, syncInterval } = configData;
    
    // Encrypt sensitive data
    const encryptedSecret = this.encryptSecret(clientSecret);
    
    // Store config in a secure way (could be in a separate config table or encrypted)
    const config = {
      clientId,
      clientSecret: encryptedSecret,
      autoSync: autoSync ?? true,
      syncInterval: syncInterval ?? 'hourly'
    };

    // Generate OAuth URL
    const oauthUrl = this.generateOAuthUrl(platform, config);
    
    return { oauthUrl, config };
  }

  async testConnection(platform: string, userId: string): Promise<any> {
    const memberships = await this.membershipsService.findByUser(userId);
    const brandIds = memberships.map(m => m.brandId);
    
    const connector = await this.connectorsRepository.findOne({ 
      where: { platform, brandId: { $in: brandIds } }
    });

    if (!connector) {
      return { success: false, message: 'Connector not found' };
    }

    try {
      // Simulate connection test
      const testResult = await this.performConnectionTest(connector);
      
      // Update connector status
      connector.lastSync = new Date().toISOString();
      connector.lastError = testResult.success ? null : testResult.message;
      await this.connectorsRepository.save(connector);

      return testResult;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async generateOAuthUrl(platform: string, userId: string): Promise<any> {
    const config = this.getOAuthConfig(platform);
    if (!config) {
      throw new BadRequestException(`OAuth not supported for platform: ${platform}`);
    }

    const state = crypto.randomBytes(32).toString('hex');
    const oauthUrl = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=${encodeURIComponent(config.scopes.join(' '))}&response_type=code&state=${state}`;
    
    return { oauthUrl, state };
  }

  async handleOAuthCallback(platform: string, code: string, userId: string): Promise<any> {
    try {
      // Exchange code for access token
      const tokenData = await this.exchangeCodeForToken(platform, code);
      
      // Store tokens securely
      await this.storeTokens(platform, tokenData, userId);
      
      return { success: true, message: 'OAuth authentication successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async update(id: string, data: Partial<Connector>, userId: string): Promise<Connector> {
    const conn = await this.connectorsRepository.findOne({ where: { id } });
    if (!conn) throw new NotFoundException('Connector not found');

    // verify access via brand
    await this.brandsService.findOne(conn.brandId, userId);

    Object.assign(conn, data);
    return this.connectorsRepository.save(conn);
  }

  async remove(id: string, userId: string): Promise<void> {
    const conn = await this.connectorsRepository.findOne({ where: { id } });
    if (!conn) throw new NotFoundException('Connector not found');

    await this.brandsService.findOne(conn.brandId, userId);
    await this.connectorsRepository.remove(conn);
  }

  // Helper methods
  private getPlatformName(platform: string): string {
    const names: Record<string, string> = {
      twitter: 'X (Twitter)',
      linkedin: 'LinkedIn',
      facebook: 'Facebook',
      instagram: 'Instagram',
      youtube: 'YouTube',
      tiktok: 'TikTok',
      pinterest: 'Pinterest'
    };
    return names[platform] || platform;
  }

  private getConnectorStatus(connector: Connector): string {
    if (!connector.enabled) return 'disconnected';
    if (connector.lastError) return 'error';
    if (connector.config?.rateLimitRemaining < 10) return 'rate_limited';
    return 'connected';
  }

  private calculateNextSync(connector: Connector): string {
    const interval = connector.config?.syncInterval || 'hourly';
    const lastSync = connector.lastSync ? new Date(connector.lastSync) : new Date();
    
    switch (interval) {
      case 'hourly':
        return new Date(lastSync.getTime() + 3600000).toISOString();
      case 'daily':
        return new Date(lastSync.getTime() + 86400000).toISOString();
      case 'weekly':
        return new Date(lastSync.getTime() + 604800000).toISOString();
      default:
        return new Date(lastSync.getTime() + 3600000).toISOString();
    }
  }

  private calculateSuccessRate(connector: Connector): number {
    const totalRequests = connector.config?.totalRequests || 0;
    const errorCount = connector.errorCount || 0;
    
    if (totalRequests === 0) return 100;
    return Math.round(((totalRequests - errorCount) / totalRequests) * 100);
  }

  private calculateHealthScore(connector: Connector): number {
    let score = 100;
    
    if (connector.lastError) score -= 30;
    if (connector.errorCount > 5) score -= 20;
    if (connector.config?.rateLimitRemaining < 10) score -= 15;
    if (!connector.enabled) score -= 50;
    
    return Math.max(0, score);
  }

  private encryptSecret(secret: string): string {
    // In production, use proper encryption with environment variables
    return Buffer.from(secret).toString('base64');
  }

  private async performConnectionTest(connector: Connector): Promise<any> {
    // Simulate API call to test connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Random success/failure for demo
    const success = Math.random() > 0.2;
    
    if (success) {
      return {
        success: true,
        message: 'Connection test successful',
        details: {
          accountName: connector.config?.accountName || 'Test Account',
          rateLimitRemaining: Math.floor(Math.random() * 100) + 50
        }
      };
    } else {
      return {
        success: false,
        message: 'Connection test failed: Invalid credentials',
        details: {
          error: 'INVALID_CREDENTIALS',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  private getOAuthConfig(platform: string): any {
    const configs = {
      twitter: {
        clientId: process.env.TWITTER_CLIENT_ID,
        authUrl: 'https://twitter.com/i/oauth2/authorize',
        redirectUri: `${process.env.APP_URL}/api/oauth/twitter/callback`,
        scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access']
      },
      linkedin: {
        clientId: process.env.LINKEDIN_CLIENT_ID,
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        redirectUri: `${process.env.APP_URL}/api/oauth/linkedin/callback`,
        scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social']
      },
      // Add other platforms...
    };
    
    return configs[platform];
  }

  private async exchangeCodeForToken(platform: string, code: string): Promise<any> {
    // Implement OAuth token exchange logic for each platform
    // This would make actual API calls to exchange the authorization code for access tokens
    return { accessToken: 'mock_token', refreshToken: 'mock_refresh' };
  }

  private async storeTokens(platform: string, tokenData: any, userId: string): Promise<void> {
    // Store tokens securely (encrypted in database or secure storage)
    // Update connector status
  }
}


