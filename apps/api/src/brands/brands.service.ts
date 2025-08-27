import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { OrganizationsService } from '../organizations/organizations.service';
import { MembershipsService } from '../memberships/memberships.service';
import { UserRole } from '@shared/types';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private brandsRepository: Repository<Brand>,
    private organizationsService: OrganizationsService,
    private membershipsService: MembershipsService,
  ) {}

  async create(createBrandDto: CreateBrandDto, userId: string): Promise<Brand> {
    const { organizationId, ...brandData } = createBrandDto;

    // Determine organization ID
    let finalOrganizationId = organizationId;
    if (!finalOrganizationId) {
      // Get user's organizations and use the first one (current organization)
      const userMemberships = await this.membershipsService.findByUser(userId);
      if (userMemberships.length === 0) {
        throw new ForbiddenException('User is not a member of any organization');
      }
      finalOrganizationId = userMemberships[0].organizationId;
    }

    // Verify user has access to the organization
    const membership = await this.membershipsService.findByOrganization(finalOrganizationId)
      .then(memberships => memberships.find(m => m.userId === userId));

    if (!membership) {
      throw new ForbiddenException('You do not have access to this organization');
    }

    // Verify organization exists
    await this.organizationsService.findOne(finalOrganizationId);

    const brand = this.brandsRepository.create({
      ...brandData,
      organizationId: finalOrganizationId,
    });

    return this.brandsRepository.save(brand);
  }

  async findAll(userId: string): Promise<Brand[]> {
    // Get user's organizations
    const userMemberships = await this.membershipsService.findByUser(userId);
    const organizationIds = userMemberships.map(m => m.organizationId);

    if (organizationIds.length === 0) {
      return [];
    }

    return this.brandsRepository.find({
      where: {
        organizationId: organizationIds as any,
      },
      relations: ['organization'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Brand> {
    const brand = await this.brandsRepository.findOne({
      where: { id },
      relations: ['organization', 'campaigns', 'connectors'],
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    // Check if user has access to this brand's organization
    const membership = await this.membershipsService.findByOrganization(brand.organizationId)
      .then(memberships => memberships.find(m => m.userId === userId));

    if (!membership) {
      throw new ForbiddenException('You do not have access to this brand');
    }

    return brand;
  }

  async findByOrganization(organizationId: string, userId: string): Promise<Brand[]> {
    // Check if user has access to the organization
    const membership = await this.membershipsService.findByOrganization(organizationId)
      .then(memberships => memberships.find(m => m.userId === userId));

    if (!membership) {
      throw new ForbiddenException('You do not have access to this organization');
    }

    return this.brandsRepository.find({
      where: { organizationId },
      relations: ['organization'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateBrandDto: UpdateBrandDto, userId: string): Promise<Brand> {
    const brand = await this.findOne(id, userId);

    // Check if user has permission to update (admin or owner role required)
    const membership = await this.membershipsService.findByOrganization(brand.organizationId)
      .then(memberships => memberships.find(m => m.userId === userId));

    if (!membership || ![UserRole.OWNER, UserRole.ADMIN].includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions to update this brand');
    }

    Object.assign(brand, updateBrandDto);
    return this.brandsRepository.save(brand);
  }

  async remove(id: string, userId: string): Promise<void> {
    const brand = await this.findOne(id, userId);

    // Check if user has permission to delete (owner role required)
    const membership = await this.membershipsService.findByOrganization(brand.organizationId)
      .then(memberships => memberships.find(m => m.userId === userId));

    if (!membership || membership.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only organization owners can delete brands');
    }

    await this.brandsRepository.remove(brand);
  }
}
