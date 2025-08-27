import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brief } from './entities/brief.entity';
import { CreateBriefDto } from './dto/create-brief.dto';
import { UpdateBriefDto } from './dto/update-brief.dto';
import { CampaignsService } from '../campaigns/campaigns.service';
import { MembershipsService } from '../memberships/memberships.service';
import { UserRole, Platform, Tone } from '@shared/types';

@Injectable()
export class BriefsService {
  constructor(
    @InjectRepository(Brief)
    private briefsRepository: Repository<Brief>,
    private campaignsService: CampaignsService,
    private membershipsService: MembershipsService,
  ) {}

  async create(createBriefDto: CreateBriefDto, userId: string): Promise<Brief> {
    const { campaignId, ...briefData } = createBriefDto;

    // Verify user has access to the campaign
    await this.campaignsService.findOne(campaignId, userId);

    // Validate platform and tone combinations
    this.validateBriefParameters(briefData);

    const brief = this.briefsRepository.create({
      ...briefData,
      campaignId,
      status: 'draft',
      languages: briefData.languages || ['en'],
      platforms: briefData.platforms || [],
      regions: briefData.regions || [],
      competitors: briefData.competitors || [],
      constraints: briefData.constraints || [],
      detailedConstraints: briefData.detailedConstraints || {},
      metadata: briefData.metadata || {},
      generationStats: {},
    });

    return this.briefsRepository.save(brief);
  }

  async findAll(userId: string): Promise<Brief[]> {
    // Get user's accessible organizations
    const userMemberships = await this.membershipsService.findByUser(userId);
    const organizationIds = userMemberships.map(m => m.organizationId);

    if (organizationIds.length === 0) {
      return [];
    }

    return this.briefsRepository.find({
      where: {
        campaign: {
          organizationId: organizationIds as any,
        },
      },
      relations: ['campaign', 'campaign.brand', 'campaign.organization', 'posts'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Brief> {
    const brief = await this.briefsRepository.findOne({
      where: { id },
      relations: ['campaign', 'campaign.brand', 'campaign.organization', 'posts'],
    });

    if (!brief) {
      throw new NotFoundException(`Brief with ID ${id} not found`);
    }

    // Verify user has access to this brief's campaign
    await this.campaignsService.findOne(brief.campaignId, userId);

    return brief;
  }

  async findByCampaign(campaignId: string, userId: string): Promise<Brief[]> {
    // Verify user has access to the campaign
    await this.campaignsService.findOne(campaignId, userId);

    return this.briefsRepository.find({
      where: { campaignId },
      relations: ['campaign', 'posts'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateBriefDto: UpdateBriefDto, userId: string): Promise<Brief> {
    const brief = await this.findOne(id, userId);

    // Check if user has permission to update
    const campaign = await this.campaignsService.findOne(brief.campaignId, userId);
    const membership = await this.membershipsService.findByOrganization(campaign.organizationId)
      .then(memberships => memberships.find(m => m.userId === userId));

    if (!membership || ![UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR].includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions to update this brief');
    }

    // Validate updated parameters
    if (updateBriefDto.platforms || updateBriefDto.tone) {
      this.validateBriefParameters({
        ...brief,
        ...updateBriefDto,
      });
    }

    Object.assign(brief, updateBriefDto);
    return this.briefsRepository.save(brief);
  }

  async remove(id: string, userId: string): Promise<void> {
    const brief = await this.findOne(id, userId);

    // Check if user has permission to delete (owner or admin role required)
    const campaign = await this.campaignsService.findOne(brief.campaignId, userId);
    const membership = await this.membershipsService.findByOrganization(campaign.organizationId)
      .then(memberships => memberships.find(m => m.userId === userId));

    if (!membership || ![UserRole.OWNER, UserRole.ADMIN].includes(membership.role)) {
      throw new ForbiddenException('Only organization owners and admins can delete briefs');
    }

    await this.briefsRepository.remove(brief);
  }

  async markReady(id: string, userId: string): Promise<Brief> {
    const brief = await this.findOne(id, userId);

    // Check permissions
    const campaign = await this.campaignsService.findOne(brief.campaignId, userId);
    const membership = await this.membershipsService.findByOrganization(campaign.organizationId)
      .then(memberships => memberships.find(m => m.userId === userId));

    if (!membership || ![UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR].includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions to mark brief as ready');
    }

    // Validate that brief has required fields
    this.validateBriefCompleteness(brief);

    brief.status = 'ready';
    return this.briefsRepository.save(brief);
  }

  async startGeneration(id: string, userId: string): Promise<Brief> {
    const brief = await this.findOne(id, userId);

    if (brief.status !== 'ready') {
      throw new BadRequestException('Brief must be in ready status to start generation');
    }

    brief.status = 'generating';
    return this.briefsRepository.save(brief);
  }

  async completeGeneration(id: string, stats?: any, userId?: string): Promise<Brief> {
    const brief = await this.briefsRepository.findOne({
      where: { id },
    });

    if (!brief) {
      throw new NotFoundException(`Brief with ID ${id} not found`);
    }

    brief.status = 'completed';
    brief.generationStats = {
      ...brief.generationStats,
      generatedAt: new Date(),
      ...stats,
    };

    return this.briefsRepository.save(brief);
  }

  async failGeneration(id: string, errorMessage: string): Promise<Brief> {
    const brief = await this.briefsRepository.findOne({
      where: { id },
    });

    if (!brief) {
      throw new NotFoundException(`Brief with ID ${id} not found`);
    }

    brief.status = 'failed';
    brief.errorMessage = errorMessage;
    return this.briefsRepository.save(brief);
  }

  private validateBriefParameters(briefData: Partial<CreateBriefDto & UpdateBriefDto>): void {
    // Validate platform-specific constraints
    if (briefData.platforms && briefData.platforms.length > 0) {
      const validPlatforms: Platform[] = ['twitter', 'linkedin', 'instagram', 'facebook', 'tiktok', 'youtube', 'threads', 'pinterest'];

      for (const platform of briefData.platforms) {
        if (!validPlatforms.includes(platform)) {
          throw new BadRequestException(`Invalid platform: ${platform}`);
        }
      }
    }

    // Validate tone
    if (briefData.tone) {
      const validTones: Tone[] = ['professional', 'casual', 'humorous', 'educational', 'promotional', 'controversial'];

      if (!validTones.includes(briefData.tone)) {
        throw new BadRequestException(`Invalid tone: ${briefData.tone}`);
      }
    }

    // Validate language codes (basic check)
    if (briefData.languages && briefData.languages.length > 0) {
      const languageRegex = /^[a-z]{2,3}(-[A-Z]{2})?$/;

      for (const language of briefData.languages) {
        if (!languageRegex.test(language)) {
          throw new BadRequestException(`Invalid language code: ${language}`);
        }
      }
    }
  }

  private validateBriefCompleteness(brief: Brief): void {
    if (!brief.topic || brief.topic.trim().length < 5) {
      throw new BadRequestException('Brief must have a topic with at least 5 characters');
    }

    if (!brief.platforms || brief.platforms.length === 0) {
      throw new BadRequestException('Brief must specify at least one target platform');
    }

    if (!brief.languages || brief.languages.length === 0) {
      throw new BadRequestException('Brief must specify at least one language');
    }
  }
}
