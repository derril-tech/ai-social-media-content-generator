import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { BrandsService } from '../brands/brands.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { MembershipsService } from '../memberships/memberships.service';
import { UserRole } from '@shared/types';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignsRepository: Repository<Campaign>,
    private brandsService: BrandsService,
    private organizationsService: OrganizationsService,
    private membershipsService: MembershipsService,
  ) {}

  async create(createCampaignDto: CreateCampaignDto, userId: string): Promise<Campaign> {
    const { organizationId, brandId, ...campaignData } = createCampaignDto;

    // Verify user has access to the brand
    await this.brandsService.findOne(brandId, userId);

    // Determine organization ID
    let finalOrganizationId = organizationId;
    if (!finalOrganizationId) {
      // Get organization from the brand
      const brand = await this.brandsService.findOne(brandId, userId);
      finalOrganizationId = brand.organizationId;
    }

    // Verify user has access to the organization
    const membership = await this.membershipsService.findByOrganization(finalOrganizationId)
      .then(memberships => memberships.find(m => m.userId === userId));

    if (!membership) {
      throw new ForbiddenException('You do not have access to this organization');
    }

    // Check if campaign with same name already exists for this brand
    const existingCampaign = await this.campaignsRepository.findOne({
      where: {
        brandId,
        name: campaignData.name,
      },
    });

    if (existingCampaign) {
      throw new BadRequestException('Campaign with this name already exists for this brand');
    }

    // Validate dates if provided
    if (campaignData.startDate && campaignData.endDate) {
      const startDate = new Date(campaignData.startDate);
      const endDate = new Date(campaignData.endDate);

      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    const campaign = this.campaignsRepository.create({
      ...campaignData,
      organizationId: finalOrganizationId,
      brandId,
      settings: campaignData.settings || {},
      performance: {
        totalPosts: 0,
        totalImpressions: 0,
        totalEngagements: 0,
        totalClicks: 0,
        averageCTR: 0,
      },
    });

    return this.campaignsRepository.save(campaign);
  }

  async findAll(userId: string): Promise<Campaign[]> {
    // Get user's accessible organizations
    const userMemberships = await this.membershipsService.findByUser(userId);
    const organizationIds = userMemberships.map(m => m.organizationId);

    if (organizationIds.length === 0) {
      return [];
    }

    return this.campaignsRepository.find({
      where: {
        organizationId: organizationIds as any,
      },
      relations: ['organization', 'brand', 'briefs'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Campaign> {
    const campaign = await this.campaignsRepository.findOne({
      where: { id },
      relations: ['organization', 'brand', 'briefs'],
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    // Verify user has access to this campaign's organization
    const membership = await this.membershipsService.findByOrganization(campaign.organizationId)
      .then(memberships => memberships.find(m => m.userId === userId));

    if (!membership) {
      throw new ForbiddenException('You do not have access to this campaign');
    }

    return campaign;
  }

  async findByOrganization(organizationId: string, userId: string): Promise<Campaign[]> {
    // Check if user has access to the organization
    const membership = await this.membershipsService.findByOrganization(organizationId)
      .then(memberships => memberships.find(m => m.userId === userId));

    if (!membership) {
      throw new ForbiddenException('You do not have access to this organization');
    }

    return this.campaignsRepository.find({
      where: { organizationId },
      relations: ['brand', 'briefs'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByBrand(brandId: string, userId: string): Promise<Campaign[]> {
    // Verify user has access to the brand
    await this.brandsService.findOne(brandId, userId);

    return this.campaignsRepository.find({
      where: { brandId },
      relations: ['organization', 'briefs'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateCampaignDto: UpdateCampaignDto, userId: string): Promise<Campaign> {
    const campaign = await this.findOne(id, userId);

    // Check if user has permission to update (admin or owner role required)
    const membership = await this.membershipsService.findByOrganization(campaign.organizationId)
      .then(memberships => memberships.find(m => m.userId === userId));

    if (!membership || ![UserRole.OWNER, UserRole.ADMIN].includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions to update this campaign');
    }

    // Validate dates if both are provided
    if (updateCampaignDto.startDate && updateCampaignDto.endDate) {
      const startDate = new Date(updateCampaignDto.startDate);
      const endDate = new Date(updateCampaignDto.endDate);

      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    Object.assign(campaign, updateCampaignDto);
    return this.campaignsRepository.save(campaign);
  }

  async remove(id: string, userId: string): Promise<void> {
    const campaign = await this.findOne(id, userId);

    // Check if user has permission to delete (owner role required)
    const membership = await this.membershipsService.findByOrganization(campaign.organizationId)
      .then(memberships => memberships.find(m => m.userId === userId));

    if (!membership || membership.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only organization owners can delete campaigns');
    }

    await this.campaignsRepository.remove(campaign);
  }

  async pause(id: string, userId: string): Promise<Campaign> {
    const campaign = await this.findOne(id, userId);

    // Check permissions
    const membership = await this.membershipsService.findByOrganization(campaign.organizationId)
      .then(memberships => memberships.find(m => m.userId === userId));

    if (!membership || ![UserRole.OWNER, UserRole.ADMIN].includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions to pause this campaign');
    }

    campaign.status = 'paused';
    return this.campaignsRepository.save(campaign);
  }

  async resume(id: string, userId: string): Promise<Campaign> {
    const campaign = await this.findOne(id, userId);

    // Check permissions
    const membership = await this.membershipsService.findByOrganization(campaign.organizationId)
      .then(memberships => memberships.find(m => m.userId === userId));

    if (!membership || ![UserRole.OWNER, UserRole.ADMIN].includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions to resume this campaign');
    }

    campaign.status = 'active';
    return this.campaignsRepository.save(campaign);
  }

  async updatePerformance(id: string, performanceData: any, userId: string): Promise<Campaign> {
    const campaign = await this.findOne(id, userId);

    // Merge performance data
    campaign.performance = {
      ...campaign.performance,
      ...performanceData,
    };

    return this.campaignsRepository.save(campaign);
  }
}
