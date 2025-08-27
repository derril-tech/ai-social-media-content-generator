import { Injectable, Logger, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ShareLink, ShareLinkStatus, ShareLinkType, WatermarkConfig } from '../entities/share-link.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { User } from '../../users/entities/user.entity';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

export interface CreateShareLinkRequest {
  title: string;
  description?: string;
  type: ShareLinkType;
  resourceData: Record<string, any>;
  expiresAt?: Date;
  maxViews?: number;
  requirePassword?: boolean;
  password?: string;
  watermarkConfig?: Partial<WatermarkConfig>;
  allowDownload?: boolean;
  allowComments?: boolean;
  customDomain?: string;
  metadata?: Record<string, any>;
}

export interface ShareLinkAccessRequest {
  token: string;
  password?: string;
  ipAddress: string;
  userAgent: string;
  action: 'view' | 'download' | 'comment';
}

export interface ShareLinkStats {
  totalViews: number;
  uniqueVisitors: number;
  downloads: number;
  comments: number;
  lastAccessed: Date | null;
  topReferrers: Array<{ referrer: string; count: number }>;
  accessByCountry: Array<{ country: string; count: number }>;
}

@Injectable()
export class ShareLinkService {
  private readonly logger = new Logger(ShareLinkService.name);

  constructor(
    @InjectRepository(ShareLink)
    private readonly shareLinkRepository: Repository<ShareLink>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createShareLink(
    organizationId: string,
    createdById: string,
    request: CreateShareLinkRequest,
  ): Promise<ShareLink> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }

    const user = await this.userRepository.findOne({
      where: { id: createdById },
    });

    if (!user) {
      throw new NotFoundException(`User ${createdById} not found`);
    }

    // Generate unique token
    const token = this.generateToken();

    // Hash password if required
    let passwordHash: string | null = null;
    if (request.requirePassword && request.password) {
      passwordHash = await bcrypt.hash(request.password, 10);
    }

    // Set default watermark config
    const defaultWatermarkConfig: WatermarkConfig = {
      enabled: true,
      text: `${organization.name} - Preview`,
      position: 'bottom-right',
      opacity: 0.7,
      fontSize: 16,
      color: '#000000',
      includeTimestamp: true,
      includeUserInfo: false,
    };

    const watermarkConfig = {
      ...defaultWatermarkConfig,
      ...request.watermarkConfig,
    };

    const shareLink = this.shareLinkRepository.create({
      token,
      title: request.title,
      description: request.description,
      type: request.type,
      resourceData: request.resourceData,
      expiresAt: request.expiresAt,
      maxViews: request.maxViews || 0,
      requirePassword: request.requirePassword || false,
      passwordHash,
      watermarkConfig,
      allowDownload: request.allowDownload !== false,
      allowComments: request.allowComments || false,
      customDomain: request.customDomain,
      metadata: request.metadata || {},
      organizationId,
      createdById,
    });

    return await this.shareLinkRepository.save(shareLink);
  }

  async accessShareLink(request: ShareLinkAccessRequest): Promise<{
    shareLink: ShareLink;
    watermarkData?: any;
  }> {
    const shareLink = await this.shareLinkRepository.findOne({
      where: { token: request.token },
      relations: ['organization', 'createdBy'],
    });

    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    // Check if link is active
    if (shareLink.status !== ShareLinkStatus.ACTIVE) {
      throw new BadRequestException('Share link is not active');
    }

    // Check expiration
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      await this.updateShareLinkStatus(shareLink.id, ShareLinkStatus.EXPIRED);
      throw new BadRequestException('Share link has expired');
    }

    // Check view limit
    if (shareLink.maxViews > 0 && shareLink.currentViews >= shareLink.maxViews) {
      throw new BadRequestException('Share link view limit reached');
    }

    // Check password if required
    if (shareLink.requirePassword) {
      if (!request.password) {
        throw new UnauthorizedException('Password required');
      }

      if (!shareLink.passwordHash || !(await bcrypt.compare(request.password, shareLink.passwordHash))) {
        throw new UnauthorizedException('Invalid password');
      }
    }

    // Log access
    await this.logAccess(shareLink.id, request);

    // Generate watermark data if enabled
    let watermarkData: any = null;
    if (shareLink.watermarkConfig.enabled) {
      watermarkData = this.generateWatermarkData(shareLink);
    }

    return { shareLink, watermarkData };
  }

  async getShareLinkStats(shareLinkId: string, organizationId: string): Promise<ShareLinkStats> {
    const shareLink = await this.shareLinkRepository.findOne({
      where: { id: shareLinkId, organizationId },
    });

    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    const accessLog = shareLink.accessLog || [];
    
    // Calculate unique visitors (by IP)
    const uniqueIPs = new Set(accessLog.map(log => log.ipAddress));
    
    // Count downloads and comments
    const downloads = accessLog.filter(log => log.action === 'download').length;
    const comments = accessLog.filter(log => log.action === 'comment').length;
    
    // Get top referrers (simplified - in real app, you'd extract from referrer headers)
    const referrerCounts: Record<string, number> = {};
    accessLog.forEach(log => {
      const referrer = log.userAgent.split(' ')[0] || 'Unknown'; // Simplified
      referrerCounts[referrer] = (referrerCounts[referrer] || 0) + 1;
    });
    
    const topReferrers = Object.entries(referrerCounts)
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Mock country data (in real app, you'd use IP geolocation)
    const accessByCountry = [
      { country: 'United States', count: Math.floor(accessLog.length * 0.6) },
      { country: 'Canada', count: Math.floor(accessLog.length * 0.2) },
      { country: 'United Kingdom', count: Math.floor(accessLog.length * 0.1) },
      { country: 'Germany', count: Math.floor(accessLog.length * 0.05) },
      { country: 'Other', count: Math.floor(accessLog.length * 0.05) },
    ];

    return {
      totalViews: shareLink.currentViews,
      uniqueVisitors: uniqueIPs.size,
      downloads,
      comments,
      lastAccessed: shareLink.lastAccessedAt,
      topReferrers,
      accessByCountry,
    };
  }

  async listShareLinks(
    organizationId: string,
    userId?: string,
    type?: ShareLinkType,
    status?: ShareLinkStatus,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ shareLinks: ShareLink[]; total: number }> {
    const queryBuilder = this.shareLinkRepository
      .createQueryBuilder('shareLink')
      .where('shareLink.organizationId = :organizationId', { organizationId })
      .orderBy('shareLink.createdAt', 'DESC');

    if (userId) {
      queryBuilder.andWhere('shareLink.createdById = :userId', { userId });
    }

    if (type) {
      queryBuilder.andWhere('shareLink.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('shareLink.status = :status', { status });
    }

    const [shareLinks, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return { shareLinks, total };
  }

  async updateShareLink(
    shareLinkId: string,
    organizationId: string,
    updates: Partial<CreateShareLinkRequest>,
  ): Promise<ShareLink> {
    const shareLink = await this.shareLinkRepository.findOne({
      where: { id: shareLinkId, organizationId },
    });

    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    // Update password if provided
    if (updates.password && updates.requirePassword) {
      updates.passwordHash = await bcrypt.hash(updates.password, 10);
    }

    // Update watermark config
    if (updates.watermarkConfig) {
      shareLink.watermarkConfig = {
        ...shareLink.watermarkConfig,
        ...updates.watermarkConfig,
      };
    }

    Object.assign(shareLink, updates);
    delete (shareLink as any).password; // Remove password from entity

    return await this.shareLinkRepository.save(shareLink);
  }

  async revokeShareLink(shareLinkId: string, organizationId: string): Promise<void> {
    const shareLink = await this.shareLinkRepository.findOne({
      where: { id: shareLinkId, organizationId },
    });

    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    shareLink.status = ShareLinkStatus.REVOKED;
    await this.shareLinkRepository.save(shareLink);
  }

  async cleanupExpiredLinks(): Promise<number> {
    const expiredLinks = await this.shareLinkRepository.find({
      where: {
        status: ShareLinkStatus.ACTIVE,
        expiresAt: LessThan(new Date()),
      },
    });

    for (const link of expiredLinks) {
      link.status = ShareLinkStatus.EXPIRED;
    }

    await this.shareLinkRepository.save(expiredLinks);
    return expiredLinks.length;
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async logAccess(
    shareLinkId: string,
    request: ShareLinkAccessRequest,
  ): Promise<void> {
    const shareLink = await this.shareLinkRepository.findOne({
      where: { id: shareLinkId },
    });

    if (!shareLink) return;

    // Update view count
    shareLink.currentViews += 1;
    shareLink.lastAccessedAt = new Date();

    // Add to access log
    const accessEntry = {
      timestamp: new Date(),
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      action: request.action,
    };

    shareLink.accessLog = [...(shareLink.accessLog || []), accessEntry];

    await this.shareLinkRepository.save(shareLink);
  }

  private async updateShareLinkStatus(
    shareLinkId: string,
    status: ShareLinkStatus,
  ): Promise<void> {
    await this.shareLinkRepository.update(shareLinkId, { status });
  }

  private generateWatermarkData(shareLink: ShareLink): any {
    const config = shareLink.watermarkConfig;
    const timestamp = new Date().toISOString();
    
    let watermarkText = config.text || 'Preview';
    
    if (config.includeTimestamp) {
      watermarkText += ` - ${timestamp}`;
    }
    
    if (config.includeUserInfo && shareLink.createdBy) {
      watermarkText += ` - Shared by ${shareLink.createdBy.name || shareLink.createdBy.email}`;
    }

    return {
      text: watermarkText,
      position: config.position,
      opacity: config.opacity,
      fontSize: config.fontSize,
      color: config.color,
      organization: shareLink.organization?.name,
      createdAt: shareLink.createdAt,
    };
  }
}
